import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { PrismaClient } from "@prisma/client";
import { validatePasswordStrength } from "../middleware/securityMiddleware.js";

const prisma = new PrismaClient();

// Helper function to get recent activity for a student
const getStudentActivity = async (studentId) => {
  // Get enrollments for student
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: {
        select: { title: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  // Get progress records for student
  const progressRecords = await prisma.progress.findMany({
    where: { studentId },
    include: {
      lesson: {
        include: {
          module: {
            include: {
              course: {
                select: { title: true }
              }
            }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 20
  });

  // Get quiz attempts for student
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { studentId },
    include: {
      quiz: {
        include: {
          course: {
            select: { title: true }
          }
        }
      }
    },
    orderBy: { completedAt: 'desc' },
    take: 20
  });

  // Combine and format activity
  const enrollmentActivity = enrollments.map(enrollment => ({
    date: enrollment.createdAt.toISOString().split('T')[0],
    activity: 'Enrolled',
    course: enrollment.course.title,
    status: enrollment.status
  }));

  const progressActivity = progressRecords.map(progress => ({
    date: progress.updatedAt.toISOString().split('T')[0],
    activity: progress.status === 'completed' ? 'Completed lesson' : 'Started lesson',
    course: progress.lesson.module.course.title,
    status: progress.status
  }));

  const quizActivity = quizAttempts.map(attempt => ({
    date: attempt.completedAt.toISOString().split('T')[0],
    activity: 'Took quiz',
    course: attempt.quiz.course.title,
    status: `Score: ${attempt.score}%`
  }));

  return [...enrollmentActivity, ...progressActivity, ...quizActivity]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { role, status } = req.query;

    // Build where clause for filtering
    const where = {};
    if (role && role !== 'All Roles') {
      where.role = role.toLowerCase();
    }
    if (status && status !== 'All Statuses') {
      where.status = status.toLowerCase();
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        isVerified: true,
        _count: {
          select: {
            courses: true,
            enrollments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data to match frontend expectations
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      joinDate: user.createdAt.toISOString().split('T')[0],
      lastUpdated: user.createdAt.toISOString(),
      courses: user._count.courses,
      enrollments: user._count.enrollments,
      completed: 0, // Will be calculated from progress if needed
      lastLogin: null // Not tracked in current schema
    }));

    res.json({ success: true, users: transformedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get user by ID (admin only)
export const getUserById = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        isVerified: true,
        _count: {
          select: {
            courses: true,
            enrollments: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch activity data based on user role
    let activity = [];

    if (user.role === 'student') {
      // Get enrollments for student
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: parseInt(id) },
        include: {
          course: {
            select: { title: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      // Get progress records for student
      const progressRecords = await prisma.progress.findMany({
        where: { studentId: parseInt(id) },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: {
                    select: { title: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 20
      });

      // Combine and format activity
      const enrollmentActivity = enrollments.map(enrollment => ({
        date: enrollment.createdAt.toISOString().split('T')[0],
        activity: 'Enrolled',
        course: enrollment.course.title,
        status: enrollment.status
      }));

      const progressActivity = progressRecords.map(progress => ({
        date: progress.updatedAt.toISOString().split('T')[0],
        activity: progress.status === 'completed' ? 'Completed lesson' : 'Started lesson',
        course: progress.lesson.module.course.title,
        status: progress.status
      }));

      activity = [...enrollmentActivity, ...progressActivity]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);

    } else if (user.role === 'instructor') {
      // Get courses created by instructor
      const courses = await prisma.course.findMany({
        where: { instructorId: parseInt(id) },
        select: {
          title: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      activity = courses.map(course => ({
        date: course.createdAt.toISOString().split('T')[0],
        activity: 'Created course',
        course: course.title,
        status: course.status
      }));
    }

    // Transform data to match frontend expectations
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      joinDate: user.createdAt.toISOString().split('T')[0],
      lastUpdated: user.createdAt.toISOString(),
      courses: user._count.courses,
      enrollments: user._count.enrollments,
      completed: 0, // Will be calculated from progress if needed
      lastLogin: null, // Not tracked in current schema
      activity: activity
    };

    res.json({ success: true, user: transformedUser });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Update user status (admin only)
export const updateUserStatus = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Failed to update user status" });
  }
};

// Get users metrics (admin only)
export const getUsersMetrics = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'active' } });
    const instructors = await prisma.user.count({ where: { role: 'instructor' } });
    const students = await prisma.user.count({ where: { role: 'student' } });

    res.json({
      success: true,
      metrics: {
        totalUsers,
        activeUsers,
        instructors,
        students
      }
    });
  } catch (error) {
    console.error("Error fetching users metrics:", error);
    res.status(500).json({ error: "Failed to fetch users metrics" });
  }
};

// Get courses metrics (admin only)
export const getCoursesMetrics = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const totalCourses = await prisma.course.count();
    const publishedCourses = await prisma.course.count({ where: { status: 'published' } });
    const pendingCourses = await prisma.course.count({ where: { status: 'pending_approval' } });
    const totalEnrollments = await prisma.enrollment.count();

    // New logic: count completed courses from CourseCompletion table
    const completedCoursesCount = await prisma.courseCompletion.count();

    res.json({
      success: true,
      metrics: {
        totalCourses,
        activeCourses: publishedCourses,
        pendingApprovals: pendingCourses,
        totalEnrollments,
        completedCourses: completedCoursesCount
      }
    });
  } catch (error) {
    console.error("Error fetching courses metrics:", error);
    res.status(500).json({ error: "Failed to fetch courses metrics" });
  }
};

// Create user by admin (admin only)
export const createUserByAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { name, email, role } = req.body;

    // Basic validation
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: "Name, email, and role are required" });
    }

    // Validate role (only instructor or admin allowed)
    if (!['instructor', 'admin'].includes(role.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Role must be either 'instructor' or 'admin'" });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Generate random password (12 characters: letters, numbers, symbols)
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role.toLowerCase(),
        status: 'active',
        isVerified: true, // Admin-created users are pre-verified
        emailVerifiedAt: new Date(),
      },
    });

    // Send notification email
    try {
      const { sendAdminCreatedUserEmail } = await import("../utils/emailService.js");
      await sendAdminCreatedUserEmail(email, name, role, plainPassword);
      console.log("📧 Admin-created user email sent to:", email);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      // Don't fail the user creation if email fails, but log it
    }

    console.log("✅ New user created by admin:", newUser.email);

    res.status(201).json({
      success: true,
      message: "User created successfully. Notification email sent.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error("❌ Admin user creation error:", error);
    res.status(500).json({ success: false, message: `Failed to create user: ${error.message}` });
  }
};

// Update student profile (authenticated user only)
export const updateProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { name, password, confirmPassword, bio } = req.body;

    // Validation
    if (password && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    // Prepare update data
    const updateData = {};

    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio; // Allow empty bio

    // Handle password update
    if (password) {
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ success: false, message: passwordCheck.message });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Handle profile picture upload
    if (req.file) {
      try {
        const cloudinaryUrl = await uploadToCloudinary(req.file, "qatan/profile-pictures");
        updateData.profilePicture = cloudinaryUrl;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ success: false, message: "Failed to upload profile picture" });
      }
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        bio: true,
        role: true,
        status: true
      }
    });

    console.log("✅ Profile updated for user:", updatedUser.email);

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: updatedUser
    });
  } catch (error) {
    console.error("❌ Profile update error:", error);
    res.status(500).json({ success: false, message: `Failed to update profile: ${error.message}` });
  }
};

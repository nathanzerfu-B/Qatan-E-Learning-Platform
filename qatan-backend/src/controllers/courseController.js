import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";

const prisma = new PrismaClient();

export const getPopularCourses = async (req, res) => {
  try {
    // Fetch courses ordered by total enrollments count in descending order
    // Limit to top 4 courses for popular section
    const popularCourses = await prisma.course.findMany({
      where: { status: 'published' },
      include: {
        instructor: {
          select: { id: true, name: true }
        },
        _count: {
          select: { enrollments: true },
        }
      },
      orderBy: {
        enrollments: {
          _count: 'desc'
        }
      },
      take: 4
    });

    res.json({ success: true, courses: popularCourses });
  } catch (error) {
    console.error("Error fetching popular courses:", error);
    res.status(500).json({ error: "Failed to fetch popular courses" });
  }
};

// Get all courses (public, instructor, or admin filtered) or single course by ID
export const getCourses = async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      // Get single course by ID (public)
        const course = await prisma.course.findUnique({
          where: { id: parseInt(id) },
          include: {
            instructor: {
              select: { id: true, name: true, email: true, bio: true, profilePicture: true }
            },
            enrollments: {
              include: {
                student: {
                  select: { id: true, name: true, email: true }
                }
              }
            },
            quizzes: true,
            modules: {
              include: {
                lessons: true,
                quizzes: true
              }
            }
          }
        });

        if (!course) {
          return res.status(404).json({ error: "Course not found" });
        }

        // Add totalStudents count based on enrollments
        const totalStudents = course.enrollments ? course.enrollments.length : 0;
        const courseWithCounts = {
          ...course,
          totalStudents
        };

        return res.json({ success: true, course: courseWithCounts });
    }

    // Check if user is authenticated
    const token = req.headers.authorization?.split(" ")[1];
    let userRole = null;
    let instructorId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userRole = decoded.role;
        instructorId = parseInt(decoded.id);
      } catch (error) {
        // Token invalid, continue as public request
      }
    }

    let courses;
    let whereClause = {};

    // Admin can filter courses
    if (userRole === 'admin') {
      const { status } = req.query;
      if (status && status !== 'All Statuses') {
        if (status === 'Active') {
          whereClause.status = 'published';
        } else if (status === 'Pending Approval') {
          whereClause.status = 'pending_approval';
        } else {
          whereClause.status = status.toLowerCase();
        }
      }
      // Admin sees all courses
      courses = await prisma.course.findMany({
        where: whereClause,
        include: {
          instructor: {
            select: { id: true, name: true, email: true }
          },
          enrollments: true,
          modules: {
            include: {
              lessons: true,
              quizzes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (instructorId) {
      // Return instructor's courses with full details
      courses = await prisma.course.findMany({
        where: { instructorId },
        include: {
          enrollments: {
            include: {
              student: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          quizzes: true,
          modules: {
            include: {
              lessons: true,
              quizzes: true
            }
          }
        }
      });
    } else {
      // Return all published courses for public view
      courses = await prisma.course.findMany({
        where: { status: 'published' },
        include: {
          instructor: {
            select: { id: true, name: true }
          }
        }
      });
    }

    res.json({ success: true, courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

// Create a new course
export const createCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const instructorId = parseInt(decoded.id);

    const { title, description, category, visibility, modules, materials, quizzes, pricing, price, discountPrice, enableDiscount, status } = req.body;

    // Log the request body for debugging
    console.log("Request body:", req.body);

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    // Validate category if provided
    if (category && !['Design', 'Development', 'Marketing', 'Business'].includes(category)) {
      return res.status(400).json({ error: "Invalid category. Must be one of: Design, Development, Marketing, Business" });
    }

    // Validate price only if provided (for draft courses, price might not be set yet)
    let parsedPrice = null;
    if (price !== undefined && price !== null) {
      parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: "Price must be a valid positive number" });
      }
    }

    // For free courses, ensure price is set to 0
    if (pricing === 'free') {
      parsedPrice = 0;
    }

    // Check if a course with the same title already exists for this instructor
    const existingCourse = await prisma.course.findFirst({
      where: {
        title: title.trim(),
        instructorId: instructorId
      }
    });

    if (existingCourse) {
      return res.status(400).json({ error: "A course with this title already exists for this instructor" });
    }

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        description,
        price: parsedPrice,
        category: category || null, // Save category if provided
        visibility: visibility || "Public", // Default to Public if not specified
        instructorId,
        status: status || "draft", // Default to draft if not specified
        discordChannel: null // Will be set later if needed
      }
    });

    res.json({ success: true, course });
  } catch (error) {
    console.error("Error creating course:", error);
    // Log more details about the error
    console.error("Error details:", error.message, error.stack);
    res.status(500).json({ error: "Failed to create course" });
  }
};

// Update a course
export const updateCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const instructorId = parseInt(decoded.id);
    const { id } = req.params;

    // Verify ownership
    const course = await prisma.course.findFirst({
      where: { id: parseInt(id), instructorId }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Whitelist fields that actually exist on the Course model
    const body = req.body || {};
    const data = {};

    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.status === "string") data.status = body.status; // 'draft' | 'published'
    if (typeof body.category === "string" && body.category.trim() !== "") {
      // Validate category - if invalid, set to null instead of erroring
      if (['Design', 'Development', 'Marketing', 'Business'].includes(body.category.trim())) {
        data.category = body.category.trim();
      } else {
        data.category = null; // Invalid category, set to null
      }
    }
    if (typeof body.visibility === "string") {
      // Accept both cases and normalize to title case
      const lowerVisibility = body.visibility.toLowerCase();
      if (!['public', 'private'].includes(lowerVisibility)) {
        return res.status(400).json({ error: "Invalid visibility. Must be one of: Public, Private" });
      }
      data.visibility = lowerVisibility.charAt(0).toUpperCase() + lowerVisibility.slice(1);
    }

    // Price is Float?
    if (body.price !== undefined && body.price !== null && body.price !== "") {
      const parsed = typeof body.price === "number" ? body.price : parseFloat(body.price);
      if (!isNaN(parsed) && parsed >= 0) {
        data.price = parsed;
      } else {
        return res.status(400).json({ error: "Price must be a valid positive number" });
      }
    }

    // Optional known fields
    if (typeof body.thumbnailUrl === "string") data.thumbnailUrl = body.thumbnailUrl;

    // videoUrls is Json?
    if (Array.isArray(body.videoUrls)) {
      data.videoUrls = body.videoUrls;
    }

    // If nothing valid to update, return current course (no-op)
    if (Object.keys(data).length === 0) {
      return res.json({ success: true, course });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({ success: true, course: updatedCourse });
  } catch (error) {
    console.error("Error updating course:", error);
    // Bubble up Prisma validation messages if present
    const message = error?.message || "Failed to update course";
    res.status(500).json({ error: "Failed to update course", message });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const instructorId = parseInt(decoded.id);
    const { id } = req.params;

    const course = await prisma.course.findFirst({
      where: { id: parseInt(id), instructorId }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    await prisma.course.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};

// Upload course thumbnail
export const uploadCourseThumbnail = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const instructorId = parseInt(decoded.id);
    const { courseId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verify course belongs to instructor
    const course = await prisma.course.findFirst({
      where: { id: parseInt(courseId), instructorId }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found or access denied" });
    }

    // Update course with thumbnail URL
    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(courseId) },
      data: { thumbnailUrl: req.file.path }
    });

    res.json({ success: true, course: updatedCourse, thumbnailUrl: req.file.path });
  } catch (error) {
    console.error("Error uploading thumbnail:", error);
    res.status(500).json({ error: "Failed to upload thumbnail" });
  }
};

// Upload course video
export const uploadCourseVideo = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const instructorId = parseInt(decoded.id);
    const { courseId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verify course belongs to instructor
    const course = await prisma.course.findFirst({
      where: { id: parseInt(courseId), instructorId }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found or access denied" });
    }

    // Get existing video URLs or initialize empty array
    const existingVideos = course.videoUrls ? JSON.parse(course.videoUrls) : [];

    // Add new video URL
    existingVideos.push(req.file.path);

    // Update course with new video URLs array
    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(courseId) },
      data: { videoUrls: JSON.stringify(existingVideos) }
    });

    res.json({ success: true, course: updatedCourse, videoUrl: req.file.path });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ error: "Failed to upload video" });
  }
};

// Get pending courses for admin approval
export const getPendingCourses = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const pendingCourses = await prisma.course.findMany({
      where: { status: 'pending_approval' },
      include: {
        instructor: {
          select: { id: true, name: true, email: true }
        },
        modules: {
          include: {
            lessons: true,
            quizzes: true
          }
        }
      }
    });

    res.json({ success: true, courses: pendingCourses });
  } catch (error) {
    console.error("Error fetching pending courses:", error);
    res.status(500).json({ error: "Failed to fetch pending courses" });
  }
};

// Approve course
export const approveCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { courseId } = req.params;

    // Fetch course with instructor details
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      include: {
        instructor: {
          select: { id: true, name: true, email: true, discordId: true }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (!course.instructor.discordId) {
      return res.status(400).json({ error: "Instructor does not have a Discord account linked" });
    }

    // Create Discord channel for the course
    console.log(`Creating Discord channel for course: ${course.title}, instructor: ${course.instructor.name}, discordId: ${course.instructor.discordId}`);
    const { createCourseChannel } = await import("../discordBot.js");
    const channelLink = await createCourseChannel(course.title, course.instructor.discordId, course.instructor.name);
    console.log(`Channel creation result: ${channelLink}`);

    if (!channelLink) {
      return res.status(500).json({ error: "Failed to create Discord channel" });
    }

    // Update course status and Discord channel link
    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(courseId) },
      data: {
        status: 'published',
        discordChannel: channelLink
      },
      include: {
        instructor: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({ success: true, course: updatedCourse });
  } catch (error) {
    console.error("Error approving course:", error);
    res.status(500).json({ error: "Failed to approve course" });
  }
};

// Reject course
export const rejectCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      include: {
        instructor: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(courseId) },
      data: {
        status: 'rejected',
        rejectedAt: new Date()
      }
    });

    // Send rejection email to instructor
    const { sendCourseRejectionEmail } = await import("../utils/emailService.js");
    await sendCourseRejectionEmail(course.instructor.email, course.instructor.name, course.title);

    res.json({ success: true, course: updatedCourse });
  } catch (error) {
    console.error("Error rejecting course:", error);
    res.status(500).json({ error: "Failed to reject course" });
  }
};

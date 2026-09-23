import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Create a new enrollment
export const createEnrollment = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is a student
    if (decoded.role !== 'student') {
      return res.status(403).json({ error: "Only students can enroll in courses" });
    }

    const studentId = parseInt(decoded.id);

    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.status !== 'published') {
      return res.status(400).json({ error: "Course is not available for enrollment" });
    }

    // For paid courses, initialize payment instead of direct enrollment
    if (course.price && course.price > 0) {
      // Import payment controller dynamically to avoid circular dependency
      const { initPayment } = await import("./paymentController..js");
      return initPayment(req, res);
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: studentId,
        courseId: parseInt(courseId)
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: studentId,
        courseId: parseInt(courseId),
        status: 'active'
      },
      include: {
        course: true,
        student: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({ success: true, enrollment });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    res.status(500).json({ error: "Failed to create enrollment" });
  }
};

// Get student's enrollments
export const getStudentEnrollments = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = parseInt(decoded.id);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: studentId },
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, name: true }
            },
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const lessons = enrollment.course.modules.flatMap(module => module.lessons);
        if (lessons.length === 0) {
          return { ...enrollment, progress: 0 };
        }

        const progressRecords = await prisma.progress.findMany({
          where: {
            studentId: enrollment.studentId,
            lessonId: { in: lessons.map(l => l.id) }
          }
        });

        const totalProgress = progressRecords.reduce((sum, p) => sum + p.progress, 0);
        const averageProgress = progressRecords.length > 0 ? totalProgress / progressRecords.length : 0;

        return { ...enrollment, progress: Math.round(averageProgress) };
      })
    );

    res.json({ success: true, enrollments: enrollmentsWithProgress });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
};

// Get all enrollments (admin only)
export const getAllEnrollments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const enrollments = await prisma.enrollment.findMany({
      include: {
        course: true,
        student: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ enrollments });
  } catch (error) {
    console.error("Error fetching all enrollments:", error);
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
};

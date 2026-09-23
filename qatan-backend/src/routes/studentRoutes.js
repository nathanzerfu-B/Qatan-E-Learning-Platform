import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";

const prisma = new PrismaClient();
const router = express.Router();

// GET all students enrolled in instructor's courses
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    if (role !== "instructor") {
      return res.status(403).json({ success: false, message: "Only instructors can view students" });
    }

    // Get all courses taught by the instructor
    const instructorCourses = await prisma.course.findMany({
      where: { instructorId: parseInt(userId) },
      select: { id: true },
    });

    const courseIds = instructorCourses.map(course => course.id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        students: [],
      });
    }

    // Get enrollments for the instructor's courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: { in: courseIds },
      },
      include: {
        student: true,
        course: true,
      },
    });

    // Group students and their enrollments
    const studentMap = new Map();

    enrollments.forEach(enrollment => {
      const student = enrollment.student;
      const key = student.id;

      if (!studentMap.has(key)) {
        studentMap.set(key, {
          id: student.id,
          name: student.name,
          email: student.email,
          status: student.status || "active",
          enrollments: [],
        });
      }

      studentMap.get(key).enrollments.push({
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        status: enrollment.status,
        enrolledAt: enrollment.createdAt,
      });
    });

    const formattedStudents = Array.from(studentMap.values()).map(student => ({
      ...student,
      enrollments: student.enrollments.length,
      enrolledCourses: student.enrollments,
    }));

    return res.json({
      success: true,
      students: formattedStudents,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Failed to load students" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    if (role !== "instructor") {
      return res.status(403).json({ success: false, message: "Only instructors can view student details" });
    }

    // Fetch student with enrollments
    const student = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        enrollments: {
          include: {
            course: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Get instructor's courses
    const instructorCourses = await prisma.course.findMany({
      where: { instructorId: parseInt(userId) },
      select: { id: true }
    });

    const courseIds = instructorCourses.map(course => course.id);

    // Filter enrollments to only instructor's courses
    const validEnrollments = student.enrollments.filter(enrollment =>
      courseIds.includes(enrollment.courseId)
    );

    if (validEnrollments.length === 0) {
      return res.status(403).json({ success: false, message: "Student not enrolled in your courses" });
    }

    // Calculate progress for each enrolled course
    const enrolledCourses = await Promise.all(validEnrollments.map(async (enrollment) => {
      const course = enrollment.course;

      // Get all lessons for the course
      const lessons = await prisma.lesson.findMany({
        where: {
          module: {
            courseId: course.id
          }
        },
        select: { id: true }
      });

      const lessonIds = lessons.map(lesson => lesson.id);

      // Get progress for this student on these lessons
      const progresses = await prisma.progress.findMany({
        where: {
          studentId: parseInt(id),
          lessonId: { in: lessonIds }
        }
      });

      const totalLessons = lessonIds.length;
      const completedLessons = progresses.filter(p => p.status === 'completed').length;
      const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      return {
        courseId: course.id,
        courseTitle: course.title,
        status: enrollment.status,
        enrolledAt: enrollment.createdAt,
        progress: Math.round(progressPercentage)
      };
    }));

    const response = {
      id: student.id,
      name: student.name,
      email: student.email,
      status: student.status || "active",
      enrolledCourses
    };

    return res.json({
      success: true,
      student: response
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ success: false, message: "Failed to load student details" });
  }
});

export default router;

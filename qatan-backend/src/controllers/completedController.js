import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Controller to check and mark course completion for a student
export const checkAndMarkCourseCompletion = async (req, res) => {
  try {
    // Extract student ID from JWT token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = decoded.id;

    // Expect courseId in body or query
    const courseId = parseInt(req.body.courseId || req.query.courseId);
    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required" });
    }

    // Check if student is enrolled with active status
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId, courseId, status: "active" }
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: "Not enrolled or enrollment not active" });
    }

    // Check if all lessons completed
    const lessons = await prisma.lesson.findMany({
      where: { module: { courseId } }
    });

    const completedProgressCount = await prisma.progress.count({
      where: {
        studentId,
        lessonId: { in: lessons.map(l => l.id) },
        status: "completed"
      }
    });

    if (completedProgressCount !== lessons.length) {
      return res.json({ success: false, message: "Not all lessons completed yet" });
    }

    // Check if all quizzes passed
    const quizzes = await prisma.quiz.findMany({
      where: { courseId }
    });

    const passedQuizCount = await prisma.quizAttempt.count({
      where: {
        studentId,
        quizId: { in: quizzes.map(q => q.id) },
        status: "passed"
      }
    });

    if (passedQuizCount !== quizzes.length) {
      return res.json({ success: false, message: "Not all quizzes passed yet" });
    }

    // Keep enrollment status as 'enrolled' instead of 'completed'
    if (enrollment.status !== "enrolled") {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "enrolled" }
      });
    }

    // Also create or update CourseCompletion record
    await prisma.courseCompletion.upsert({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      },
      update: {
        completedAt: new Date()
      },
      create: {
        studentId,
        courseId,
        completedAt: new Date()
      }
    });

    return res.json({ success: true, message: "Course marked as completed" });
  } catch (error) {
    console.error("Error checking and marking course completion:", error);
    return res.status(500).json({ success: false, message: "Failed to check or mark completion" });
  }
};

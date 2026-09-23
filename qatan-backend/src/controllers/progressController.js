import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Get student progress for a course
export const getCourseProgress = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { courseId } = req.params;

    // Verify student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: parseInt(courseId),
        studentId: decoded.id,
        status: "active"
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    // Get all lessons in the course
    const lessons = await prisma.lesson.findMany({
      where: {
        module: {
          courseId: parseInt(courseId)
        }
      },
      include: {
        progress: {
          where: { studentId: decoded.id }
        },
        module: true
      },
      orderBy: [
        { module: { order: 'asc' } },
        { order: 'asc' }
      ]
    });

    // Calculate overall progress
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(lesson =>
      lesson.progress.length > 0 && lesson.progress[0].status === 'completed'
    ).length;

    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Group progress by module
    const progressByModule = {};
    lessons.forEach(lesson => {
      const moduleId = lesson.moduleId;
      if (!progressByModule[moduleId]) {
        progressByModule[moduleId] = {
          module: lesson.module,
          lessons: [],
          completedCount: 0,
          totalCount: 0
        };
      }

      progressByModule[moduleId].lessons.push({
        ...lesson,
        progress: lesson.progress[0] || null
      });

      progressByModule[moduleId].totalCount++;
      if (lesson.progress.length > 0 && lesson.progress[0].status === 'completed') {
        progressByModule[moduleId].completedCount++;
      }
    });

    res.json({
      success: true,
      progress: {
        overall: {
          completed: completedLessons,
          total: totalLessons,
          percentage: Math.round(overallProgress)
        },
        modules: Object.values(progressByModule)
      }
    });
  } catch (error) {
    console.error("Error fetching course progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
};

// Centralized function to check and mark course completion

async function checkAndMarkCourseCompletion(studentId, courseId) {
  try {
    console.log(`checkAndMarkCourseCompletion: Checking completion for studentId=${studentId}, courseId=${courseId}`);
    // Check if all lessons completed
    const lessons = await prisma.lesson.findMany({
      where: { module: { courseId } }
    });

    console.log(`Total lessons in course: ${lessons.length}`);

    const completedProgressCount = await prisma.progress.count({
      where: {
        studentId,
        lessonId: { in: lessons.map(l => l.id) },
        status: "completed"
      }
    });

    console.log(`Completed lessons count: ${completedProgressCount}`);

    if (completedProgressCount !== lessons.length) {
      console.log("Not all lessons completed yet. Exiting check.");
      return; // Not all lessons completed yet
    }

    // Check if all quizzes passed
    const quizzes = await prisma.quiz.findMany({
      where: { courseId }
    });

    console.log(`Total quizzes in course: ${quizzes.length}`);

    const passedQuizCount = await prisma.quizAttempt.count({
      where: {
        studentId,
        quizId: { in: quizzes.map(q => q.id) },
        status: "passed"
      }
    });

    console.log(`Passed quizzes count: ${passedQuizCount}`);

    if (passedQuizCount !== quizzes.length) {
      console.log("Not all quizzes passed yet. Exiting check.");
      return; // Not all quizzes passed yet
    }

    // Find enrollment regardless of status (do not change status)
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId
      }
    });

    if (!enrollment) {
      console.log("Enrollment not found");
    }

    // Upsert CourseCompletion record to persist completion
    const upsertResult = await prisma.courseCompletion.upsert({
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

    console.log("CourseCompletion record upserted:", upsertResult);
  } catch (error) {
    console.error("Error in checkAndMarkCourseCompletion:", error);
  }
}

// New function: Perform sweeping check for all active enrollments to mark completions
export async function sweepAndMarkCourseCompletions() {
  console.log("Starting sweepAndMarkCourseCompletions background job");

  // Find all active enrollments
  const activeEnrollments = await prisma.enrollment.findMany({
    where: { status: "active" },
    select: { id: true, studentId: true, courseId: true }
  });

  console.log(`Found ${activeEnrollments.length} active enrollments to check`);

  let completedCount = 0;

  for (const enrollment of activeEnrollments) {
    await checkAndMarkCourseCompletion(enrollment.studentId, enrollment.courseId);
    completedCount++;
  }

  console.log(`Completed sweep for ${completedCount} active enrollments`);
}

export const updateLessonProgress = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { lessonId } = req.params;
    const { status, progress, timeSpent } = req.body;

    // Verify student is enrolled in the course containing this lesson
    const lesson = await prisma.lesson.findFirst({
      where: { id: parseInt(lessonId) },
      include: {
        module: {
          include: { course: true }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: lesson.module.course.id,
        studentId: decoded.id,
        status: "active"
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    // Validate status
    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Validate progress percentage
    const progressValue = Math.max(0, Math.min(100, parseFloat(progress) || 0));

    // Upsert progress record
    const progressRecord = await prisma.progress.upsert({
      where: {
        studentId_lessonId: {
          studentId: decoded.id,
          lessonId: parseInt(lessonId)
        }
      },
      update: {
        status,
        progress: progressValue,
        timeSpent: (timeSpent || 0),
        completedAt: status === 'completed' ? new Date() : null
      },
      create: {
        studentId: decoded.id,
        lessonId: parseInt(lessonId),
        status,
        progress: progressValue,
        timeSpent: (timeSpent || 0),
        completedAt: status === 'completed' ? new Date() : null
      }
    });

  // Check course completion after lesson progress update
  console.log(`Progress updated for studentId: ${decoded.id}, lessonId: ${lesson.id}. Checking course completion.`);
  await checkAndMarkCourseCompletion(decoded.id, lesson.module.course.id);

    res.json({ success: true, progress: progressRecord });
  } catch (error) {
    console.error("Error updating lesson progress:", error);
    res.status(500).json({ error: "Failed to update progress" });
  }
};

// Get progress for a specific lesson
export const getLessonProgress = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { lessonId } = req.params;

    const progress = await prisma.progress.findUnique({
      where: {
        studentId_lessonId: {
          studentId: decoded.id,
          lessonId: parseInt(lessonId)
        }
      }
    });

    res.json({
      success: true,
      progress: progress || {
        status: 'not_started',
        progress: 0,
        timeSpent: 0
      }
    });
  } catch (error) {
    console.error("Error fetching lesson progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
};

// Get all progress records (admin only)
export const getAllProgress = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const progress = await prisma.progress.findMany({
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        lesson: {
          include: {
            module: {
              include: {
                course: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ progress });
  } catch (error) {
    console.error("Error fetching all progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
};

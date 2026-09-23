import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Get student performance reports
export const getPerformanceReports = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { studentId, courseId } = req.query;
    console.log("Performance report request - studentId:", studentId, "courseId:", courseId);

    let whereClause = {};

    // Filter by student if provided
    if (studentId) {
      const student = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { contains: studentId, mode: 'insensitive' } },
            { email: { contains: studentId, mode: 'insensitive' } },
            { id: parseInt(studentId) || 0 }
          ],
          role: 'student'
        }
      });

      if (!student) {
        console.log("No student found for:", studentId);
        return res.json({ success: true, data: [] });
      }

      whereClause.studentId = student.id;
    }

    // Filter by course if provided
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: {
          OR: [
            { title: { contains: courseId, mode: 'insensitive' } },
            { id: parseInt(courseId) || 0 }
          ]
        }
      });

      if (!course) {
        console.log("No course found for:", courseId);
        return res.json({ success: true, data: [] });
      }

      whereClause.courseId = course.id;
    }

    // Get enrollments with progress data
    const enrollments = await prisma.enrollment.findMany({
      where: whereClause,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { id: true, title: true }
        }
      }
    });

    console.log("Found enrollments:", enrollments.length);

    // Calculate detailed progress for each enrollment
    const performanceData = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get course with modules, lessons, and quizzes
        const courseWithDetails = await prisma.course.findUnique({
          where: { id: enrollment.courseId },
          include: {
            modules: {
              include: {
                lessons: {
                  orderBy: { order: 'asc' }
                },
                quizzes: true
              },
              orderBy: { order: 'asc' }
            }
          }
        });

        if (!courseWithDetails || courseWithDetails.modules.length === 0) {
          return {
            studentName: enrollment.student.name,
            studentEmail: enrollment.student.email,
            courseTitle: enrollment.course.title,
            progress: 0,
            grade: 'N/A',
            status: enrollment.status,
            courseDetails: []
          };
        }

        // Calculate detailed progress for each module
        const courseDetails = await Promise.all(
          courseWithDetails.modules.map(async (module) => {
            const moduleLessons = module.lessons;
            const lessonIds = moduleLessons.map(l => l.id);

            // Get progress for all lessons in this module
            const progressRecords = await prisma.progress.findMany({
              where: {
                studentId: enrollment.studentId,
                lessonId: { in: lessonIds }
              }
            });

            // Calculate module progress
            const totalModuleProgress = progressRecords.reduce((sum, p) => sum + p.progress, 0);
            const moduleProgress = lessonIds.length > 0 ? Math.round(totalModuleProgress / lessonIds.length) : 0;

            // Process each lesson
            const lessonsWithProgress = moduleLessons.map(lesson => {
              const lessonProgress = progressRecords.find(p => p.lessonId === lesson.id)?.progress || 0;

              return {
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                lessonType: lesson.type,
                progress: lessonProgress,
                quizzes: [] // Quizzes are at module level, not lesson level
              };
            });

            // Get quiz information for this module
            const moduleQuizzes = module.quizzes.map(quiz => ({
              quizId: quiz.id,
              quizTitle: quiz.title,
              maxScore: quiz.questions ? (Array.isArray(quiz.questions) ? quiz.questions.length : 0) : 0,
              questionsCount: quiz.questions ? (Array.isArray(quiz.questions) ? quiz.questions.length : 0) : 0,
              attempts: [] // Will be populated with student attempts
            }));

            // Get quiz attempts for each quiz
            for (const quiz of moduleQuizzes) {
              const attempts = await prisma.quizAttempt.findMany({
                where: { quizId: quiz.quizId },
                include: {
                  student: {
                    select: { id: true, name: true, email: true }
                  }
                },
                orderBy: { completedAt: "desc" }
              });

              quiz.attempts = attempts.map(attempt => ({
                studentId: attempt.studentId,
                studentName: attempt.student.name,
                studentEmail: attempt.student.email,
                score: attempt.score,
                completedAt: attempt.completedAt
              }));
            }

            return {
              moduleId: module.id,
              moduleTitle: module.title,
              moduleProgress: moduleProgress,
              lessons: lessonsWithProgress,
              quizzes: moduleQuizzes
            };
          })
        );

        // Calculate overall course progress
        const totalLessons = courseDetails.reduce((sum, module) => sum + module.lessons.length, 0);
        const totalProgress = courseDetails.reduce((sum, module) =>
          sum + (module.moduleProgress * module.lessons.length), 0
        );
        const overallProgress = totalLessons > 0 ? Math.round(totalProgress / totalLessons) : 0;

        // Calculate grade based on progress
        let grade = 'F';
        if (overallProgress >= 90) grade = 'A';
        else if (overallProgress >= 80) grade = 'B';
        else if (overallProgress >= 70) grade = 'C';
        else if (overallProgress >= 60) grade = 'D';

        return {
          studentName: enrollment.student.name,
          studentEmail: enrollment.student.email,
          courseTitle: enrollment.course.title,
          progress: overallProgress,
          grade: grade,
          status: enrollment.status,
          courseDetails: courseDetails
        };
      })
    );

    console.log("Performance data prepared:", performanceData.length);
    res.json({ success: true, data: performanceData });
  } catch (error) {
    console.error("Error fetching performance reports:", error);
    res.status(500).json({ error: "Failed to fetch performance reports" });
  }
};

// Get enrollment reports
export const getEnrollmentReports = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { courseId, status } = req.query;
    console.log("Enrollment report request - courseId:", courseId, "status:", status);

    let whereClause = {};

    // Filter by course if provided
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: {
          OR: [
            { title: { contains: courseId, mode: 'insensitive' } },
            { id: parseInt(courseId) || 0 }
          ]
        }
      });

      if (!course) {
        console.log("No course found for:", courseId);
        return res.json({ success: true, data: [] });
      }

      whereClause.courseId = course.id;
    }

    // Filter by status if provided
    if (status && status !== 'All') {
      if (status === 'In Progress') {
        whereClause.status = 'active';
      } else if (status === 'Completed') {
        whereClause.status = 'completed';
      }
    }

    // Get all courses that match the filter
    const courses = await prisma.course.findMany({
      where: courseId ? { id: whereClause.courseId } : {},
      include: {
        instructor: {
          select: { id: true, name: true }
        },
        // Remove filtering on enrollments here to get all enrolled students
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log("Found courses:", courses.length);

    // Process each course with enrolled students
    const enrollmentData = await Promise.all(
      courses.map(async (course) => {
        // Calculate progress for each enrolled student
        let enrolledStudents = await Promise.all(
          course.enrollments.map(async (enrollment) => {
            const lessons = await prisma.lesson.findMany({
              where: {
                module: {
                  courseId: course.id
                }
              }
            });

            let progress = 0;
            if (lessons.length > 0) {
              const progressRecords = await prisma.progress.findMany({
                where: {
                  studentId: enrollment.studentId,
                  lessonId: { in: lessons.map(l => l.id) }
                }
              });

              const totalProgress = progressRecords.reduce((sum, p) => sum + p.progress, 0);
              progress = progressRecords.length > 0 ? Math.round(totalProgress / progressRecords.length) : 0;
            }

            // Check if courseCompletion exists for this student and course
            const courseCompletion = await prisma.courseCompletion.findUnique({
              where: {
                studentId_courseId: {
                  studentId: enrollment.studentId,
                  courseId: course.id
                }
              }
            });

            // Determine status based on courseCompletion presence
            let statusString = 'In Progress';
            if (courseCompletion) {
              statusString = 'Completed';
            }

            return {
              name: enrollment.student.name,
              enrollmentDate: enrollment.createdAt.toISOString().split('T')[0],
              progress: progress,
              status: statusString
            };
          })
        );

        // Filter enrolled students by status query param
        if (status && status !== 'All') {
          if (status === 'Completed') {
            enrolledStudents = enrolledStudents.filter(s => s.status === 'Completed');
          } else if (status === 'In Progress') {
            enrolledStudents = enrolledStudents.filter(s => s.status === 'In Progress');
          }
        }


        // Calculate course stats
        const totalEnrollments = enrolledStudents.length;
        const completedEnrollments = enrolledStudents.filter(s => s.status === 'Completed').length;
        const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
        const revenue = course.price ? course.price * totalEnrollments : 0;

        return {
          title: course.title,
          instructor: course.instructor.name,
          status: course.status === 'published' ? 'Active' : course.status === 'pending_approval' ? 'Pending Approval' : course.status,
          createdDate: course.createdAt.toISOString().split('T')[0],
          enrollments: totalEnrollments,
          rating: null, // Not implemented yet
          completion: completionRate,
          revenue: revenue,
          enrolledStudents: enrolledStudents
        };
      })
    );

    console.log("Enrollment data prepared:", enrollmentData.length);
    res.json({ success: true, data: enrollmentData });
  } catch (error) {
    console.error("Error fetching enrollment reports:", error);
    res.status(500).json({ error: "Failed to fetch enrollment reports" });
  }
};

// Get payment/financial reports
export const getPaymentReports = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { studentId, courseId } = req.query;
    console.log("Payment report request - studentId:", studentId, "courseId:", courseId);

    let whereClause = {};

    // Filter by student if provided
    if (studentId) {
      const student = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { contains: studentId, mode: 'insensitive' } },
            { email: { contains: studentId, mode: 'insensitive' } },
            { id: parseInt(studentId) || 0 }
          ],
          role: 'student'
        }
      });

      if (!student) {
        console.log("No student found for:", studentId);
        return res.json({ success: true, data: [] });
      }

      whereClause.userId = student.id;
    }

    // Filter by course if provided
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: {
          OR: [
            { title: { contains: courseId, mode: 'insensitive' } },
            { id: parseInt(courseId) || 0 }
          ]
        }
      });

      if (!course) {
        console.log("No course found for:", courseId);
        return res.json({ success: true, data: [] });
      }

      whereClause.courseId = course.id;
    }

    // Get transactions with status 'completed' (paid)
    const transactions = await prisma.transaction.findMany({
      where: {
        ...whereClause,
        status: 'completed'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log("Found transactions:", transactions.length);

    const paymentData = transactions.map(transaction => ({
      studentName: transaction.user.name,
      studentEmail: transaction.user.email,
      courseTitle: transaction.course.title,
      amount: transaction.amount,
      status: 'Paid',
      date: transaction.createdAt.toISOString().split('T')[0],
      paymentRef: transaction.tx_ref
    }));

    console.log("Payment data prepared:", paymentData.length);
    res.json({ success: true, data: paymentData });
  } catch (error) {
    console.error("Error fetching payment reports:", error);
    res.status(500).json({ error: "Failed to fetch payment reports" });
  }
};

import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Middleware to verify instructor
const verifyInstructor = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "instructor") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    req.instructorId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Get all quizzes for instructor
export const getQuizzes = [verifyInstructor, async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { instructorId: req.instructorId },
      include: { course: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, quizzes });
  } catch (error) {
    console.error("Get quizzes error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch quizzes" });
  }
}];

// Create a new quiz
export const createQuiz = [verifyInstructor, async (req, res) => {
  try {
    const { title, questions, courseId, moduleId, timeLimit } = req.body;

    // Validate
    if (!title || !questions) {
      return res.status(400).json({ success: false, message: "Title and questions are required" });
    }

    let resolvedCourseId = null;
    let resolvedModuleId = null;

    if (moduleId) {
      // Verify module belongs to instructor via its course
      const module = await prisma.module.findFirst({
        where: { id: Number(moduleId) },
        include: { course: true }
      });
      if (!module) {
        return res.status(404).json({ success: false, message: "Module not found" });
      }
      if (module.course.instructorId !== Number(req.instructorId)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      resolvedCourseId = module.courseId;
      resolvedModuleId = module.id;
    } else if (courseId) {
      // Fallback: allow course-level quiz creation (no specific module)
      const course = await prisma.course.findFirst({
        where: { id: Number(courseId), instructorId: Number(req.instructorId) }
      });
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found or access denied" });
      }
      resolvedCourseId = course.id;
    } else {
      return res.status(400).json({ success: false, message: "moduleId or courseId is required" });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        questions,
        courseId: resolvedCourseId,
        moduleId: resolvedModuleId ?? null,
        instructorId: Number(req.instructorId),
        timeLimit: timeLimit !== undefined ? timeLimit : null
      },
      include: { course: true }
    });

    res.status(201).json({ success: true, quiz });
  } catch (error) {
    console.error("Create quiz error:", error);
    res.status(500).json({ success: false, message: "Failed to create quiz" });
  }
}];

// Update a quiz
export const updateQuiz = [verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, questions, timeLimit } = req.body;

    const quiz = await prisma.quiz.findFirst({
      where: { id: parseInt(id), instructorId: req.instructorId }
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found or access denied" });
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: parseInt(id) },
      data: { title, questions, timeLimit: timeLimit !== undefined ? parseInt(timeLimit, 10) : null },
      include: { course: true }
    });

    res.json({ success: true, quiz: updatedQuiz });
  } catch (error) {
    console.error("Update quiz error:", error);
    res.status(500).json({ success: false, message: "Failed to update quiz" });
  }
}];

// Delete a quiz
export const deleteQuiz = [verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findFirst({
      where: { id: parseInt(id), instructorId: req.instructorId }
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found or access denied" });
    }

    await prisma.quiz.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Delete quiz error:", error);
    res.status(500).json({ success: false, message: "Failed to delete quiz" });
  }
}];

/**
 * Student/instructor fetch: Get latest quiz for the course owning a given module
 * GET /api/quizzes/module/:moduleId
 */
export const getQuizByModule = async (req, res) => {
  try {
    console.log("GetQuizByModule called with headers:", req.headers);
    console.log("Params:", req.params);

    const moduleId = Number(req.params.moduleId);
    console.log("Parsed moduleId:", moduleId);

    if (isNaN(moduleId)) {
      console.error("Invalid or missing moduleId parameter");
      return res.status(400).json({ success: false, message: "Invalid or missing moduleId parameter" });
    }
    console.log("Fetching quiz by moduleId:", moduleId);

    // Fetch module and owning course
    const module = await prisma.module.findFirst({
      where: { id: moduleId },
      include: { course: true }
    });
    if (!module) {
      console.log("Module not found for id:", moduleId);
      return res.status(404).json({ success: false, message: "Module not found" });
    }

    // Temporarily bypass authorization for debugging
    // const token = req.headers.authorization?.split(" ")[1];
    // if (!token) return res.status(401).json({ success: false, message: "No token provided" });
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const role = (decoded.role || "").toLowerCase();

    // Return the latest quiz for this module
    const quiz = await prisma.quiz.findFirst({
      where: { moduleId },
      orderBy: { createdAt: "desc" }
    });
    console.log("Fetched quiz:", quiz);

    return res.json({ success: true, quiz: quiz || null });
  } catch (error) {
    console.error("Get quiz by module error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch quiz" });
  }
};

// Submit quiz attempt (student only)
export const submitQuizAttempt = async (req, res) => {
  try {
    console.log("SubmitQuizAttempt called with headers:", req.headers);
    console.log("Body:", req.body);

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "student") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { quizId, answers } = req.body;

    // Validate
    if (!quizId || !answers) {
      return res.status(400).json({ success: false, message: "quizId and answers are required" });
    }

    // Check if student is enrolled in the course
    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(quizId) },
      include: { course: true }
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: decoded.id,
        courseId: quiz.courseId,
        status: "active"
      }
    });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: "Not enrolled in this course" });
    }

    // Calculate score - map answers by question ID
    const questions = quiz.questions || [];
    let score = 0;
    const totalQuestions = questions.length;

    for (const question of questions) {
      const answerGiven = answers[question.id];
      if (answerGiven !== undefined) {
        // Normalize answers for non-multiple choice questions if needed
        if (question.type === "multiple-choice") {
          if (answerGiven === question.answer) {
            score++;
          }
        } else {
          if (
            typeof answerGiven === "string" &&
            answerGiven.trim().toLowerCase() ===
              String(question.answer).trim().toLowerCase()
          ) {
            score++;
          }
        }
      }
    }

    const status = Math.round((score / totalQuestions) * 100) >= 40 ? "passed" : "failed";

    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        studentId: decoded.id,
        quizId: parseInt(quizId),
      }
    });

    if (existingAttempt) {
      // Update existing attempt
      const updatedAttempt = await prisma.quizAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          score: Math.round((score / totalQuestions) * 100),
          status: status,
          answers: answers,
          completedAt: new Date()
        }
      });
      return res.json({ success: true, attempt: updatedAttempt, totalQuestions, rawScore: score });
    } else {
      // Create new attempt
      const attempt = await prisma.quizAttempt.create({
        data: {
          studentId: decoded.id,
          quizId: parseInt(quizId),
          score: Math.round((score / totalQuestions) * 100),
          status: status,
          answers: answers
        }
      });
      return res.json({ success: true, attempt, totalQuestions, rawScore: score });
    }
  } catch (error) {
    console.error("Submit quiz attempt error:", error);
    res.status(500).json({ success: false, message: "Failed to submit quiz attempt" });
  }
};

// Get quiz attempts (instructor for their quizzes, admin for all)
export const getQuizAttempts = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { quizId } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(quizId) },
      include: { course: true }
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    // Authorization
    if (decoded.role === "instructor" && quiz.instructorId !== decoded.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: parseInt(quizId) },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { completedAt: "desc" }
    });

    res.json({ success: true, attempts });
  } catch (error) {
    console.error("Get quiz attempts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch quiz attempts" });
  }
};

// Get current student's attempt for a quiz
export const getStudentQuizAttempt = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "student") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { quizId } = req.params;

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        studentId: decoded.id,
        quizId: parseInt(quizId)
      }
    });

    if (!attempt) {
      return res.json({ success: true, attempt: null });
    }

    // Add boolean passed field for frontend convenience
    const passed = attempt.status === "passed";

    res.json({ success: true, attempt: { ...attempt, passed } });
  } catch (error) {
    console.error("Get student quiz attempt error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch student quiz attempt" });
  }
};

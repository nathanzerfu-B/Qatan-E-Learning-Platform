import express from "express";
import { getQuizzes, createQuiz, updateQuiz, deleteQuiz, getQuizByModule, submitQuizAttempt, getQuizAttempts, getStudentQuizAttempt } from "../controllers/quizController.js";


const router = express.Router();

// GET /api/quizzes - Get all quizzes for instructor
router.get("/", getQuizzes);

// POST /api/quizzes - Create a new quiz
router.post("/", createQuiz);

// PUT /api/quizzes/:id - Update a quiz
router.put("/:id", updateQuiz);

// DELETE /api/quizzes/:id - Delete a quiz
router.delete("/:id", deleteQuiz);

// GET /api/quizzes/module/:moduleId - Get quiz by module
router.get("/module/:moduleId", getQuizByModule);

// POST /api/quizzes/submit - Submit quiz attempt
router.post("/submit", submitQuizAttempt);

// GET /api/quizzes/attempts/:quizId - Get quiz attempts
router.get("/attempts/:quizId", getQuizAttempts);

// GET /api/quizzes/:quizId/student-attempt - Get current student's quiz attempt
router.get("/:quizId/student-attempt", getStudentQuizAttempt);

export default router;

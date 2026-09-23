import express from "express";
import { getModules, createModule, updateModule, deleteModule } from "../controllers/moduleController.js";

const router = express.Router();

// GET /api/modules/:courseId - Get all modules for a course
router.get("/:courseId", getModules);

// POST /api/modules/:courseId - Create a new module
router.post("/:courseId", createModule);

// PUT /api/modules/:moduleId - Update a module
router.put("/:moduleId", updateModule);

// DELETE /api/modules/:moduleId - Delete a module
router.delete("/:moduleId", deleteModule);

export default router;

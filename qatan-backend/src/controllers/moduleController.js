import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Get all modules for a course
export const getModules = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { courseId } = req.params;

    // Verify user has access to this course (instructor or enrolled student)
    const course = await prisma.course.findFirst({
      where: {
        id: parseInt(courseId),
        OR: [
          { instructorId: Number(decoded.id) },
          {
            enrollments: {
              some: {
                studentId: Number(decoded.id),
                status: "active"
              }
            }
          }
        ]
      }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found or access denied" });
    }

    const modules = await prisma.module.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            progress: decoded.role === 'student' ? {
              where: { studentId: Number(decoded.id) }
            } : false
          }
        },
        quizzes: {
          select: { id: true, title: true, createdAt: true }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json({ success: true, modules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({ error: "Failed to fetch modules" });
  }
};

// Create a new module
export const createModule = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { courseId } = req.params;
    const { title, description, order } = req.body;

    // Verify instructor owns the course
    const course = await prisma.course.findFirst({
      where: {
        id: parseInt(courseId),
        instructorId: Number(decoded.id)
      }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found or access denied" });
    }

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const module = await prisma.module.create({
      data: {
        title,
        description,
        order: order || 0,
        courseId: parseInt(courseId)
      }
    });

    res.json({ success: true, module });
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({ error: "Failed to create module" });
  }
};

// Update a module
export const updateModule = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { moduleId } = req.params;
    const { title, description, order } = req.body;

    // Verify instructor owns the module's course
    const module = await prisma.module.findFirst({
      where: { id: parseInt(moduleId) },
      include: { course: true }
    });

    if (!module || module.course.instructorId !== Number(decoded.id)) {
      return res.status(404).json({ error: "Module not found or access denied" });
    }

    const updatedModule = await prisma.module.update({
      where: { id: parseInt(moduleId) },
      data: {
        title,
        description,
        order
      }
    });

    res.json({ success: true, module: updatedModule });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({ error: "Failed to update module" });
  }
};

// Delete a module
export const deleteModule = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { moduleId } = req.params;

    // Verify instructor owns the module's course
    const module = await prisma.module.findFirst({
      where: { id: parseInt(moduleId) },
      include: { course: true }
    });

    if (!module || module.course.instructorId !== Number(decoded.id)) {
      return res.status(404).json({ error: "Module not found or access denied" });
    }

    await prisma.module.delete({
      where: { id: parseInt(moduleId) }
    });

    res.json({ success: true, message: "Module deleted successfully" });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({ error: "Failed to delete module" });
  }
};

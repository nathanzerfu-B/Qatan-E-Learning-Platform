import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";

const prisma = new PrismaClient();

// Get all lessons for a module
export const getLessons = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { moduleId } = req.params;

    // Verify user has access to this module's course
    const module = await prisma.module.findFirst({
      where: { id: parseInt(moduleId) },
      include: { course: true }
    });

    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    // Check access permissions
    const hasAccess = module.course.instructorId === Number(decoded.id) ||
      await prisma.enrollment.findFirst({
        where: {
          courseId: module.course.id,
          studentId: Number(decoded.id),
          status: "active"
        }
      });

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const lessons = await prisma.lesson.findMany({
      where: { moduleId: parseInt(moduleId) },
      include: {
        progress: decoded.role === 'student' ? {
          where: { studentId: Number(decoded.id) }
        } : false
      },
      orderBy: { order: 'asc' }
    });

    res.json({ success: true, lessons });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
};

// Create a new lesson
export const createLesson = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { moduleId } = req.params;
    const { title, content, contentType, order, duration } = req.body;

    // Verify instructor owns the module's course
    const module = await prisma.module.findFirst({
      where: { id: parseInt(moduleId) },
      include: { course: true }
    });

    if (!module || module.course.instructorId !== Number(decoded.id)) {
      return res.status(404).json({ error: "Module not found or access denied" });
    }

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!['text', 'video', 'image', 'quiz'].includes(contentType)) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        contentType,
        order: order || 0,
        duration,
        moduleId: parseInt(moduleId)
      }
    });

    res.json({ success: true, lesson });
  } catch (error) {
    console.error("Error creating lesson:", error);
    res.status(500).json({ error: "Failed to create lesson" });
  }
};

// Update a lesson
export const updateLesson = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { lessonId } = req.params;
    const { title, content, contentType, order, duration, mediaUrl } = req.body;

    // Verify instructor owns the lesson's course
    const lesson = await prisma.lesson.findFirst({
      where: { id: parseInt(lessonId) },
      include: {
        module: {
          include: { course: true }
        }
      }
    });

    if (!lesson || lesson.module.course.instructorId !== Number(decoded.id)) {
      return res.status(404).json({ error: "Lesson not found or access denied" });
    }

    // Build update payload dynamically to avoid overwriting with undefined
    const data = {};
    if (typeof title !== "undefined") data.title = title;
    if (typeof content !== "undefined") data.content = content;
    if (typeof contentType !== "undefined") data.contentType = contentType;
    if (typeof order !== "undefined") data.order = order;
    if (typeof duration !== "undefined") data.duration = duration;
    if (typeof mediaUrl !== "undefined") data.mediaUrl = mediaUrl;

    const updatedLesson = await prisma.lesson.update({
      where: { id: parseInt(lessonId) },
      data
    });

    res.json({ success: true, lesson: updatedLesson });
  } catch (error) {
    console.error("Error updating lesson:", error);
    res.status(500).json({ error: "Failed to update lesson" });
  }
};

// Delete a lesson
export const deleteLesson = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { lessonId } = req.params;

    // Verify instructor owns the lesson's course
    const lesson = await prisma.lesson.findFirst({
      where: { id: parseInt(lessonId) },
      include: {
        module: {
          include: { course: true }
        }
      }
    });

    if (!lesson || lesson.module.course.instructorId !== Number(decoded.id)) {
      return res.status(404).json({ error: "Lesson not found or access denied" });
    }

    await prisma.lesson.delete({
      where: { id: parseInt(lessonId) }
    });

    res.json({ success: true, message: "Lesson deleted successfully" });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    res.status(500).json({ error: "Failed to delete lesson" });
  }
};

// Upload lesson media (video/image)
export const uploadLessonMedia = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { lessonId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verify instructor owns the lesson's course
    const lesson = await prisma.lesson.findFirst({
      where: { id: parseInt(lessonId) },
      include: {
        module: {
          include: { course: true }
        }
      }
    });

    if (!lesson || lesson.module.course.instructorId !== Number(decoded.id)) {
      return res.status(404).json({ error: "Lesson not found or access denied" });
    }

    // Infer content type from uploaded file mimetype
    const mimetype = req.file.mimetype || "";
    let detectedType = "text";
    if (mimetype.startsWith("image/")) detectedType = "image";
    else if (mimetype.startsWith("video/")) detectedType = "video";

    // Update lesson with media URL and contentType
    const updatedLesson = await prisma.lesson.update({
      where: { id: parseInt(lessonId) },
      data: { mediaUrl: req.file.path, contentType: detectedType }
    });

    res.json({ success: true, lesson: updatedLesson, mediaUrl: req.file.path, contentType: detectedType });
  } catch (error) {
    console.error("Error uploading lesson media:", error);
    res.status(500).json({ error: "Failed to upload media" });
  }
};

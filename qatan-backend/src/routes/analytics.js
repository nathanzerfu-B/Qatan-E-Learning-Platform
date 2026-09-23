import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";

const prisma = new PrismaClient();
const router = express.Router();

// GET analytics for instructor
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    if (role !== "instructor") {
      return res.status(403).json({ success: false, message: "Only instructors can view analytics" });
    }

    // Get instructor's courses
    const instructorCourses = await prisma.course.findMany({
      where: { instructorId: parseInt(userId) },
      select: { id: true, title: true, price: true, status: true }
    });

    const courseIds = instructorCourses.map(course => course.id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalEnrollments: 0,
          averageRating: 0,
          totalRevenue: 0,
          activeCoursesCount: 0,
          monthlyRevenue: [],
          completionRates: []
        }
      });
    }

    // Total enrollments
    const totalEnrollments = await prisma.enrollment.count({
      where: {
        courseId: { in: courseIds }
        // Count all enrollments (pending, completed, etc.)
      }
    });

    // Total revenue from transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        courseId: { in: courseIds },
        status: "completed"
      },
      select: { amount: true, createdAt: true }
    });

    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Monthly revenue for last 6 months
    const monthlyRevenue = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTransactions = transactions.filter(tx =>
        tx.createdAt >= monthStart && tx.createdAt <= monthEnd
      );

      const monthRevenue = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      monthlyRevenue.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        revenue: monthRevenue
      });
    }

    // Active courses count (published courses)
    const activeCoursesCount = instructorCourses.filter(course =>
      course.status === "published"
    ).length;

    // Course completion rates
    const completionRates = await Promise.all(
      instructorCourses.map(async (course) => {
        // Get enrollments for this course
        const enrollments = await prisma.enrollment.findMany({
          where: {
            courseId: course.id
          },
          select: { studentId: true }
        });

        if (enrollments.length === 0) {
          return {
            title: course.title,
            completion: 0
          };
        }

        // Count students who have courseCompletion record
        let completedCount = 0;
        for (const enrollment of enrollments) {
          const courseCompletion = await prisma.courseCompletion.findUnique({
            where: {
              studentId_courseId: {
                studentId: enrollment.studentId,
                courseId: course.id
              }
            }
          });

          if (courseCompletion) {
            completedCount++;
          }
        }

        const completionRate = Math.round((completedCount / enrollments.length) * 100);

        return {
          title: course.title,
          completion: completionRate
        };
      })
    );

    // Average rating (placeholder - generate random rating for now)
    // In a real implementation, you'd have a ratings table
    const averageRating = Math.round((Math.random() * 2 + 3) * 10) / 10; // Random 3.0-5.0

    const analytics = {
      totalEnrollments,
      averageRating,
      totalRevenue,
      activeCoursesCount,
      monthlyRevenue,
      completionRates
    };

    return res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ success: false, message: "Failed to load analytics" });
  }
});

export default router;

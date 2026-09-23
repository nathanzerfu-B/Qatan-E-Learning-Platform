import dotenv from "dotenv";
import axios from "axios";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const BASE = process.env.TEST_BASE_URL || "http://localhost:5000";

async function ensureInstructorAndCourse() {
  const email = "instructor.test@example.com";
  const name = "Instructor Test";
  const plain = "123456";

  const hashed = await bcrypt.hash(plain, 10);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "instructor",
        status: "active",
        isVerified: true,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "instructor",
        status: "active",
        isVerified: true,
        password: hashed,
      },
    });
  }

  let course = await prisma.course.findFirst({
    where: { instructorId: user.id, title: "Test Course for Modules" },
  });

  if (!course) {
    course = await prisma.course.create({
      data: {
        title: "Test Course for Modules",
        description: "Seeded course for module/lesson tests",
        price: null,
        instructorId: user.id,
        status: "draft",
      },
    });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token, user, course };
}

async function run() {
  try {
    const { token, course } = await ensureInstructorAndCourse();
    const headers = { Authorization: `Bearer ${token}` };

    // 1) GET modules (should be array, initially empty or existing from previous runs)
    let res = await axios.get(`${BASE}/api/modules/${course.id}`, { headers });
    console.log("GET /api/modules/:courseId =>", res.data);

    // 2) POST module
    res = await axios.post(
      `${BASE}/api/modules/${course.id}`,
      {
        title: "New Module",
        description: "Auto-created by test",
        order: 0,
      },
      { headers }
    );
    console.log("POST /api/modules/:courseId =>", res.data);
    const moduleId = res.data?.module?.id;
    if (!moduleId) throw new Error("Module creation failed (no id)");

    // 3) POST lesson in that module
    res = await axios.post(
      `${BASE}/api/lessons/${moduleId}`,
      {
        title: "New Lesson",
        content: "",
        contentType: "text",
        order: 0,
      },
      { headers }
    );
    console.log("POST /api/lessons/:moduleId =>", res.data);
    const lessonId = res.data?.lesson?.id;
    if (!lessonId) throw new Error("Lesson creation failed (no id)");

    // 4) PUT module (update title)
    res = await axios.put(
      `${BASE}/api/modules/${moduleId}`,
      { title: "Updated Module Title", description: "Updated by test" },
      { headers }
    );
    console.log("PUT /api/modules/:moduleId =>", res.data);

    // 5) PUT lesson (update title)
    res = await axios.put(
      `${BASE}/api/lessons/${lessonId}`,
      { title: "Updated Lesson Title" },
      { headers }
    );
    console.log("PUT /api/lessons/:lessonId =>", res.data);

    // 6) DELETE lesson
    res = await axios.delete(`${BASE}/api/lessons/${lessonId}`, { headers });
    console.log("DELETE /api/lessons/:lessonId =>", res.data);

    // 7) DELETE module
    res = await axios.delete(`${BASE}/api/modules/${moduleId}`, { headers });
    console.log("DELETE /api/modules/:moduleId =>", res.data);

    console.log("✅ Module/Lesson endpoints test completed successfully.");
  } catch (err) {
    if (err.response) {
      console.error("❌ HTTP Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Error:", err.message || err);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();

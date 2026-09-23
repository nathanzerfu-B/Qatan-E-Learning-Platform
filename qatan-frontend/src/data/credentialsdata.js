export const AppState = {
  users: [
    {
      id: 999,
      name: "Admin User",
      username: "admin",
      email: "admin@example.com",
      password: "Admin@123",
      role: "Admin",
      status: "Active",
      joinDate: "2023-01-01",
    },
    {
      id: 1000,
      name: "Instructor User",
      username: "instructor",
      email: "instructor@example.com",
      password: "Teach123!",
      role: "Instructor",
      status: "Active",
      courses: 0,
      joinDate: "2023-01-01",
    },
    {
      id: 1001,
      name: "Student User",
      username: "student",
      email: "student@example.com",
      password: "Learn123!",
      role: "Student",
      status: "Active",
      enrollments: 0,
      joinDate: "2023-01-01",
    },
    {
      id: 1,
      name: "Sophia Clark",
      email: "sophia.clark@email.com",
      role: "Student",
      status: "Active",
      enrollments: 5,
      completed: 3,
      lastLogin: "2023-10-25",
      joinDate: "2023-08-15",
      recentActivity: [
        { date: "2023-10-25", activity: "Course Enrollment", course: "Introduction to Python", status: "Active" },
        { date: "2023-10-20", activity: "Quiz Completed", course: "Data Science Basics", status: "Completed" },
      ],
    }
  ]
}

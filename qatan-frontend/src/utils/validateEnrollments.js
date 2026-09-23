import { students } from '../data/student.js';
import { courses } from '../data/course.js';

function validateEnrollments() {
  const users = students;
  const coursesData = courses;

  const errors = [];

  // Create a map of course title to course object for quick lookup
  const courseMap = new Map();
  coursesData.forEach(course => {
    courseMap.set(course.title, course);
  });

  // Validate each student
  users.forEach(user => {
    if (user.role !== 'Student') return;

    // Count course enrollments in activity
    const enrolledCoursesFromActivity = user.activity
      ? user.activity.filter(act => act.activity === 'Course Enrollment').map(act => act.course)
      : [];

    // Check if enrollments count matches activity count
    if (user.enrollments !== enrolledCoursesFromActivity.length) {
      errors.push(`User ${user.name} (ID: ${user.id}) enrollments count mismatch: enrollments=${user.enrollments}, activity courses=${enrolledCoursesFromActivity.length}`);
    }

    // Cross-check that each course in activity includes this student in enrolledStudents
    enrolledCoursesFromActivity.forEach(courseTitle => {
      const course = courseMap.get(courseTitle);
      if (!course) {
        errors.push(`User ${user.name} (ID: ${user.id}) enrolled in unknown course "${courseTitle}"`);
        return;
      }
      const studentInCourse = course.enrolledStudents.some(s => s.name === user.name);
      if (!studentInCourse) {
        errors.push(`User ${user.name} (ID: ${user.id}) enrolled in course "${courseTitle}" but not listed in course's enrolledStudents`);
      }
    });
  });

  // Validate each course
  coursesData.forEach(course => {
    const enrolledStudentsCount = course.enrolledStudents.length;

    // Check if enrollments count matches enrolledStudents length
    if (course.enrollments !== enrolledStudentsCount) {
      errors.push(`Course "${course.title}" enrollments count mismatch: enrollments=${course.enrollments}, enrolledStudents=${enrolledStudentsCount}`);
    }

    // Cross-check that each enrolled student has this course in their activity
    course.enrolledStudents.forEach(student => {
      const user = users.find(u => u.name === student.name && u.role === 'Student');
      if (!user) {
        errors.push(`Course "${course.title}" has enrolled student "${student.name}" who is not found in users list`);
        return;
      }
      const hasCourseInActivity = user.activity && user.activity.some(act => act.activity === 'Course Enrollment' && act.course === course.title);
      if (!hasCourseInActivity) {
        errors.push(`Course "${course.title}" has enrolled student "${student.name}" but course not found in student's activity`);
      }
    });
  });

  if (errors.length === 0) {
    console.log('All enrollments are consistent.');
  } else {
    console.error('Enrollment inconsistencies found:');
    errors.forEach(err => console.error(err));
  }

  return errors;
}

// Run validation
validateEnrollments();

export default validateEnrollments;

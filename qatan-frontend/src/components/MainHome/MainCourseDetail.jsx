/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import ReadOnlyCourseOutline from "./ReadOnlyCourseOutline";
import "./MainIndex.css";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/courses/${id}`
        );

        if (response.data.success) {
          setCourse(response.data.course);
          if (response.data.course.modules) {
            setModules(response.data.course.modules);
          }
        }
      } catch (error) {
        console.error("Failed to fetch course:", error);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  // Check if user is enrolled
  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      if (!user || user.role !== "student" || !course) return;

      setCheckingEnrollment(true);

      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          "http://localhost:5000/api/enrollments",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          const enrollments = response.data.enrollments;
          const alreadyEnrolled = enrollments.some(
            (enrollment) => enrollment.courseId === course.id
          );
          setIsEnrolled(alreadyEnrolled);
        }
      } catch (error) {
        console.error("Failed to check enrollment status:", error);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    checkEnrollmentStatus();
  }, [user, course]);

  // Enrollment / Payment logic
  const handleEnroll = async () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    const price = parseFloat(course.price);
    const isFreeCourse = isNaN(price) || price === 0;

    if (isFreeCourse) {
      setEnrolling(true);
      try {
        const token = localStorage.getItem("token");

        const response = await axios.post(
          "http://localhost:5000/api/enrollments",
          { courseId: course.id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          alert("Successfully enrolled in the course!");
          window.location.href = "/student/courses";
        }
      } catch (error) {
        console.error("Failed to enroll:", error);
        const errorMessage =
          error.response?.data?.error ||
          "Failed to enroll in course. Please try again.";
        alert(errorMessage);
      } finally {
        setEnrolling(false);
      }
    } else {
      // Paid course — redirect to Chapa
      setEnrolling(true);
      try {
        const token = localStorage.getItem("token");

        const response = await axios.post(
          "http://localhost:5000/api/payments/init",
          { courseId: course.id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success && response.data.checkout_url) {
          window.location.href = response.data.checkout_url;
        } else {
          alert("Failed to initialize payment. Please try again.");
        }
      } catch (error) {
        console.error("Failed to initialize payment:", error);
        const errorMessage =
          error.response?.data?.error ||
          "Failed to initialize payment. Please try again.";
        alert(errorMessage);
      } finally {
        setEnrolling(false);
      }
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="Main-course-detail-container">
        <div className="Main-loading">Loading course details...</div>
      </div>
    );
  }

  const price = parseFloat(course?.price) || 0;
  const isFreeCourse = price === 0;

  // Course Not Found
  if (!course) {
    return (
      <div className="Main-course-detail-container">
        <h2 className="Main-not-found-title">Course Not Found</h2>
        <button onClick={() => navigate(-1)} className="Main-back-btn">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="Main-course-detail-main">
      <h1 className="Main-course-detail-title">{course.title}</h1>

      <div className="Main-course-detail-layout">
        {/* LEFT CONTENT */}
        <div className="Main-course-detail-content">
          <div className="Main-mb-6">
            {/* Tabs */}
            <nav className="Main-course-detail-nav">
              {["Overview", "Syllabus", "Instructor"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`Main-tab-btn ${
                    activeTab === tab ? "Main-tab-btn-active" : ""
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* TAB CONTENT */}
            {activeTab === "Overview" && (
              <div>
                <h2 className="Main-tab-title">Course Description</h2>
                <p className="Main-tab-content">{course.description}</p>
                <img
                  src={course.thumbnailUrl || "/img/screenshot1.png"}
                  alt={course.title}
                  className="Main-course-detail-image"
                />
              </div>
            )}

            {activeTab === "Syllabus" && (
              <div>
                <h2 className="Main-tab-title">Syllabus</h2>
                {/* Show modules and lessons in read-only mode */}
                <ReadOnlyCourseOutline modules={modules} />
              </div>
            )}

            {activeTab === "Instructor" && (
              <div>
                <h2 className="Main-tab-title">Instructor Information</h2>

                <div className="flex flex-col items-center text-center mt-4">
                  <img
                    className="h-32 w-32 rounded-full border-4 border-white shadow-lg object-cover"
                    src={
                      course.instructor?.profilePicture || "/img/default-avatar.png"
                    }
                    alt={`${course.instructor?.name || "Instructor"}'s profile`}
                  />

                  <h2 className="mt-4 text-2xl font-semibold text-gray-800">
                    {course.instructor?.name || "Instructor"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Course Instructor</p>

                  {course.instructor?.bio ? (
                    <p className="mt-2 text-gray-700 max-w-xl">{course.instructor.bio}</p>
                  ) : (
                    <p className="mt-2 text-gray-500 italic max-w-xl">
                      Instructor has not added a biography.
                    </p>
                  )}

                  <div className="mt-4 p-4 bg-white rounded-lg shadow-md w-full max-w-sm">
                    <h3 className="text-lg font-medium text-gray-700">
                      Total Students Enrolled
                    </h3>
                    <p className="text-2xl font-bold text-pink-600 mt-1">
                      {course.totalStudents ?? "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="Main-course-detail-sidebar">
          <h3 className="Main-sidebar-title">Key Features</h3>

          <div className="Main-sidebar-features-grid">
            {[
              "Hands-on Projects",
              "Real-world Case Studies",
              "Collaborative Learning",
              "Industry-Relevant Content",
            ].map((feature, index) => (
              <div className="Main-feature-item" key={index}>
                <svg
                  className="Main-feature-icon"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4"
                  ></path>
                </svg>
                <span className="Main-feature-text">{feature}</span>
              </div>
            ))}
          </div>

          <h3 className="Main-sidebar-features-title">Enrollment Information</h3>

          <ul className="Main-enrollment-list">
            <li className="Main-enrollment-item">
              <svg
                className="Main-feature-icon"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3"></path>
              </svg>
              <div>
                <strong>Limited Seats Available</strong>
                <p>Enrollment closes in 7 days</p>
              </div>
            </li>

            <li className="Main-enrollment-item">
              <svg
                className="Main-feature-icon"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h4l3 8 4-16 3 8h4"></path>
              </svg>
              <div>
                <strong>12-Month Access</strong>
                <p>Access to course materials for 12 months</p>
              </div>
            </li>

            <li className="Main-enrollment-item">
              <svg
                className="Main-feature-icon"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20H4v-2a3 3 0 015.356-1.857"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <div>
                <strong>Discord Community</strong>
                <p>Join our community on Discord</p>
              </div>
            </li>
          </ul>

          <button
            onClick={handleEnroll}
            className="Main-enroll-btn"
            disabled={
              enrolling ||
              !user ||
              user.role !== "student" ||
              isEnrolled ||
              checkingEnrollment
            }
            style={{
              opacity: !user || user.role !== "student" || isEnrolled ? 0.5 : 1,
              cursor:
                !user || user.role !== "student" || isEnrolled
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {checkingEnrollment
              ? "Checking..."
              : enrolling
              ? "Processing..."
              : isEnrolled
              ? "Enrolled"
              : !user
              ? "Login to Enroll"
              : user.role !== "student"
              ? "Enrollment Not Available"
              : isFreeCourse
              ? "Enroll Now"
              : `Buy Now - $${price.toFixed(2)}`}
          </button>

          <Link to="/courses" className="Main-back-link">
            Back to Courses
          </Link>
        </aside>
      </div>
    </div>
  );
}

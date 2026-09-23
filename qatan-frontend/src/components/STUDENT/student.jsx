import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import LessonViewer from "./LessonViewer";
import "./student.css";

const Student = () => {
  const navigate = useNavigate();
  const { logout, darkMode, setDarkMode, user, updateUser } = useAuth();
  const [activeLink, setActiveLink] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    if (isMobile) setIsMobileMenuOpen(false);
    logout();
    navigate("/");
  };

  const handleProfile = () => {
    setActiveLink("profile");
    if (isMobile) setIsMobileMenuOpen(false);
    // For now, redirect to home
    navigate("/student/home");
  };

  const setActiveAndClose = (link) => {
    setActiveLink(link);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const navLeft = isMobile ? (isMobileMenuOpen ? "0" : "-250px") : "0";

  // Component: StudentHome
  const StudentHome = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchEnrollments = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            "http://localhost:5000/api/enrollments",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.success) {
            setEnrollments(response.data.enrollments);
          }
        } catch (error) {
          console.error("Failed to fetch enrollments:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchEnrollments();
    }, []);

    const enrolledCount = enrollments.length;
    const completedCount = enrollments.filter((e) => e.progress === 100).length;
    const totalHours = enrollments.reduce(
      (sum, e) => sum + (e.progress || 0),
      0
    ); // Placeholder calculation

    return (
      <div
        style={{
          backgroundColor: "var(--bg-color)",
          minHeight: "100vh",
          padding: "var(--padding)",
          fontFamily: "sans-serif",
          textAlign: "left",
        }}
      >
        <button
          style={{
            backgroundColor: "var(--button-bg)",
            color: "var(--button-color)",
            padding: "var(--button-padding)",
            borderRadius: "var(--border-radius-small)",
            border: "none",
            cursor: "pointer",
            marginBottom: "16px",
          }}
          onClick={() => navigate("/")}
        >
          ← Back to Main
        </button>
        <h1
          style={{
            fontSize: "var(--font-size-h1)",
            fontWeight: "bold",
            color: "var(--text-color)",
            marginBottom: "16px",
          }}
        >
          Welcome back, {user?.name || "Student"}!
        </h1>
        <p style={{ color: "var(--secondary-text)", marginBottom: "24px" }}>
          Here's an overview of your learning progress.
        </p>
        <div className="student-responsive-grid">
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              backdropFilter: "blur(4px)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--border-radius)",
              padding: "var(--card-padding)",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "var(--font-size-h3)",
                fontWeight: "600",
                color: "var(--text-color)",
                marginBottom: "var(--spacing-sm)",
              }}
            >
              Courses Enrolled
            </h3>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}
            >
              {loading ? "..." : enrolledCount}
            </p>
          </div>
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              backdropFilter: "blur(4px)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--border-radius)",
              padding: "var(--card-padding)",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "var(--font-size-h3)",
                fontWeight: "600",
                color: "var(--text-color)",
                marginBottom: "var(--spacing-sm)",
              }}
            >
              Completed Courses
            </h3>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}
            >
              {loading ? "..." : completedCount}
            </p>
          </div>
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              backdropFilter: "blur(4px)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--border-radius)",
              padding: "var(--card-padding)",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "var(--font-size-h3)",
                fontWeight: "600",
                color: "var(--text-color)",
                marginBottom: "var(--spacing-sm)",
              }}
            >
              Hours Studied
            </h3>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#f59e0b" }}
            >
              {loading ? "..." : totalHours}
            </p>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            backdropFilter: "blur(4px)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            padding: "var(--card-padding)",
            marginTop: "var(--card-margin-bottom)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--font-size-h2)",
              fontWeight: "bold",
              color: "var(--text-color)",
              marginBottom: "16px",
            }}
          >
            Recent Activity
          </h2>
          <ul
            className="student-recent-activity"
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            <li
              style={{
                padding: "var(--spacing-md)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                className="student-activity-dot"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  marginRight: "var(--spacing-md)",
                }}
              ></div>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-color)",
                    fontWeight: "500",
                  }}
                >
                  Completed lesson: Introduction to React
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "var(--muted-text)",
                    fontSize: "var(--font-size-small)",
                  }}
                >
                  2 hours ago
                </p>
              </div>
            </li>
            <li
              style={{
                padding: "var(--spacing-md)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                className="student-activity-dot"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  marginRight: "var(--spacing-md)",
                }}
              ></div>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-color)",
                    fontWeight: "500",
                  }}
                >
                  Enrolled in: Advanced JavaScript
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "var(--muted-text)",
                    fontSize: "var(--font-size-small)",
                  }}
                >
                  1 day ago
                </p>
              </div>
            </li>
            <li
              style={{
                padding: "var(--spacing-md)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                className="student-activity-dot"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                  marginRight: "var(--spacing-md)",
                }}
              ></div>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-color)",
                    fontWeight: "500",
                  }}
                >
                  Started quiz: CSS Fundamentals
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "var(--muted-text)",
                    fontSize: "var(--font-size-small)",
                  }}
                >
                  3 days ago
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  // Component: StudentCourses
  const StudentCourses = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchEnrollments = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            "http://localhost:5000/api/enrollments",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.success) {
            setEnrollments(response.data.enrollments);
          }
        } catch (error) {
          console.error("Failed to fetch enrollments:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchEnrollments();
    }, []);

    return (
      <div
        style={{
          backgroundColor: "var(--bg-color)",
          minHeight: "100vh",
          padding: "var(--padding)",
          fontFamily: "sans-serif",
          textAlign: "left",
        }}
      >
        <button
          style={{
            backgroundColor: "var(--button-bg)",
            color: "var(--button-color)",
            padding: "var(--button-padding)",
            borderRadius: "var(--border-radius-small)",
            border: "none",
            cursor: "pointer",
            marginBottom: "16px",
          }}
          onClick={() => navigate("/")}
        >
          ← Back to Main
        </button>
        <h1
          style={{
            fontSize: "var(--font-size-h1)",
            fontWeight: "bold",
            color: "var(--text-color)",
            marginBottom: "32px",
          }}
        >
          My Courses
        </h1>
        {loading ? (
          <p style={{ color: "var(--secondary-text)" }}>Loading courses...</p>
        ) : enrollments.length === 0 ? (
          <p style={{ color: "var(--secondary-text)" }}>
            You haven't enrolled in any courses yet.
          </p>
        ) : (
          <div className="student-responsive-grid">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="student-course-card"
                style={{
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "16px",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                  padding: "var(--card-padding)",
                }}
              >
                <img
                  src={
                    enrollment.course.thumbnailUrl || "/img/student/python.png"
                  }
                  alt={enrollment.course.title}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "var(--border-radius)",
                    border: "2px solid rgba(255,255,255,0.3)",
                    marginBottom: "var(--spacing-md)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  }}
                />
                <h3
                  style={{
                    fontSize: "var(--font-size-h3)",
                    fontWeight: "600",
                    color: "var(--text-color)",
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  {enrollment.course.title}
                </h3>
                <p
                  style={{
                    color: "var(--secondary-text)",
                    marginBottom: "var(--spacing-md)",
                  }}
                >
                  {enrollment.course.description}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--font-size-small)",
                      color: "var(--muted-text)",
                    }}
                  >
                    Progress: {enrollment.progress || 0}%
                  </span>
                  <button
                    style={{
                      backgroundColor: "var(--button-bg)",
                      color: "var(--button-color)",
                      padding: "var(--button-padding)",
                      borderRadius: "var(--border-radius-small)",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      navigate("/student/lesson", {
                        state: { courseId: enrollment.course.id },
                      })
                    }
                  >
                    {enrollment.progress > 0 ? "Continue" : "Start"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Component: StudentSettings
  const StudentSettings = () => {
    const [formData, setFormData] = useState({
      name: user?.name || "",
      password: "",
      confirmPassword: "",
      bio: user?.bio || "",
      profilePicture: null,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [previewImage, setPreviewImage] = useState(
      user?.profilePicture || "/img/student/student photo.png"
    );

    useEffect(() => {
      // Update form data when user data changes
      setFormData((prev) => ({
        ...prev,
        name: user?.name || "",
        bio: user?.bio || "",
      }));
      setPreviewImage(user?.profilePicture || "/img/student/student photo.png");
    }, [user]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setFormData((prev) => ({
          ...prev,
          profilePicture: file,
        }));
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => setPreviewImage(e.target.result);
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage({ type: "", text: "" });

      // Validation
      if (formData.password && formData.password !== formData.confirmPassword) {
        setMessage({ type: "error", text: "Passwords do not match" });
        setLoading(false);
        return;
      }

      try {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        if (formData.password) {
          formDataToSend.append("password", formData.password);
          formDataToSend.append("confirmPassword", formData.confirmPassword);
        }
        formDataToSend.append("bio", formData.bio);
        if (formData.profilePicture) {
          formDataToSend.append("profilePicture", formData.profilePicture);
        }

        const token = localStorage.getItem("token");
        const response = await axios.put(
          "http://localhost:5000/api/users/profile",
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          setMessage({
            type: "success",
            text: "Profile updated successfully!",
          });
          // Update user context with new data
          updateUser(response.data.user);
        }
      } catch (error) {
        console.error("Profile update error:", error);
        setMessage({
          type: "error",
          text: "Failed to update profile. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div
        style={{
          backgroundColor: "var(--bg-color)",
          minHeight: "100vh",
          padding: "var(--padding)",
          fontFamily: "sans-serif",
          textAlign: "left",
        }}
      >
        <button
          style={{
            backgroundColor: "var(--button-bg)",
            color: "var(--button-color)",
            padding: "var(--button-padding)",
            borderRadius: "var(--border-radius-small)",
            border: "none",
            cursor: "pointer",
            marginBottom: "16px",
          }}
          onClick={() => navigate("/")}
        >
          ← Back to Main
        </button>
        <h1
          style={{
            fontSize: "var(--font-size-h1)",
            fontWeight: "bold",
            color: "var(--text-color)",
            marginBottom: "32px",
          }}
        >
          Settings
        </h1>
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            backdropFilter: "blur(4px)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            padding: "var(--card-padding)",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: "var(--font-size-h2)",
              fontWeight: "bold",
              color: "var(--text-color)",
              marginBottom: "16px",
            }}
          >
            Profile Settings
          </h2>
          {message.text && (
            <div
              style={{
                padding: "var(--spacing-md)",
                borderRadius: "var(--border-radius-small)",
                marginBottom: "var(--spacing-md)",
                backgroundColor:
                  message.type === "success" ? "#d1fae5" : "#fee2e2",
                color: message.type === "success" ? "#065f46" : "#991b1b",
                border: `1px solid ${
                  message.type === "success" ? "#a7f3d0" : "#fecaca"
                }`,
              }}
            >
              {message.text}
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <div>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
            </div>
            <div>
              <label
                htmlFor="bio"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="4"
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  resize: "vertical",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
            </div>
            <div>
              <label
                htmlFor="profilePicture"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Profile Picture
              </label>
              <input
                type="file"
                id="profilePicture"
                name="profilePicture"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
              />
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    marginTop: "var(--spacing-sm)",
                    objectFit: "cover",
                  }}
                />
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                New Password (optional)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading
                  ? "var(--muted-text)"
                  : "var(--button-bg)",
                color: "var(--button-color)",
                padding: "var(--button-padding)",
                borderRadius: "var(--border-radius-small)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "500",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  e.target.style.backgroundColor = "var(--button-hover)";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  e.target.style.backgroundColor = "var(--button-bg)";
              }}
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Component: StudentHelp
  const StudentHelp = () => {
    return (
      <div
        style={{
          marginLeft: "0px",
          backgroundColor: "var(--bg-color)",
          minHeight: "100vh",
          padding: "var(--padding)",
          fontFamily: "sans-serif",
          textAlign: "left",
        }}
      >
        <button
          style={{
            backgroundColor: "var(--button-bg)",
            color: "var(--button-color)",
            padding: "var(--button-padding)",
            borderRadius: "var(--border-radius-small)",
            border: "none",
            cursor: "pointer",
            marginBottom: "16px",
          }}
          onClick={() => navigate("/")}
        >
          ← Back to Main
        </button>
        <h1
          style={{
            fontSize: "var(--font-size-h1)",
            fontWeight: "bold",
            color: "var(--text-color)",
            marginBottom: "32px",
          }}
        >
          Help & Support
        </h1>
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            backdropFilter: "blur(4px)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            padding: "var(--card-padding)",
            marginBottom: "var(--card-margin-bottom)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--font-size-h2)",
              fontWeight: "bold",
              color: "var(--text-color)",
              marginBottom: "16px",
            }}
          >
            Frequently Asked Questions
          </h2>
          <div
            className="student-faq-item"
            style={{ marginBottom: "var(--spacing-md)" }}
          >
            <h3
              style={{
                fontSize: "var(--font-size-h3)",
                fontWeight: "600",
                color: "var(--text-color)",
                marginBottom: "var(--spacing-sm)",
              }}
            >
              How do I enroll in a course?
            </h3>
            <p style={{ color: "var(--secondary-text)" }}>
              Navigate to the Courses page and click on the "Enroll" button for
              the course you want to take.
            </p>
          </div>
          <div
            className="student-faq-item"
            style={{ marginBottom: "var(--spacing-md)" }}
          >
            <h3
              style={{
                fontSize: "var(--font-size-h3)",
                fontWeight: "600",
                color: "var(--text-color)",
                marginBottom: "var(--spacing-sm)",
              }}
            >
              How can I reset my password?
            </h3>
            <p style={{ color: "var(--secondary-text)" }}>
              Go to Settings and use the "Change Password" field to update your
              password.
            </p>
          </div>
          <div
            className="student-faq-item"
            style={{ marginBottom: "var(--spacing-md)" }}
          >
            <h3
              style={{
                fontSize: "var(--font-size-h3)",
                fontWeight: "600",
                color: "var(--text-color)",
                marginBottom: "var(--spacing-sm)",
              }}
            >
              How do I contact support?
            </h3>
            <p style={{ color: "var(--secondary-text)" }}>
              You can reach out to our support team at support@qatan.edu or use
              the contact form below.
            </p>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            backdropFilter: "blur(4px)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            padding: "var(--card-padding)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--font-size-h2)",
              fontWeight: "bold",
              color: "var(--text-color)",
              marginBottom: "16px",
            }}
          >
            Contact Support
          </h2>
          <form
            className="student-contact-form"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <div>
              <label
                htmlFor="subject"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
            </div>
            <div>
              <label
                htmlFor="message"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="6"
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  resize: "vertical",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              ></textarea>
            </div>
            <button
              type="submit"
              style={{
                backgroundColor: "var(--button-bg)",
                color: "var(--button-color)",
                padding: "var(--button-padding)",
                borderRadius: "var(--border-radius-small)",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "var(--button-hover)")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "var(--button-bg)")
              }
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`m-0 font-sans ${darkMode ? "student-dark" : ""}`}
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <button
        className="student-mobile-menu-button"
        onClick={toggleMobileMenu}
        style={{
          display: isMobile && !isMobileMenuOpen ? "block" : "none",
        }}
      >
        ☰
      </button>
      <nav
        className="student-sidebar fixed top-0 h-screen w-[250px] p-5 flex flex-col transition-all duration-300 ease-in-out z-50 bg-[var(--nav-bg)]"
        style={{ left: navLeft }}
      >
        <button
          className="student-close-btn absolute top-4 right-4 p-2 rounded-md text-gray-400 bg-white ring-1 ring-black ring-opacity-5 shadow-lg"
          onClick={toggleMobileMenu}
          style={{
            color: "var(--text-color)",
            display: isMobile ? "block" : "none",
          }}
        >
          ✕
        </button>
        <div
          className="flex items-center justify-between mb-5"
          style={{
            marginLeft: "var(--spacing-md)",
            marginTop: "var(--spacing-xl)",
            marginBottom: "var(--spacing-xl)",
          }}
        >
          <Link
            to="/student/home"
            className="flex items-center no-underline"
            style={{ color: "var(--text-color)" }}
            onClick={handleProfile}
          >
            <img
              src={user?.profilePicture || "/img/student/student photo.png"}
              alt="profile"
              style={{
                width: "80px",
                borderRadius: "10rem",
                marginRight: "var(--spacing-xxs)",
              }}
            />
            <div>
              <div>{user?.name || "Student"}</div>
              <div
                style={{ fontSize: "small", color: "var(--secondary-text)" }}
              >
                {user?.bio || ""}
              </div>
            </div>
          </Link>
          <label
            className="student-switch mt-5"
            style={{
              marginTop: "var(--spacing-xxl)",
              marginLeft: "var(--spacing-md)",
            }}
          >
            <input
              id="switch"
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            <span className="student-slider"></span>
            <span className="student-decoration"></span>
          </label>
        </div>
        <Link
          to="/student/home"
          onClick={() => setActiveAndClose("home")}
          className="flex items-center no-underline"
          style={{
            marginBottom: "var(--spacing-xl)",
            fontWeight: "bold",
            marginLeft: "var(--spacing-md)",
            color:
              activeLink === "home"
                ? "var(--active-link)"
                : "var(--link-color)",
          }}
        >
          <img
            src={
              activeLink === "home"
                ? "/img/dashboard-hover-blue.png"
                : "/img/dashboard-gray.png"
            }
            alt="Home"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "5px",
              borderRadius: "50%",
            }}
          />
          Home
        </Link>
        <Link
          to="/student/courses"
          onClick={() => setActiveAndClose("courses")}
          className="flex items-center no-underline"
          style={{
            marginBottom: "var(--spacing-xl)",
            fontWeight: "bold",
            marginLeft: "var(--spacing-md)",
            color:
              activeLink === "courses"
                ? "var(--active-link)"
                : "var(--link-color)",
          }}
        >
          <img
            src={
              activeLink === "courses"
                ? "/img/courses-hover-blue.png"
                : "/img/courses-gray.png"
            }
            alt="Courses"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "var(--spacing-xxs)",
              borderRadius: "50%",
            }}
          />
          My Courses
        </Link>
        <Link
          to="/student/settings"
          onClick={() => setActiveAndClose("settings")}
          className="flex items-center no-underline"
          style={{
            marginBottom: "var(--spacing-xl)",
            fontWeight: "bold",
            marginLeft: "var(--spacing-md)",
            color:
              activeLink === "settings"
                ? "var(--active-link)"
                : "var(--link-color)",
          }}
        >
          <img
            src={
              activeLink === "settings"
                ? "/img/settings-hover-blue.png"
                : "/img/settings-gray.png"
            }
            alt="Settings"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "5px",
              borderRadius: "50%",
            }}
          />
          Settings
        </Link>
        <Link
          to="/student/help"
          onClick={() => setActiveAndClose("help")}
          className="flex items-center no-underline"
          style={{
            marginBottom: "var(--spacing-xl)",
            fontWeight: "bold",
            marginLeft: "var(--spacing-md)",
            color:
              activeLink === "help"
                ? "var(--active-link)"
                : "var(--link-color)",
          }}
        >
          <img
            src={
              activeLink === "help"
                ? "/img/reports-hover-blue.png"
                : "/img/reports-gray.png"
            }
            alt="Help"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "var(--spacing-xxs)",
              borderRadius: "50%",
            }}
          />
          Help
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center no-underline"
          style={{
            marginBottom: "var(--spacing-xl)",
            fontWeight: "bold",
            marginLeft: "var(--spacing-md)",
            color:
              activeLink === "logout"
                ? "var(--active-link)"
                : "var(--link-color)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <img
            src={
              activeLink === "logout"
                ? "/img/logout-hover-blue.png"
                : "/img/logout-grey.png"
            }
            alt="Logout"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "var(--spacing-xxs)",
              borderRadius: "50%",
            }}
          />
          Logout
        </button>
      </nav>
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileMenu}
        />
      )}
      <div
        className="student-main-content min-h-screen p-5"
        style={{ marginLeft: "var(--main-margin-left)" }}
        onClick={isMobile && isMobileMenuOpen ? toggleMobileMenu : undefined}
      >
        <Routes>
          <Route index element={<StudentHome />} />
          <Route path="/" element={<StudentHome />} />
          <Route path="dashboard" element={<StudentHome />} />
          <Route path="home" element={<StudentHome />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="lesson" element={<LessonViewer />} />
          <Route path="settings" element={<StudentSettings />} />
          <Route path="help" element={<StudentHelp />} />
        </Routes>
      </div>
    </div>
  );
};

export default Student;

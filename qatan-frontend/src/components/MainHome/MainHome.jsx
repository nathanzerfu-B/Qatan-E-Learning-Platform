import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MainIndex.css";

export default function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Fetch popular courses from new popular endpoint
        const response = await axios.get("http://localhost:5000/api/courses/popular");
        if (response.data.success) {
          setCourses(response.data.courses);
        }
      } catch (error) {
        console.error("Failed to fetch popular courses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const popular = courses;

  return (
    <div>
      <section className="Main-hero-section">
        <div>
          <h1 className="Main-hero-title">
            Upskill with expert-led online courses
          </h1>
          <p className="Main-hero-description">
            Practical, project-based learning to launch or advance your career.
          </p>
          <div className="Main-hero-buttons">
            <button
              onClick={() => navigate("courses")}
              className="Main-hero-btn-primary"
            >
              Get started
            </button>
            <button
              onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}
              className="Main-hero-btn-secondary"
            >
              Explore
            </button>
          </div>
        </div>
        <div>
          <img src="/img/hero-man.png" alt="hero" className="Main-hero-image" />
        </div>
      </section>

      {/* What you're looking for - kept */}
      <section className="Main-popular-courses">
        <h2 className="Main-section-title">What are you looking for?</h2>
        <div className="Main-categories-grid">
          {["Development", "Business", "Design", "Marketing"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                // Navigate reliably to courses with updated category param
                navigate(`/courses?category=${encodeURIComponent(cat)}`, { replace: false });
              }}
              className="Main-category-card"
            >
              <img
                src="/img/screenshot1.png"
                alt={cat}
                className="Main-category-image"
              />
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Popular course */}
      <section className="Main-popular-courses">
        <h2 className="Main-section-title">Popular course</h2>
        <div className="Main-popular-grid">
          {loading ? (
            <div className="Main-loading">Loading courses...</div>
          ) : popular.length > 0 ? (
            popular.map((c) => (
              <div
                key={c.id}
                className="Main-course-card"
                onClick={() => navigate(`courses/${c.id}`)}
              >
                <img
                  src={c.thumbnailUrl || "/img/screenshot1.png"}
                  alt={c.title}
                  className="Main-course-image"
                />
                <h3 className="Main-course-title">{c.title}</h3>
                <p className="Main-course-meta">
                  {c.title} • {c.instructor?.name || "Instructor"} •{" "}
                  {c.duration || "Duration"}
                </p>
              </div>
            ))
          ) : (
            <div className="Main-no-courses">No courses available</div>
          )}
        </div>
        <div className="Main-mt-4">
          <button
            onClick={() => navigate("courses")}
            className="Main-view-all-btn"
          >
            Show all course
          </button>
        </div>
      </section>
    </div>
  );
}

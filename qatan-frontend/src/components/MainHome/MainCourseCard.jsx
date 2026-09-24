import React from "react";
import { Link } from "react-router-dom";
import "./MainIndex.css";

export default function CourseCard({ course }) {
  const price = parseFloat(course.price);
  const isFree = isNaN(price) || price === 0;

  return (
    <Link to={`${course.id}`} className="Main-course-card-link">
      <article className="Main-course-article">
        <div className="Main-course-image-container">
          <img
            src={course.thumbnailUrl || "/img/screenshot1.png"}
            alt={course.title}
            className="Main-course-image-fit"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/img/screenshot1.png";
            }}
          />
        </div>
        <h3 className="Main-course-card-title">{course.title}</h3>
        <p className="Main-course-card-meta">
          {course.instructor?.name || "Lead Instructor"} •{" "}
          {course.duration || "Self-paced"}
        </p>
        <div className="Main-course-card-footer">
          <span className="Main-course-price">
            {isFree ? "Free" : `$${price.toFixed(2)}`}
          </span>
          <span className="Main-course-category">
            {course.category || "General"}
          </span>
        </div>
      </article>
    </Link>
  );
}

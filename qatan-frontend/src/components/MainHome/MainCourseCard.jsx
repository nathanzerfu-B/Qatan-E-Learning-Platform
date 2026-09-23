import React from "react";
import { Link } from "react-router-dom";
import "./MainIndex.css";

export default function CourseCard({ course }) {
  return (
    <Link to={`${course.id}`} className="Main-course-card-link">
      <article className="Main-course-article">
        <div className="Main-course-image-container">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="Main-course-image-fit"
            />
          ) : (
            <img
              src="/img/screenshot1.png"
              alt={course.title}
              className="Main-course-image-fit"
            />
          )}
        </div>
        <h3 className="Main-course-card-title">{course.title}</h3>
        <p className="Main-course-card-meta">
          {course.instructor?.name || "Instructor"} •{" "}
          {course.duration || "Duration"}
        </p>
        <div className="Main-course-card-footer">
          <span className="Main-course-price">
            {(() => {
              const price = parseFloat(course.price);
              return isNaN(price) || price === 0 ? "Free" : `$${price}`;
            })()}
          </span>
          <span className="Main-course-category">
            {course.category || "General"}
          </span>
        </div>
      </article>
    </Link>
  );
}

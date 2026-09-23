import React from "react";
import "./CourseSkeleton.css";

export default function CourseSkeleton({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-thumbnail shimmer" />
          <div className="skeleton-content">
            <div className="skeleton-badge shimmer" />
            <div className="skeleton-title shimmer" />
            <div className="skeleton-text shimmer" />
            <div className="skeleton-footer">
              <div className="skeleton-price shimmer" />
              <div className="skeleton-btn shimmer" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

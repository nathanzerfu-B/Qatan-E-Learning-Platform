import React from "react";

export default function ReadOnlyCourseOutline({ modules }) {
  if (!modules || modules.length === 0) {
    return <p className="Main-no-syllabus">No syllabus available.</p>;
  }

  return (
    <div className="readonly-syllabus">
      {modules.map((module) => (
        <div key={module.id} className="readonly-module">
          <h3 className="readonly-module-title">{module.title}</h3>
          <ul className="readonly-lesson-list">
            {(module.lessons || []).map((lesson) => (
              <li key={lesson.id} className="readonly-lesson-item">
                {lesson.title}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

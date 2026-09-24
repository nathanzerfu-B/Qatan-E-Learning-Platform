import React, { useState } from "react";

export default function ReadOnlyCourseOutline({ modules }) {
  const [expanded, setExpanded] = useState(() => {
    // Default: first module expanded
    const initial = {};
    if (modules && modules.length > 0) {
      initial[modules[0].id] = true;
    }
    return initial;
  });

  if (!modules || modules.length === 0) {
    return (
      <div className="p-6 text-center rounded-xl border border-dashed border-border text-muted-foreground">
        <p className="text-sm">No syllabus available for this course yet.</p>
      </div>
    );
  }

  const toggleModule = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all = {};
    modules.forEach((m) => {
      all[m.id] = true;
    });
    setExpanded(all);
  };

  const collapseAll = () => {
    setExpanded({});
  };

  const totalLessons = modules.reduce(
    (sum, m) => sum + (m.lessons ? m.lessons.length : 0),
    0
  );

  return (
    <div className="readonly-syllabus-wrapper">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          {modules.length} Modules • {totalLessons} Lessons
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Expand All
          </button>
          <span className="text-muted-foreground text-xs">•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs font-semibold text-muted-foreground hover:underline"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {modules.map((module, mIdx) => {
          const isOpen = !!expanded[module.id];
          const lessonCount = module.lessons ? module.lessons.length : 0;

          return (
            <div
              key={module.id || mIdx}
              className="border border-border/80 rounded-xl overflow-hidden bg-card transition-all duration-200 shadow-sm hover:border-border"
            >
              <button
                type="button"
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-4 text-left bg-muted/30 hover:bg-muted/60 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    {mIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {module.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {isOpen ? "Collapse" : "Expand"}
                  </span>
                  <svg
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="p-3 divide-y divide-border/40 bg-card">
                  {module.lessons && module.lessons.length > 0 ? (
                    module.lessons.map((lesson, lIdx) => (
                      <div
                        key={lesson.id || lIdx}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-4 h-4 text-muted-foreground shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-xs sm:text-sm font-medium text-foreground">
                            {lesson.title}
                          </span>
                        </div>
                        {lesson.duration && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {lesson.duration}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-2 px-3 italic">
                      No lessons listed for this module yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


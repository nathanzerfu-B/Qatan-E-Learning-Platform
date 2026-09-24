import React from "react";

export default function CourseCard({ course }) {
  const price = parseFloat(course.price);
  const isFree = isNaN(price) || price === 0;

  const totalLessons = course.modules?.reduce(
    (acc, m) => acc + (m.lessons ? m.lessons.length : 0),
    0
  );

  return (
    <article className="group relative flex flex-col h-full bg-card hover:bg-card/95 border border-border hover:border-primary/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer">
      {/* Thumbnail Container (16:9 Aspect Ratio) */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <img
          src={course.thumbnailUrl || "/img/screenshot1.png"}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/img/screenshot1.png";
          }}
        />
        {/* Subtle Dark Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Floating Category Pill */}
        <div className="absolute top-3 left-3 z-10">
          <span className="backdrop-blur-md bg-background/90 dark:bg-[#121824]/90 text-foreground font-semibold text-[11px] px-2.5 py-1 rounded-full border border-border/60 shadow-sm">
            {course.category || "General"}
          </span>
        </div>

        {/* Floating Price Pill */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`font-bold text-xs px-2.5 py-0.5 rounded-full shadow-md ${
              isFree
                ? "bg-emerald-500 text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isFree ? "Free" : `$${price.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Card Details Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Instructor & Rating Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-2 truncate">
            {course.instructor?.profilePicture ? (
              <img
                src={course.instructor.profilePicture}
                alt={course.instructor.name}
                className="w-5 h-5 rounded-full object-cover shrink-0 border border-border/70"
              />
            ) : (
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                {(course.instructor?.name || "I")[0].toUpperCase()}
              </span>
            )}
            <span className="font-medium text-foreground/80 truncate">
              {course.instructor?.name || "Lead Instructor"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-amber-500 font-bold shrink-0">
            <span>★</span>
            <span className="text-foreground/90 font-medium">4.9</span>
          </div>
        </div>

        {/* Course Title */}
        <h3 className="font-bold text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors my-1.5">
          {course.title}
        </h3>

        {/* Course Description */}
        {course.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 flex-1">
            {course.description}
          </p>
        )}

        {/* Metadata Badges: Lessons & Duration */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 font-medium">
          {totalLessons > 0 && (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {totalLessons} lessons
            </span>
          )}
          {course.duration ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {course.duration}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Self-paced
            </span>
          )}
        </div>

        {/* Bottom Footer Row */}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-foreground">
              {isFree ? "Free" : `$${price.toFixed(2)}`}
            </span>
            {!isFree && (
              <span className="text-[10px] text-muted-foreground">one-time</span>
            )}
          </div>
          <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
            <span>View Course</span>
            <span className="text-sm">→</span>
          </span>
        </div>
      </div>
    </article>
  );
}

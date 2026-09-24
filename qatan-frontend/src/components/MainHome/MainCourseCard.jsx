import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

export default function CourseCard({ course }) {
  const price = parseFloat(course.price);
  const isFree = isNaN(price) || price === 0;

  const totalLessons = course.modules?.reduce(
    (acc, m) => acc + (m.lessons ? m.lessons.length : 0),
    0
  );

  return (
    <Card className="group overflow-hidden flex flex-col h-full hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer rounded-2xl bg-card border border-border">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={course.thumbnailUrl || "/img/screenshot1.png"}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="backdrop-blur-md bg-background/85 font-semibold shadow-sm border border-border/50 text-foreground text-xs"
          >
            {course.category || "General"}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge
            variant={isFree ? "success" : "default"}
            className="font-bold shadow-md text-xs px-2.5 py-0.5"
          >
            {isFree ? "Free" : `$${price}`}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5">
          <div className="flex items-center gap-2 truncate">
            {course.instructor?.profilePicture ? (
              <img
                src={course.instructor.profilePicture}
                alt={course.instructor.name}
                className="w-5 h-5 rounded-full object-cover shrink-0"
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

        <h3 className="font-bold text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-2">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
            {course.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 font-medium">
          {totalLessons > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {totalLessons} lessons
            </span>
          )}
          {course.duration && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {course.duration}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
          <span className="text-base font-extrabold text-foreground">
            {isFree ? "Free" : `$${price}`}
          </span>
          <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
            View Course →
          </span>
        </div>
      </div>
    </Card>
  );
}

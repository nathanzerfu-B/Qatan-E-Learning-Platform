import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

export default function CourseCard({ course }) {
  const price = parseFloat(course.price);
  const isFree = isNaN(price) || price === 0;

  return (
    <Card className="group overflow-hidden flex flex-col h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={course.thumbnailUrl || "/img/screenshot1.png"}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="backdrop-blur-md bg-background/85 font-medium shadow-sm border border-border/50 text-foreground"
          >
            {course.category || "General"}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge
            variant={isFree ? "success" : "default"}
            className="font-semibold shadow-sm"
          >
            {isFree ? "Free" : `$${price}`}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="font-medium text-foreground/80 truncate">
            {course.instructor?.name || "Lead Instructor"}
          </span>
          {course.duration && (
            <>
              <span>•</span>
              <span className="shrink-0">{course.duration}</span>
            </>
          )}
        </div>

        <h3 className="font-bold text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-2">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
            {course.description}
          </p>
        )}

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

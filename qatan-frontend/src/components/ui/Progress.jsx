import React from "react";

export function Progress({
  value = 0,
  max = 100,
  className = "",
  indicatorClassName = "",
  showLabel = false,
  ...props
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full bg-primary transition-all duration-500 ease-out rounded-full ${indicatorClassName}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between text-xs text-muted-foreground font-medium">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}

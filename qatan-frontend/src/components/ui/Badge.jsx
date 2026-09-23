import React from "react";

export function Badge({
  className = "",
  variant = "default",
  children,
  ...props
}) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground border border-border hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive/15 text-destructive border border-destructive/20",
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    primary: "bg-primary/15 text-primary border border-primary/20",
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${selectedVariant} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

import React from "react";

export function getPasswordCriteria(password = "") {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      id: "letter",
      label: "Contains letters (a-z, A-Z)",
      met: /[a-zA-Z]/.test(password),
    },
    {
      id: "number",
      label: "Contains numbers (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: "Contains a special character (!@#$...)",
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
  ];
}

export function calculatePasswordStrength(password = "") {
  if (!password) return { score: 0, label: "", color: "" };
  
  const criteria = getPasswordCriteria(password);
  const metCount = criteria.filter((c) => c.met).length;

  if (metCount <= 1) {
    return { score: 1, label: "Weak", color: "bg-red-500", text: "text-red-500" };
  } else if (metCount === 2) {
    return { score: 2, label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
  } else if (metCount === 3) {
    return { score: 3, label: "Good", color: "bg-blue-500", text: "text-blue-500" };
  } else {
    return { score: 4, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  }
}

export default function PasswordStrengthMeter({ password = "", showDetails = true }) {
  if (!password) return null;

  const criteria = getPasswordCriteria(password);
  const { score, label, color, text } = calculatePasswordStrength(password);

  return (
    <div className="w-full mt-2 space-y-2 text-left animate-fadeIn">
      {/* 4 Segmented Progress Bar */}
      <div className="flex items-center justify-between gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              step <= score ? color : "bg-muted dark:bg-zinc-800"
            }`}
          />
        ))}
        <span className={`text-[11px] font-bold ml-1.5 ${text} transition-colors`}>
          {label}
        </span>
      </div>

      {/* Criteria Checklist */}
      {showDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[11px]">
          {criteria.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-1.5 transition-colors ${
                item.met
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-muted-foreground opacity-70"
              }`}
            >
              <span className="text-[12px] leading-none">
                {item.met ? "✓" : "○"}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

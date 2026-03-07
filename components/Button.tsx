import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

  const styles =
    variant === "secondary"
      ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20"
      : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10";

  return (
    <button
      type={type}
      disabled={disabled}
      {...props}
      className={`${base} ${styles} ${className}`}
    />
  );
}
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
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

  const styles =
    variant === "secondary"
      ? `
        border border-slate-200
        bg-white
        text-slate-700
        hover:border-[#06A6FF]
        hover:text-[#0B2A5B]
        hover:bg-sky-50
        shadow-sm
      `
      : variant === "danger"
      ? `
        bg-red-600
        text-white
        hover:bg-red-700
        shadow-lg shadow-red-600/20
      `
      : `
        bg-gradient-to-r from-[#06A6FF] to-[#0B2A5B]
        text-white
        hover:brightness-110
        shadow-lg shadow-sky-500/20
      `;

  return (
    <button
      type={type}
      disabled={disabled}
      {...props}
      className={`${base} ${styles} ${className}`}
    />
  );
}
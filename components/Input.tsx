import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-[#06A6FF] focus:ring-4 focus:ring-[#06A6FF]/15 ${className}`}
    />
  );
}
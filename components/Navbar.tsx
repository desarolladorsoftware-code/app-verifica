import React from "react";

export function Navbar({ right }: { right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="font-extrabold tracking-tight">verifica</div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </div>
  );
}
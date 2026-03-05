import React from "react";

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200 bg-white">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}
import * as React from "react";

export function Navbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-md">
            V
          </div>

          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Verifica</p>
            <p className="text-xs text-slate-500">Panel administrativo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}
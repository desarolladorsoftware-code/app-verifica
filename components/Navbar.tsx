import * as React from "react";

export function Navbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="CEDULL"
              className="h-10 w-auto object-contain"
            />
          </a>
        </div>

        {/* Botones lado derecho */}
        <div className="flex items-center gap-2">
          {right}
        </div>

      </div>
    </header>
  );
}
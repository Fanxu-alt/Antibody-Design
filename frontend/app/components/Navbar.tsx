"use client";

import BackendStatus from "./BackendStatus";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/generate", label: "Generate" },
  { href: "/predict", label: "Predict" },
  { href: "/developability", label: "Developability" },
  { href: "/agent", label: "Agent" },
  { href: "/help", label: "Help" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
        <a href="/" className="text-xl font-bold tracking-tight text-slate-950">
          Antibody Design
        </a>

        <div className="flex items-center gap-6">
          <nav className="hidden gap-8 text-sm font-medium text-slate-600 md:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-blue-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <BackendStatus />
        </div>
      </div>
    </header>
  );
}

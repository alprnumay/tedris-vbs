import type { ReactNode } from "react";

export function DavetLayout({ children }: { children: ReactNode }) {
  return (
    <div className="davet-module-root min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tedris VBS</p>
        <h1 className="text-lg font-bold text-foreground">Nehari Platformu</h1>
      </header>
      <main className="mx-auto w-full max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  );
}

export default DavetLayout;

import type { ReactNode } from "react";

export function DavetLayout({ children }: { children: ReactNode }) {
  return (
    <div className="davet-module-root min-h-screen bg-slate-50/90 text-foreground dark:bg-background">
      <header className="border-b border-border/80 bg-card/95 px-4 py-2.5 backdrop-blur-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Tedris VBS</p>
        <h1 className="text-base font-bold text-foreground sm:text-lg">Nehari Platformu</h1>
      </header>
      <main className="mx-auto w-full max-w-6xl p-3 sm:p-4 md:p-6">{children}</main>
    </div>
  );
}

export default DavetLayout;

import type { ReactNode } from "react";

type Props = {
  left?: ReactNode;
  center?: ReactNode;
  right: ReactNode;
};

export function BottomActionBar({ left, center, right }: Props) {
  return (
    <div
      className="veli-wizard-bottom-bar fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <div className="min-w-[4.5rem]">{left}</div>
        <div className="flex-1">{center}</div>
        <div className="min-w-[5.5rem] flex justify-end">{right}</div>
      </div>
    </div>
  );
}

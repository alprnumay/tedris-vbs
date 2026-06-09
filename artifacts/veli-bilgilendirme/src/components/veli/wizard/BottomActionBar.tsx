import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  left?: ReactNode;
  center?: ReactNode;
  right: ReactNode;
  hasBack?: boolean;
};

export function BottomActionBar({ left, center, right, hasBack }: Props) {
  return (
    <div className="veli-wizard-bottom-bar lg:hidden">
      <div
        className={cn(
          "veli-wizard-bottom-bar__grid",
          hasBack && "veli-wizard-bottom-bar__grid--with-back",
        )}
      >
        {hasBack ? <div className="veli-wizard-bottom-bar__slot veli-wizard-bottom-bar__slot--left">{left}</div> : null}
        <div className="veli-wizard-bottom-bar__slot veli-wizard-bottom-bar__slot--center">{center}</div>
        <div className="veli-wizard-bottom-bar__slot veli-wizard-bottom-bar__slot--right">{right}</div>
      </div>
    </div>
  );
}

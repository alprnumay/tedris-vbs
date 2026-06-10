import React, { useCallback, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  BOARDING_LAYER_LABELS,
  buildBoardingLayerStyle,
  type BoardingLayerId,
} from "@/modules/davet/boarding/boardingLayoutAdjustments";
import { useBoardingLayoutEditor } from "@/modules/davet/boarding/BoardingLayoutEditorContext";

export function EditableBoardingLayer({
  layerId,
  label,
  children,
  className,
  style,
  hidden,
}: {
  layerId: BoardingLayerId;
  label?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hidden?: boolean;
}) {
  const { editMode, selectedLayerId, setSelectedLayerId, getAdjustment, updateAdjustment } = useBoardingLayoutEditor();
  const adj = getAdjustment(layerId);
  const isSelected = editMode && selectedLayerId === layerId;
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode) return;
      e.stopPropagation();
      setSelectedLayerId(layerId);
    },
    [editMode, layerId, setSelectedLayerId],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode || !isSelected) return;
      e.preventDefault();
      dragRef.current = { sx: e.clientX, sy: e.clientY, ox: adj?.x ?? 0, oy: adj?.y ?? 0 };
      const move = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        updateAdjustment(layerId, {
          x: dragRef.current.ox + (ev.clientX - dragRef.current.sx),
          y: dragRef.current.oy + (ev.clientY - dragRef.current.sy),
        });
      };
      const up = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    },
    [adj?.x, adj?.y, editMode, isSelected, layerId, updateAdjustment],
  );

  if (hidden) return null;

  return (
    <div
      className={cn("relative max-w-full", editMode && "cursor-pointer", isSelected && "z-20 ring-2 ring-blue-500 ring-offset-2", className)}
      style={{ ...style, ...buildBoardingLayerStyle(adj), position: "relative" }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      data-boarding-layer={layerId}
    >
      {isSelected ? (
        <span className="pointer-events-none absolute -top-7 left-0 z-30 whitespace-nowrap rounded bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
          {label ?? BOARDING_LAYER_LABELS[layerId]}
        </span>
      ) : null}
      {children}
    </div>
  );
}

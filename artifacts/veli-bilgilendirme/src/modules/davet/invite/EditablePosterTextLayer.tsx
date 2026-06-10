import React, { useCallback, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { buildLayerStyle, TEXT_LAYER_LABELS, type TextLayerId } from "@/modules/davet/invite/inviteLayoutAdjustments";
import { useInviteLayoutEditor } from "@/modules/davet/invite/InviteLayoutEditorContext";

type Props = {
  layerId: TextLayerId;
  label?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hidden?: boolean;
  inline?: boolean;
};

export function EditablePosterTextLayer({
  layerId,
  label,
  children,
  className,
  style,
  hidden,
  inline = false,
}: Props) {
  const { editMode, selectedLayerId, setSelectedLayerId, getAdjustment, updateAdjustment } =
    useInviteLayoutEditor();
  const adj = getAdjustment(layerId);
  const isSelected = editMode && selectedLayerId === layerId;
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode) return;
      e.stopPropagation();
      setSelectedLayerId(layerId);
    },
    [editMode, layerId, setSelectedLayerId],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode || !isSelected || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: adj?.x ?? 0,
        origY: adj?.y ?? 0,
      };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        updateAdjustment(layerId, {
          x: dragRef.current.origX + dx,
          y: dragRef.current.origY + dy,
        });
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [adj?.x, adj?.y, editMode, isSelected, layerId, updateAdjustment],
  );

  if (hidden) return null;

  const layerStyle: CSSProperties = {
    ...style,
    ...buildLayerStyle(adj),
    position: "relative",
  };

  const Wrapper = inline ? "span" : "div";

  return (
    <Wrapper
      className={cn(
        "relative max-w-full",
        editMode && "cursor-pointer select-none",
        isSelected && "z-20 rounded-sm ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent",
        className,
      )}
      style={layerStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      data-poster-layer={layerId}
      role={editMode ? "button" : undefined}
      tabIndex={editMode ? 0 : undefined}
    >
      {isSelected ? (
        <span className="pointer-events-none absolute -top-7 left-0 z-30 whitespace-nowrap rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
          {label ?? TEXT_LAYER_LABELS[layerId]}
        </span>
      ) : null}
      {children}
    </Wrapper>
  );
}

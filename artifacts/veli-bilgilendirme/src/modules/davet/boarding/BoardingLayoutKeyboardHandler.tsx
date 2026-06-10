import { useEffect } from "react";
import { BOARDING_ADJ_LIMITS } from "@/modules/davet/boarding/boardingLayoutAdjustments";
import { useBoardingLayoutEditor } from "@/modules/davet/boarding/BoardingLayoutEditorContext";

export function BoardingLayoutKeyboardHandler() {
  const { editMode, selectedLayerId, setSelectedLayerId, getAdjustment, updateAdjustment } = useBoardingLayoutEditor();

  useEffect(() => {
    if (!editMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedLayerId(null);
        return;
      }
      if (!selectedLayerId) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const step = e.shiftKey ? 10 : 4;
      const c = getAdjustment(selectedLayerId) ?? { x: 0, y: 0 };
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        updateAdjustment(selectedLayerId, { x: Math.max(BOARDING_ADJ_LIMITS.x.min, (c.x ?? 0) - step) });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        updateAdjustment(selectedLayerId, { x: Math.min(BOARDING_ADJ_LIMITS.x.max, (c.x ?? 0) + step) });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        updateAdjustment(selectedLayerId, { y: Math.max(BOARDING_ADJ_LIMITS.y.min, (c.y ?? 0) - step) });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        updateAdjustment(selectedLayerId, { y: Math.min(BOARDING_ADJ_LIMITS.y.max, (c.y ?? 0) + step) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editMode, getAdjustment, selectedLayerId, setSelectedLayerId, updateAdjustment]);

  return null;
}

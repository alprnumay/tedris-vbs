import { useEffect } from "react";
import { ADJUSTMENT_LIMITS } from "@/modules/davet/invite/inviteLayoutAdjustments";
import { useInviteLayoutEditor } from "@/modules/davet/invite/InviteLayoutEditorContext";

export function InviteLayoutKeyboardHandler() {
  const { editMode, selectedLayerId, setSelectedLayerId, getAdjustment, updateAdjustment } =
    useInviteLayoutEditor();

  useEffect(() => {
    if (!editMode) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedLayerId(null);
        return;
      }

      if (!selectedLayerId) return;

      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const step = e.shiftKey ? 10 : 1;
      const current = getAdjustment(selectedLayerId) ?? { x: 0, y: 0 };

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          updateAdjustment(selectedLayerId, {
            x: Math.max(ADJUSTMENT_LIMITS.x.min, (current.x ?? 0) - step),
          });
          break;
        case "ArrowRight":
          e.preventDefault();
          updateAdjustment(selectedLayerId, {
            x: Math.min(ADJUSTMENT_LIMITS.x.max, (current.x ?? 0) + step),
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          updateAdjustment(selectedLayerId, {
            y: Math.max(ADJUSTMENT_LIMITS.y.min, (current.y ?? 0) - step),
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          updateAdjustment(selectedLayerId, {
            y: Math.min(ADJUSTMENT_LIMITS.y.max, (current.y ?? 0) + step),
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editMode, getAdjustment, selectedLayerId, setSelectedLayerId, updateAdjustment]);

  return null;
}

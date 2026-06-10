import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { BoardingTemplateId } from "@/modules/davet/boarding/boardingTemplateHelpers";
import {
  clampBoardingAdjustment,
  isBoardingAdjustmentActive,
  type BoardingCustomAdjustments,
  type BoardingLayerAdjustment,
  type BoardingLayerId,
  type BoardingTemplateAdjustments,
} from "@/modules/davet/boarding/boardingLayoutAdjustments";

type Ctx = {
  editMode: boolean;
  templateId: BoardingTemplateId;
  selectedLayerId: BoardingLayerId | null;
  setSelectedLayerId: (id: BoardingLayerId | null) => void;
  getAdjustment: (id: BoardingLayerId) => BoardingLayerAdjustment | undefined;
  updateAdjustment: (id: BoardingLayerId, patch: Partial<BoardingLayerAdjustment>) => void;
  resetLayer: (id: BoardingLayerId) => void;
  resetTemplate: () => void;
};

const BoardingLayoutEditorContext = createContext<Ctx | null>(null);

export function BoardingLayoutEditorProvider({
  children,
  editMode,
  templateId,
  selectedLayerId,
  setSelectedLayerId,
  customAdjustments,
  setCustomAdjustments,
}: {
  children: ReactNode;
  editMode: boolean;
  templateId: BoardingTemplateId;
  selectedLayerId: BoardingLayerId | null;
  setSelectedLayerId: (id: BoardingLayerId | null) => void;
  customAdjustments: BoardingCustomAdjustments;
  setCustomAdjustments: React.Dispatch<React.SetStateAction<BoardingCustomAdjustments>>;
}) {
  const templateAdj = customAdjustments[templateId] ?? {};

  const getAdjustment = useCallback(
    (id: BoardingLayerId) => {
      const adj = templateAdj[id];
      return isBoardingAdjustmentActive(adj) ? adj : undefined;
    },
    [templateAdj],
  );

  const updateAdjustment = useCallback(
    (id: BoardingLayerId, patch: Partial<BoardingLayerAdjustment>) => {
      setCustomAdjustments((prev) => ({
        ...prev,
        [templateId]: {
          ...(prev[templateId] ?? {}),
          [id]: clampBoardingAdjustment({ ...(prev[templateId]?.[id] ?? { x: 0, y: 0 }), ...patch }),
        },
      }));
    },
    [setCustomAdjustments, templateId],
  );

  const resetLayer = useCallback(
    (id: BoardingLayerId) => {
      setCustomAdjustments((prev) => {
        const t = { ...(prev[templateId] ?? {}) };
        delete t[id];
        const next = { ...prev };
        if (Object.keys(t).length === 0) delete next[templateId];
        else next[templateId] = t;
        return next;
      });
      setSelectedLayerId(null);
    },
    [setCustomAdjustments, setSelectedLayerId, templateId],
  );

  const resetTemplate = useCallback(() => {
    setCustomAdjustments((prev) => {
      const next = { ...prev };
      delete next[templateId];
      return next;
    });
    setSelectedLayerId(null);
  }, [setCustomAdjustments, setSelectedLayerId, templateId]);

  const value = useMemo(
    () => ({ editMode, templateId, selectedLayerId, setSelectedLayerId, getAdjustment, updateAdjustment, resetLayer, resetTemplate }),
    [editMode, templateId, selectedLayerId, setSelectedLayerId, getAdjustment, updateAdjustment, resetLayer, resetTemplate],
  );

  return <BoardingLayoutEditorContext.Provider value={value}>{children}</BoardingLayoutEditorContext.Provider>;
}

export function useBoardingLayoutEditor() {
  const ctx = useContext(BoardingLayoutEditorContext);
  if (!ctx) {
    return {
      editMode: false,
      templateId: "program-odakli-premium" as BoardingTemplateId,
      selectedLayerId: null as BoardingLayerId | null,
      setSelectedLayerId: (_id: BoardingLayerId | null) => {},
      getAdjustment: (_id: BoardingLayerId) => undefined as BoardingLayerAdjustment | undefined,
      updateAdjustment: (_id: BoardingLayerId, _p: Partial<BoardingLayerAdjustment>) => {},
      resetLayer: (_id: BoardingLayerId) => {},
      resetTemplate: () => {},
    };
  }
  return ctx;
}

import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { InviteTemplateId } from "@/modules/davet/invite/inviteTemplateHelpers";
import {
  clampAdjustment,
  isAdjustmentActive,
  mergeLayerAdjustment,
  type CustomLayoutAdjustments,
  type TextLayerAdjustment,
  type TextLayerId,
  type TemplateLayoutAdjustments,
} from "@/modules/davet/invite/inviteLayoutAdjustments";

type InviteLayoutEditorContextValue = {
  editMode: boolean;
  templateId: InviteTemplateId;
  selectedLayerId: TextLayerId | null;
  setSelectedLayerId: (id: TextLayerId | null) => void;
  getAdjustment: (layerId: TextLayerId) => TextLayerAdjustment | undefined;
  updateAdjustment: (layerId: TextLayerId, patch: Partial<TextLayerAdjustment>) => void;
  resetLayer: (layerId: TextLayerId) => void;
  resetTemplate: () => void;
  resetAll: () => void;
};

const InviteLayoutEditorContext = createContext<InviteLayoutEditorContextValue | null>(null);

export function InviteLayoutEditorProvider({
  children,
  editMode,
  templateId,
  selectedLayerId,
  setSelectedLayerId,
  customLayoutAdjustments,
  setCustomLayoutAdjustments,
}: {
  children: ReactNode;
  editMode: boolean;
  templateId: InviteTemplateId;
  selectedLayerId: TextLayerId | null;
  setSelectedLayerId: (id: TextLayerId | null) => void;
  customLayoutAdjustments: CustomLayoutAdjustments;
  setCustomLayoutAdjustments: React.Dispatch<React.SetStateAction<CustomLayoutAdjustments>>;
}) {
  const templateAdjustments = customLayoutAdjustments[templateId] ?? {};

  const getAdjustment = useCallback(
    (layerId: TextLayerId) => {
      const adj = templateAdjustments[layerId];
      return isAdjustmentActive(adj) ? adj : undefined;
    },
    [templateAdjustments],
  );

  const updateAdjustment = useCallback(
    (layerId: TextLayerId, patch: Partial<TextLayerAdjustment>) => {
      setCustomLayoutAdjustments((prev) => {
        const currentTemplate = prev[templateId] ?? {};
        const merged = mergeLayerAdjustment(currentTemplate[layerId], patch);
        return {
          ...prev,
          [templateId]: {
            ...currentTemplate,
            [layerId]: merged,
          },
        };
      });
    },
    [setCustomLayoutAdjustments, templateId],
  );

  const resetLayer = useCallback(
    (layerId: TextLayerId) => {
      setCustomLayoutAdjustments((prev) => {
        const currentTemplate = { ...(prev[templateId] ?? {}) };
        delete currentTemplate[layerId];
        const next = { ...prev };
        if (Object.keys(currentTemplate).length === 0) {
          delete next[templateId];
        } else {
          next[templateId] = currentTemplate;
        }
        return next;
      });
      setSelectedLayerId(null);
    },
    [setCustomLayoutAdjustments, setSelectedLayerId, templateId],
  );

  const resetTemplate = useCallback(() => {
    setCustomLayoutAdjustments((prev) => {
      const next = { ...prev };
      delete next[templateId];
      return next;
    });
    setSelectedLayerId(null);
  }, [setCustomLayoutAdjustments, setSelectedLayerId, templateId]);

  const resetAll = useCallback(() => {
    setCustomLayoutAdjustments({});
    setSelectedLayerId(null);
  }, [setCustomLayoutAdjustments, setSelectedLayerId]);

  const value = useMemo(
    () => ({
      editMode,
      templateId,
      selectedLayerId,
      setSelectedLayerId,
      getAdjustment,
      updateAdjustment,
      resetLayer,
      resetTemplate,
      resetAll,
    }),
    [
      editMode,
      templateId,
      selectedLayerId,
      setSelectedLayerId,
      getAdjustment,
      updateAdjustment,
      resetLayer,
      resetTemplate,
      resetAll,
    ],
  );

  return (
    <InviteLayoutEditorContext.Provider value={value}>{children}</InviteLayoutEditorContext.Provider>
  );
}

export function useInviteLayoutEditor() {
  const ctx = useContext(InviteLayoutEditorContext);
  if (!ctx) {
    return {
      editMode: false,
      templateId: "kurumsal-davet" as InviteTemplateId,
      selectedLayerId: null as TextLayerId | null,
      setSelectedLayerId: (_id: TextLayerId | null) => {},
      getAdjustment: (_layerId: TextLayerId) => undefined as TextLayerAdjustment | undefined,
      updateAdjustment: (_layerId: TextLayerId, _patch: Partial<TextLayerAdjustment>) => {},
      resetLayer: (_layerId: TextLayerId) => {},
      resetTemplate: () => {},
      resetAll: () => {},
    };
  }
  return ctx;
}

export function getTemplateAdjustments(
  all: CustomLayoutAdjustments,
  templateId: InviteTemplateId,
): TemplateLayoutAdjustments {
  return all[templateId] ?? {};
}

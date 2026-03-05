import { useCallback, useEffect, useMemo, useState } from "react";
import {
  parseProgramConfig,
  buildDefaultBenefitsCategory,
  buildDefaultContinuousCategory,
} from "../utils/programConfigParser";
import { safeUpper } from "../utils/stringUtils";

export function useProgramFormState({ mode, initialEvent }) {
  const baseEvent = useMemo(() => {
    const e = initialEvent?.event || initialEvent || null;
    return e;
  }, [initialEvent]);

  const [state, setStateInternal] = useState(() => {
    if (mode === "edit" && baseEvent) {
      return parseProgramConfig(baseEvent);
    }
    return {
      kind: "BENEFITS",
      name: "",
      text: "",
      logoImageUrl: "",
      hasAttachment: false,
      attachmentUrl: "",
      maxParticipantsEnabled: false,
      maxParticipants: "",
      autoChoiceEnabled: false,
      autoChoiceName: "Minha escolha",
      autoChoiceValue: "",
      categories: [buildDefaultBenefitsCategory()],
    };
  });

  // ── Dirty tracking ───────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);

  // Wrapped setState that marks the form as dirty on every user change
  const setState = useCallback((updater) => {
    setStateInternal(updater);
    setIsDirty(true);
  }, []);

  // Call after a successful save or publish to clear the dirty flag
  const resetDirty = useCallback(() => setIsDirty(false), []);
  // ─────────────────────────────────────────────────────────────────

  // When baseEvent changes (e.g. after a refetch), reset state AND dirty flag
  useEffect(() => {
    if (mode === "edit" && baseEvent) {
      setStateInternal(parseProgramConfig(baseEvent));
      setIsDirty(false);
    }
  }, [baseEvent, mode]);

  // Whether the DB says there are unsaved-then-unpublished changes
  const baseHasPendingChanges = Boolean(
    baseEvent?.adminConfig?.hasPendingChanges,
  );

  const remaining = useMemo(() => {
    const used = String(state.text || "").length;
    return Math.max(0, 500 - used);
  }, [state.text]);

  const eventTypeName = useMemo(() => {
    if (mode === "edit") {
      const t = safeUpper(baseEvent?.eventTypeName);
      if (t === "CROWDFUNDING") {
        return "CROWDFUNDING";
      }
      return "STOCKS";
    }
    return state.kind === "CONTINUOUS" ? "CROWDFUNDING" : "STOCKS";
  }, [baseEvent?.eventTypeName, mode, state.kind]);

  const modalityLabel = useMemo(() => {
    if (state.kind === "CONTINUOUS") {
      return "Campanha contínua";
    }
    return "Programa com benefícios";
  }, [state.kind]);

  const helpText = useMemo(() => {
    if (state.kind === "CONTINUOUS") {
      return "Uma campanha contínua é uma arrecadação recorrente com categorias e metas.";
    }
    return "Um programa com benefícios oferece categorias de apoio e benefícios (ex: tickets para eventos).";
  }, [state.kind]);

  return {
    state,
    setState,
    baseEvent,
    remaining,
    eventTypeName,
    modalityLabel,
    helpText,
    isDirty,
    resetDirty,
    baseHasPendingChanges,
  };
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProgram,
  updateProgram,
  publishProgram,
} from "../services/programApi";
import { buildAdminConfigFromState } from "../utils/programConfigParser";

export function useProgramMutations({
  organizationId,
  mode,
  state,
  baseEvent,
  eventTypeName,
  resetDirty,
  onCreated,
  onSaved,
  onPublished,
  setError,
  setSuccess,
}) {
  const queryClient = useQueryClient();

  /* ── CREATE ─────────────────────────────────────────────────────── */
  const createMutation = useMutation({
    mutationFn: async () => {
      const adminConfig = buildAdminConfigFromState(
        state,
        baseEvent?.adminConfig,
        { hasPendingChanges: false },
      );

      const payload = {
        eventTypeName,
        name: state.name,
        shortDescription: state.text,
        longDescription: null,
        attendanceType: "NONE",
        logoImageUrl: state.logoImageUrl || null,
        coverImageUrl: null,
        adminConfig,
      };

      return createProgram({ organizationId, payload });
    },
    onSuccess: async (data) => {
      if (data?.conflict && data?.existingEventId) {
        setSuccess(null);
        setError(
          "Esta ONG já possui um programa cadastrado. Abrindo o programa existente…",
        );
        await queryClient.invalidateQueries({
          queryKey: ["admin", "org", organizationId, "programas"],
        });
        onCreated?.(data.existingEventId);
        return;
      }

      setSuccess("Programa criado.");
      setError(null);
      resetDirty?.();
      await queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "programas"],
      });
      if (data?.eventId) {
        onCreated?.(data.eventId);
      }
    },
    onError: (e) => {
      console.error(e);
      const msg = String(e?.message || "")?.includes("Missing EventType")
        ? "Seu banco ainda não tem o tipo Pacote de Benefícios / Investimento Direto cadastrado."
        : "Não foi possível criar o programa.";
      setError(msg);
      setSuccess(null);
    },
  });

  /* ── UPDATE (Save) ──────────────────────────────────────────────── */
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!baseEvent?.eventId) throw new Error("Missing eventId");

      // Mark hasPendingChanges: true so the publish button knows there's new content
      const adminConfig = buildAdminConfigFromState(
        state,
        baseEvent?.adminConfig,
        { hasPendingChanges: true },
      );

      const payload = {
        name: state.name,
        startDate: baseEvent.startDate,
        endDate: baseEvent.endDate,
        shortDescription: state.text,
        longDescription: baseEvent.longDescription || null,
        attendanceType: baseEvent.attendanceType || "NONE",
        attendanceUrl: baseEvent.attendanceURL || null,
        attendanceAddress: baseEvent.attendanceAddress || null,
        publishingDate: baseEvent.publishingDate || null,
        status: baseEvent.status || null,
        logoImageUrl: state.logoImageUrl || null,
        coverImageUrl: baseEvent.coverImageUrl || null,
        relatedProgramEventId: baseEvent.relatedProgramEventId || null,
        adminConfig,
      };

      return updateProgram({
        organizationId,
        eventId: baseEvent.eventId,
        payload,
      });
    },
    onSuccess: async () => {
      setSuccess("Alterações salvas.");
      setError(null);
      resetDirty?.();
      onSaved?.();
      await queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "programas"],
      });
      // Refetch this event so baseEvent reflects hasPendingChanges: true from DB
      await queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "event", baseEvent.eventId],
      });
    },
    onError: (e) => {
      console.error(e);
      setError("Não foi possível salvar o programa.");
      setSuccess(null);
    },
  });

  /* ── PUBLISH ────────────────────────────────────────────────────── */
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!baseEvent?.eventId) throw new Error("Missing eventId");

      // hasPendingChanges: false → publication clears the pending flag
      const adminConfig = buildAdminConfigFromState(
        state,
        baseEvent?.adminConfig,
        { hasPendingChanges: false },
      );

      const payload = {
        name: state.name,
        startDate: baseEvent.startDate,
        endDate: baseEvent.endDate,
        shortDescription: state.text,
        longDescription: baseEvent.longDescription || null,
        attendanceType: baseEvent.attendanceType || "NONE",
        attendanceUrl: baseEvent.attendanceURL || null,
        attendanceAddress: baseEvent.attendanceAddress || null,
        publishingDate: new Date().toISOString(),
        status: "PUBLISHED",
        logoImageUrl: state.logoImageUrl || null,
        coverImageUrl: baseEvent.coverImageUrl || null,
        relatedProgramEventId: baseEvent.relatedProgramEventId || null,
        adminConfig,
      };

      return publishProgram({
        organizationId,
        eventId: baseEvent.eventId,
        payload,
      });
    },
    onSuccess: async () => {
      setError(null);
      resetDirty?.();
      onPublished?.();
      await queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "programas"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "event", baseEvent.eventId],
      });
    },
    onError: (e) => {
      console.error(e);
      setError("Não foi possível publicar o programa. Tente novamente.");
      setSuccess(null);
    },
  });

  return {
    createMutation,
    updateMutation,
    publishMutation,
    saving: createMutation.isPending || updateMutation.isPending,
    publishing: publishMutation.isPending,
  };
}

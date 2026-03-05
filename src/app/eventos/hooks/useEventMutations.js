import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent, updateEvent, publishEvent } from "../services/eventApi";
import { buildEventPayload } from "../utils/eventPayloadBuilder";

function buildPublishSuccessMessage(result) {
  const base = "Evento publicado. Tickets foram gerados.";
  const alloc = result?.allocation || null;
  if (!alloc || alloc.enabled !== true) {
    return base;
  }

  const assigned = Number(alloc.ticketsAssigned || 0);
  const eligible = Number(alloc.investorsEligible || 0);
  const noUser = Number(alloc?.skipped?.noUser || 0);
  const expired = Number(alloc?.skipped?.expired || 0);

  return `${base} Envio automático: ${assigned} ticket(s) para ${eligible} investidor(es). (Sem conta iSOW: ${noUser}; fora do prazo: ${expired})`;
}

export function useEventMutations({
  organizationId,
  initialEvent,
  state,
  onCreated,
  onSaved,
  setSuccess,
  setError,
}) {
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = buildEventPayload(state);
      return createEvent(organizationId, payload);
    },
    onSuccess: (data) => {
      setSuccess("Evento criado (rascunho).");
      setError(null);
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "eventos"],
      });
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "events"],
      });
      if (onCreated) {
        onCreated(data?.eventId);
      }
    },
    onError: (err) => {
      console.error(err);
      setSuccess(null);
      setError("Não foi possível criar o evento.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const e = initialEvent?.event || initialEvent;
      const eventId = e?.eventId;
      if (!eventId) {
        throw new Error("Missing eventId");
      }
      const payload = buildEventPayload(state);
      return updateEvent(organizationId, eventId, payload);
    },
    onSuccess: () => {
      setSuccess("Alterações salvas.");
      setError(null);
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "eventos"],
      });
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "events"],
      });
      if (onSaved) {
        onSaved();
      }
    },
    onError: (err) => {
      console.error(err);
      setSuccess(null);
      setError("Não foi possível salvar.");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const e = initialEvent?.event || initialEvent;
      const eventId = e?.eventId;
      if (!eventId) {
        throw new Error("Missing eventId");
      }
      // Always save latest draft first
      await updateMutation.mutateAsync();
      return publishEvent(organizationId, eventId);
    },
    onSuccess: (result) => {
      setSuccess(buildPublishSuccessMessage(result));
      setError(null);
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "eventos"],
      });
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "events"],
      });
    },
    onError: (err) => {
      console.error(err);
      setSuccess(null);
      setError(
        err instanceof Error ? err.message : "Não foi possível publicar.",
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    publishMutation,
  };
}

import { useMemo, useState } from "react";
import ImageCropModal from "./ImageCropModal";
import { useEventForm } from "../hooks/useEventForm";
import { useEventMutations } from "../hooks/useEventMutations";
import { useTicketDays } from "../hooks/useTicketDays";
import { useTicketCategories } from "../hooks/useTicketCategories";
import { useFileUpload } from "../hooks/useFileUpload";
import { useProgramEvents } from "../hooks/useProgramEvents";
import { FormMessages } from "./FormMessages";
import { EventFormHeader } from "./EventFormHeader";
import { ProgramSection } from "./ProgramSection";
import { BasicInfoSection } from "./BasicInfoSection";
import { LocationSection } from "./LocationSection";
import { DateTimeSection } from "./DateTimeSection";
import { AdditionalInfoSection } from "./AdditionalInfoSection";
import { TicketsSection } from "./TicketsSection";
import { AgendaSection } from "./AgendaSection";

export default function EventForm({
  organizationId,
  mode,
  initialEvent,
  onCreated,
  onSaved,
}) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [state, setState] = useEventForm(initialEvent);

  const programs = useProgramEvents(organizationId);

  const selectedProgram = useMemo(() => {
    const id = state.relatedProgramEventId;
    if (!id) {
      return null;
    }
    return (programs || []).find((p) => p.eventId === id) || null;
  }, [programs, state.relatedProgramEventId]);

  const {
    uploading,
    cropOpen,
    cropFile,
    setCropOpen,
    onPickLogoFile,
    onCropConfirm,
    onPickAgendaFile,
  } = useFileUpload(setState, setError);

  const { createMutation, updateMutation, publishMutation } = useEventMutations(
    {
      organizationId,
      initialEvent,
      state,
      onCreated,
      onSaved,
      setSuccess,
      setError,
    },
  );

  const ticketDays = useTicketDays(state.startDate, state.endDate);

  const { onChangeCategory, onRemoveCategory } = useTicketCategories(setState);

  const saving = createMutation.isPending || updateMutation.isPending;
  const publishing = publishMutation.isPending;

  const canPublish = mode === "edit";

  const isProgramLinked = Boolean(state.relatedProgramEventId);

  const submitDisabled = saving || publishing || uploading;

  const handleSave = () => {
    setError(null);
    setSuccess(null);
    if (mode === "create") {
      createMutation.mutate();
    } else {
      updateMutation.mutate();
    }
  };

  const handlePublish = () => {
    setError(null);
    setSuccess(null);
    const ok = window.confirm(
      "Publicar agora? Isso vai gerar os tickets (e não reverte automaticamente).",
    );
    if (!ok) {
      return;
    }
    publishMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <FormMessages error={error} success={success} />

      <EventFormHeader
        mode={mode}
        canPublish={canPublish}
        submitDisabled={submitDisabled}
        saving={saving}
        publishing={publishing}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      <ProgramSection
        programs={programs}
        value={state.relatedProgramEventId}
        onChange={(value) =>
          setState((prev) => ({
            ...prev,
            relatedProgramEventId: value,
          }))
        }
      />

      <BasicInfoSection
        state={state}
        setState={setState}
        isProgramLinked={isProgramLinked}
        uploading={uploading}
        onPickLogoFile={onPickLogoFile}
      />

      <LocationSection state={state} setState={setState} />

      <DateTimeSection state={state} setState={setState} />

      <AdditionalInfoSection state={state} setState={setState} />

      <TicketsSection
        state={state}
        setState={setState}
        isProgramLinked={isProgramLinked}
        selectedProgram={selectedProgram}
        ticketDays={ticketDays}
        onChangeCategory={onChangeCategory}
        onRemoveCategory={onRemoveCategory}
      />

      <AgendaSection
        agendaFileUrl={state.agendaFileUrl}
        onPickAgendaFile={onPickAgendaFile}
      />

      <ImageCropModal
        open={cropOpen}
        file={cropFile}
        onClose={() => setCropOpen(false)}
        onConfirm={onCropConfirm}
        title="Ajustar logo do evento"
        outputSize={512}
      />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle } from "lucide-react";
import ImageCropModal from "../../eventos/components/ImageCropModal";
import { useProgramFormState } from "../hooks/useProgramFormState";
import { useProgramMutations } from "../hooks/useProgramMutations";
import { useProgramUploads } from "../hooks/useProgramUploads";
import { useCategoryActions } from "../hooks/useCategoryActions";
import { FormMessages } from "./FormMessages";
import { ProgramFormHeader } from "./ProgramFormHeader";
import { ModalitySelector } from "./ModalitySelector";
import { BasicInfoSection } from "./BasicInfoSection";
import { AttachmentSection } from "./AttachmentSection";
import { CategoriesSection } from "./CategoriesSection";

/* ─── Toast ────────────────────────────────────────────────────────── */

function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colors =
    type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-inter max-w-sm ${colors}`}
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
}

/* ─── Confirm Publish Modal ─────────────────────────────────────────── */

function ConfirmPublishModal({
  programName,
  isRepublish,
  isPending,
  onCancel,
  onConfirm,
}) {
  const overlayRef = useRef(null);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current && !isPending) onCancel();
    },
    [onCancel, isPending],
  );

  const title = isRepublish ? "Republicar programa" : "Publicar programa";
  const body = isRepublish
    ? `Deseja republicar o programa "${programName}" com as alterações realizadas?`
    : `Deseja publicar o programa "${programName}"? Após publicação, o programa ficará visível e alterações futuras precisarão ser republicadas.`;
  const confirmLabel = isRepublish
    ? "Confirmar republicação"
    : "Confirmar publicação";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mx-auto">
          <CheckCircle size={22} className="text-green-600" />
        </div>

        <div className="text-center">
          <div className="text-base font-semibold font-inter text-[#111827]">
            {title}
          </div>
          <div className="text-sm font-inter text-[#6B7280] mt-2 leading-relaxed">
            {body}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 h-10 rounded-lg border border-[#E5E7EB] text-[#374151] text-sm font-inter font-medium hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 h-10 rounded-lg bg-[#16A34A] text-white text-sm font-inter font-medium hover:bg-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={14} />
            {isPending ? "Publicando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Form ──────────────────────────────────────────────────────── */

export default function ProgramForm({
  organizationId,
  mode, // "create" | "edit"
  initialEvent,
  onCreated,
  onSaved,
}) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const dismissToast = useCallback(() => setToast(null), []);

  const {
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
  } = useProgramFormState({ mode, initialEvent });

  const {
    uploading,
    cropOpen,
    cropFile,
    setCropOpen,
    onPickLogoFile,
    onCropConfirm,
    onPickAttachment,
  } = useProgramUploads({ setState, setError });

  const {
    addCategory,
    removeCategory,
    setCategoryField,
    addBenefitRow,
    setBenefitField,
    removeBenefitRow,
  } = useCategoryActions({ setState });

  /* ── Publish logic ─────────────────────────────────────────────── */
  const currentStatus = String(baseEvent?.status || "").toUpperCase();
  const isDraft = currentStatus === "DRAFT" || currentStatus === "";
  const isPublishedStatus =
    currentStatus === "PUBLISHED" || currentStatus === "STARTED";
  // Effective pending changes = local unsaved edits OR flag from DB
  const hasPendingChanges = isDirty || baseHasPendingChanges;
  // Can publish: always if draft; if published, only when changes exist
  const canPublish = isDraft || (isPublishedStatus && hasPendingChanges);
  // Republish = already published AND has changes
  const isRepublish = isPublishedStatus && hasPendingChanges;

  const handlePublished = useCallback(() => {
    const msg = isRepublish
      ? "Programa republicado com sucesso!"
      : "Programa publicado com sucesso!";
    setToast({ message: msg, type: "success" });
  }, [isRepublish]);

  const {
    createMutation,
    updateMutation,
    publishMutation,
    saving,
    publishing,
  } = useProgramMutations({
    organizationId,
    mode,
    state,
    baseEvent,
    eventTypeName,
    resetDirty,
    onCreated,
    onSaved,
    onPublished: handlePublished,
    setError,
    setSuccess,
  });

  const handleSave = useCallback(() => {
    setError(null);
    setSuccess(null);
    if (!state.name?.trim()) {
      setError("Preencha o nome do programa.");
      return;
    }
    if (String(state.text || "").length > 500) {
      setError("O texto deve ter no máximo 500 caracteres.");
      return;
    }
    if (mode === "create") {
      createMutation.mutate();
    } else {
      updateMutation.mutate();
    }
  }, [createMutation, mode, state.name, state.text, updateMutation]);

  const handlePublishClick = useCallback(() => {
    if (!canPublish) return;
    setError(null);
    setSuccess(null);
    setShowPublishModal(true);
  }, [canPublish]);

  const handlePublishConfirm = useCallback(() => {
    setShowPublishModal(false);
    publishMutation.mutate();
  }, [publishMutation]);

  const handlePublishCancel = useCallback(() => {
    if (!publishing) setShowPublishModal(false);
  }, [publishing]);

  const showKindControls = mode === "create";

  return (
    <>
      <div className="space-y-6">
        <FormMessages error={error} success={success} />

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <ProgramFormHeader
            mode={mode}
            modalityLabel={modalityLabel}
            eventTypeName={eventTypeName}
            saving={saving}
            uploading={uploading}
            publishing={publishing}
            canPublish={canPublish}
            onSave={handleSave}
            onPublish={handlePublishClick}
          />

          {showKindControls ? (
            <ModalitySelector
              state={state}
              setState={setState}
              helpText={helpText}
            />
          ) : null}

          <BasicInfoSection
            state={state}
            setState={setState}
            remaining={remaining}
            onPickLogoFile={onPickLogoFile}
          />

          <AttachmentSection
            state={state}
            setState={setState}
            onPickAttachment={onPickAttachment}
          />

          <CategoriesSection
            state={state}
            setState={setState}
            onAddCategory={addCategory}
            onRemoveCategory={removeCategory}
            onCategoryFieldChange={setCategoryField}
            onAddBenefit={addBenefitRow}
            onBenefitChange={setBenefitField}
            onRemoveBenefit={removeBenefitRow}
          />
        </div>

        <ImageCropModal
          open={cropOpen}
          file={cropFile}
          onClose={() => setCropOpen(false)}
          onConfirm={onCropConfirm}
          title="Ajustar logo do programa"
          outputSize={512}
        />
      </div>

      {/* Confirm publish modal */}
      {showPublishModal ? (
        <ConfirmPublishModal
          programName={baseEvent?.name || state.name || "Programa"}
          isRepublish={isRepublish}
          isPending={publishing}
          onCancel={handlePublishCancel}
          onConfirm={handlePublishConfirm}
        />
      ) : null}

      {/* Toast notification */}
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      ) : null}
    </>
  );
}

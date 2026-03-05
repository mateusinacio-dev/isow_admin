export function EventFormHeader({
  mode,
  canPublish,
  submitDisabled,
  saving,
  publishing,
  onSave,
  onPublish,
}) {
  const headerTitle =
    mode === "create" ? "Cadastrar novo evento" : "Editar evento";
  const actionLabel = mode === "create" ? "Criar rascunho" : "Salvar";

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="text-xl font-bold font-inter text-[#111827]">
        {headerTitle}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={submitDisabled}
          onClick={onSave}
          className="inline-flex items-center h-10 px-5 rounded-full bg-gradient-to-b from-[#252525] to-[#0F0F0F] text-white text-sm font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Salvando…" : actionLabel}
        </button>

        {canPublish ? (
          <button
            type="button"
            disabled={submitDisabled}
            onClick={onPublish}
            className="inline-flex items-center h-10 px-5 rounded-full border border-[#111827] text-[#111827] text-sm font-semibold hover:bg-[#F9FAFB] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {publishing ? "Publicando…" : "Publicar"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ProgramFormHeader({
  mode,
  modalityLabel,
  eventTypeName,
  saving,
  uploading,
  publishing,
  canPublish,
  onSave,
  onPublish,
}) {
  const busy = saving || uploading || publishing;

  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div>
        <div className="text-lg font-semibold font-inter text-[#111827]">
          {mode === "create" ? "Cadastrar novo Programa" : "Editar Programa"}
        </div>
        <div className="text-xs text-[#6B7280] font-inter mt-1">
          Modalidade: {modalityLabel}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* ── Salvar ── */}
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="h-10 px-5 rounded-full bg-gradient-to-b from-[#252525] to-[#0F0F0F] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>

        {/* ── Publicar (só em modo edición) ── */}
        {mode === "edit" ? (
          canPublish ? (
            <button
              type="button"
              onClick={onPublish}
              disabled={busy}
              className="h-10 px-5 rounded-full bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {publishing ? "Publicando…" : "Publicar"}
            </button>
          ) : (
            /* Disabled with tooltip */
            <div className="relative group">
              <button
                type="button"
                disabled
                className="h-10 px-5 rounded-full bg-[#9CA3AF] text-white text-sm font-semibold cursor-not-allowed"
              >
                Publicar
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-[#111827] text-white text-xs font-inter rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  Programa já publicado. Faça alterações para republicar.
                </div>
                <div className="w-2 h-2 bg-[#111827] rotate-45 mx-auto -mt-1" />
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

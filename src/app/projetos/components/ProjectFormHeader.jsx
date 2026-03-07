export default function ProjectFormHeader({
  mode,
  submitting,
  canStartExecution,
  canPublish,
  onSave,
  onDelete,
  onPublish,
  onStartExecution,
  startExecutionPending,
  deletePending,
  publishing,
}) {
  const busy = submitting || publishing;

  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div>
        <div className="text-lg font-semibold font-inter text-[#111827]">
          {mode === "create" ? "Cadastrar projeto" : "Editar projeto"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {mode === "edit" ? (
          <button
            type="button"
            onClick={onStartExecution}
            disabled={busy || startExecutionPending || !canStartExecution}
            className="h-10 px-4 rounded-full bg-[#0F766E] text-white text-sm font-inter disabled:opacity-60"
            title={
              canStartExecution
                ? "Iniciar execução"
                : "Defina mínimo viável e valor captado para liberar"
            }
          >
            {startExecutionPending ? "Iniciando…" : "Iniciar execução"}
          </button>
        ) : null}

        {/* ── Salvar ── */}
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="h-10 px-5 rounded-full bg-gradient-to-b from-[#252525] to-[#0F0F0F] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Salvando…" : "Salvar"}
        </button>

        {/* ── Publicar (só em modo edit) ── */}
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
            /* Disabled com tooltip */
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
                  Projeto já publicado. Faça alterações para republicar.
                </div>
                <div className="w-2 h-2 bg-[#111827] rotate-45 mx-auto -mt-1" />
              </div>
            </div>
          )
        ) : null}

        {mode === "edit" ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy || deletePending}
            className="h-10 px-4 rounded-full border border-red-200 text-red-700 text-sm font-inter disabled:opacity-60"
          >
            {deletePending ? "Excluindo…" : "Excluir"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

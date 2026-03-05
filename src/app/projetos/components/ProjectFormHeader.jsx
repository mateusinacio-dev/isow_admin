export default function ProjectFormHeader({
  mode,
  submitting,
  canStartExecution,
  onSave,
  onDelete,
  onStartExecution,
  startExecutionPending,
  deletePending,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <div className="text-lg font-semibold font-inter text-[#111827]">
          {mode === "create" ? "Cadastrar projeto" : "Editar projeto"}
        </div>
        <div className="text-xs text-[#6B7280] font-inter mt-1">
          Você pode editar depois a qualquer momento.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mode === "edit" ? (
          <button
            type="button"
            onClick={onStartExecution}
            disabled={startExecutionPending || !canStartExecution}
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

        <button
          type="button"
          onClick={onSave}
          disabled={submitting}
          className="h-10 px-5 rounded-full bg-gradient-to-b from-[#252525] to-[#0F0F0F] text-white text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? "Salvando…" : "Salvar"}
        </button>

        {mode === "edit" ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={deletePending}
            className="h-10 px-4 rounded-full border border-red-200 text-red-700 text-sm font-inter disabled:opacity-60"
          >
            {deletePending ? "Excluindo…" : "Excluir"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

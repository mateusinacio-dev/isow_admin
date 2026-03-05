export function ProfileFormActions({
  canSave,
  saveDisabledReason,
  isPending,
  onReload,
  onSave,
}) {
  const showReason = Boolean(saveDisabledReason) && !canSave;

  const saveDisabled = isPending;
  const saveClassBase =
    "h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 disabled:opacity-60";
  const saveClass = canSave ? saveClassBase : `${saveClassBase} opacity-60`;

  return (
    <div className="md:col-span-2 mt-2">
      <div className="flex items-center justify-end gap-2">
        <button
          className="h-10 px-4 rounded-lg border border-[#E6E6E6] text-sm font-inter hover:bg-[#F9FAFB]"
          onClick={onReload}
          disabled={isPending}
        >
          Recarregar
        </button>
        <button className={saveClass} disabled={saveDisabled} onClick={onSave}>
          {isPending ? "Salvando…" : "Salvar cadastro"}
        </button>
      </div>

      {showReason ? (
        <div className="text-[11px] text-[#6B7280] font-inter mt-2 text-right">
          {saveDisabledReason}
        </div>
      ) : null}
    </div>
  );
}

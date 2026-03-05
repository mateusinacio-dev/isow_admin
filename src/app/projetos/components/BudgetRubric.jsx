export default function BudgetRubric({
  title,
  items,
  onAdd,
  onChange,
  onRemove,
  columns,
  kind,
  suppliers,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  return (
    <div className="rounded-xl border border-[#E6E6E6] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold font-inter text-[#111827]">
          {title}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-inter underline"
        >
          +
        </button>
      </div>

      {safeItems.length === 0 ? (
        <div className="mt-3 text-xs text-[#6B7280] font-inter">
          Nenhum item.
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        {safeItems.map((it, idx) => {
          const isPersonnel = kind === "personnel";
          const selectedSupplierId = it.supplierId || "";

          return (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center"
            >
              {isPersonnel ? (
                <input
                  value={it.role || ""}
                  onChange={(e) => onChange(idx, "role", e.target.value)}
                  placeholder="Função"
                  className="h-10 md:col-span-2 px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                />
              ) : (
                <input
                  value={it.description || ""}
                  onChange={(e) => onChange(idx, "description", e.target.value)}
                  placeholder="Descrição"
                  className="h-10 md:col-span-2 px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                />
              )}

              <select
                value={selectedSupplierId}
                onChange={(e) =>
                  onChange(idx, "supplierId", e.target.value || null)
                }
                className="h-10 md:col-span-2 px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
              >
                <option value="">Fornecedor (opcional)</option>
                {safeSuppliers.map((s) => {
                  const name = s.tradeName || s.legalName || "(sem nome)";
                  const doc =
                    `${s.documentType || ""} ${s.documentNumber || ""}`.trim();
                  const label = doc ? `${name} • ${doc}` : name;
                  return (
                    <option key={s.supplierId} value={s.supplierId}>
                      {label}
                    </option>
                  );
                })}
              </select>

              <input
                value={it.quantity ?? 0}
                onChange={(e) =>
                  onChange(idx, "quantity", Number(e.target.value || 0))
                }
                type="number"
                min={0}
                step={1}
                className="h-10 px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                placeholder="Qtd"
              />

              {isPersonnel ? (
                <select
                  value={it.unit || "Mês"}
                  onChange={(e) => onChange(idx, "unit", e.target.value)}
                  className="h-10 px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                >
                  <option value="Hora">Hora</option>
                  <option value="Mês">Mês</option>
                </select>
              ) : (
                <div className="hidden md:block" />
              )}

              <input
                value={it.unitValue ?? 0}
                onChange={(e) =>
                  onChange(idx, "unitValue", Number(e.target.value || 0))
                }
                type="number"
                min={0}
                step={0.01}
                className="h-10 px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                placeholder="Valor Unit."
              />

              <div className="flex items-center gap-2">
                <div className="text-sm font-inter text-[#111827]">
                  R$ {Number(it.totalValue || 0).toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="text-xs text-red-600 font-inter hover:underline"
                >
                  Remover
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {columns ? <div className="sr-only">{columns.join(", ")}</div> : null}

      {safeSuppliers.length === 0 ? (
        <div className="mt-3 text-[11px] text-[#6B7280] font-inter">
          Você ainda não tem fornecedores vinculados. Cadastre em
          "Fornecedores".
        </div>
      ) : null}
    </div>
  );
}

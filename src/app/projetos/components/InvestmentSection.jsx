import SectionTitle from "./SectionTitle";
import SmallInput from "./SmallInput";

export default function InvestmentSection({ investment, setState }) {
  return (
    <div className="mt-10 rounded-xl border border-[#E6E6E6] p-4">
      <SectionTitle title="Formas de investimento" />
      <div className="text-xs text-[#6B7280] font-inter mb-4">
        Defina cotas e permita "Defina o seu investimento".
      </div>

      <div className="space-y-3">
        {(investment.quotas || []).map((q, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SmallInput
              value={q.name}
              onChange={(v) =>
                setState((p) => {
                  const quotas = Array.isArray(p.investment.quotas)
                    ? [...p.investment.quotas]
                    : [];
                  const row = { ...(quotas[idx] || {}) };
                  row.name = v;
                  quotas[idx] = row;
                  return {
                    ...p,
                    investment: { ...p.investment, quotas },
                  };
                })
              }
              placeholder="Nome da cota"
            />
            <SmallInput
              value={q.value}
              onChange={(v) =>
                setState((p) => {
                  const quotas = Array.isArray(p.investment.quotas)
                    ? [...p.investment.quotas]
                    : [];
                  const row = { ...(quotas[idx] || {}) };
                  row.value = v;
                  quotas[idx] = row;
                  return {
                    ...p,
                    investment: { ...p.investment, quotas },
                  };
                })
              }
              placeholder="Valor da cota (R$)"
              type="number"
              min={0}
              step={0.01}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setState((p) => {
                    const quotas = Array.isArray(p.investment.quotas)
                      ? [...p.investment.quotas]
                      : [];
                    quotas.splice(idx, 1);
                    if (quotas.length === 0) {
                      quotas.push({ name: "", value: "" });
                    }
                    return {
                      ...p,
                      investment: { ...p.investment, quotas },
                    };
                  })
                }
                className="text-xs font-inter text-red-600 hover:underline"
              >
                Remover
              </button>

              <button
                type="button"
                onClick={() =>
                  setState((p) => ({
                    ...p,
                    investment: {
                      ...p.investment,
                      quotas: [
                        ...(p.investment.quotas || []),
                        { name: "", value: "" },
                      ],
                    },
                  }))
                }
                className="text-xs font-inter underline"
              >
                + Nova cota
              </button>
            </div>
          </div>
        ))}

        <label className="flex items-center gap-2 text-sm font-inter text-[#111827]">
          <input
            type="checkbox"
            checked={Boolean(investment.allowCustom)}
            onChange={(e) =>
              setState((p) => ({
                ...p,
                investment: { ...p.investment, allowCustom: e.target.checked },
              }))
            }
          />
          Permitir "Defina o seu investimento"
        </label>
      </div>
    </div>
  );
}

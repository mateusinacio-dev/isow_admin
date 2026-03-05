import { useEffect, useMemo } from "react";
import { Card } from "./FormCard";
import { Field } from "./FormField";
import { TextInput, RadioPill } from "./FormInputs";
import { TicketCategoriesTable } from "./TicketCategoriesTable";

function normalizeName(name) {
  return String(name || "").trim();
}

export function TicketsSection({
  state,
  setState,
  isProgramLinked,
  selectedProgram,
  ticketDays,
  onChangeCategory,
  onRemoveCategory,
}) {
  const programCategories = useMemo(() => {
    const cats = selectedProgram?.adminConfig?.program?.categories;
    return Array.isArray(cats) ? cats : [];
  }, [selectedProgram?.adminConfig?.program?.categories]);

  // Keep allocation rows in sync with program categories (only adds missing rows)
  useEffect(() => {
    if (!isProgramLinked) {
      return;
    }
    if (!programCategories.length) {
      return;
    }

    setState((prev) => {
      const current = Array.isArray(prev.programAllocationRows)
        ? prev.programAllocationRows
        : [];

      const map = new Map();
      for (const r of current) {
        const key = normalizeName(r?.categoryName);
        if (key) {
          map.set(key, {
            categoryName: key,
            ticketsPerInvestor:
              r?.ticketsPerInvestor != null ? String(r.ticketsPerInvestor) : "",
          });
        }
      }

      let changed = false;

      for (const c of programCategories) {
        const key = normalizeName(c?.name);
        if (!key) {
          continue;
        }
        if (!map.has(key)) {
          map.set(key, { categoryName: key, ticketsPerInvestor: "" });
          changed = true;
        }
      }

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        programAllocationEnabled: prev.programAllocationEnabled !== false,
        programAllocationRows: Array.from(map.values()),
      };
    });
  }, [isProgramLinked, programCategories, setState]);

  const allocationRows = Array.isArray(state.programAllocationRows)
    ? state.programAllocationRows
    : [];

  return (
    <Card title="Tickets">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="O evento é gratuito?">
          <div className="flex items-center gap-2 flex-wrap">
            <RadioPill
              checked={state.isFree}
              label="Sim"
              onClick={() => setState((p) => ({ ...p, isFree: true }))}
            />
            <RadioPill
              checked={!state.isFree}
              label="Não"
              disabled={isProgramLinked}
              onClick={() => setState((p) => ({ ...p, isFree: false }))}
            />
          </div>
        </Field>

        <Field label="Limite de tickets por pessoa (opcional)">
          <TextInput
            inputMode="numeric"
            value={state.limitPerPerson}
            onChange={(e) =>
              setState((p) => ({
                ...p,
                limitPerPerson: e.target.value.replace(/\D/g, ""),
              }))
            }
            placeholder="Ex: 2"
          />
        </Field>
      </div>

      {state.isFree ? (
        <div className="mt-4">
          <Field label="Quantidade de tickets disponível">
            <TextInput
              inputMode="numeric"
              value={state.ticketsTotal}
              onChange={(e) =>
                setState((p) => ({
                  ...p,
                  ticketsTotal: e.target.value.replace(/\D/g, ""),
                }))
              }
              placeholder="Ex: 200"
            />
          </Field>

          {isProgramLinked ? (
            <div className="mt-6 border-t border-[#F3F4F6] pt-5">
              <div className="text-sm font-semibold font-inter text-[#111827]">
                Envio automático de tickets (Programa)
              </div>
              <div className="text-xs text-[#6B7280] font-inter mt-1">
                Ao publicar o evento, a iSOW pode pré-alocar tickets para os
                investidores do Programa, de acordo com a categoria. Apenas
                investidores “em dia” recebem tickets.
              </div>

              <div className="mt-3">
                <label className="inline-flex items-center gap-2 text-sm font-inter text-[#111827]">
                  <input
                    type="checkbox"
                    checked={state.programAllocationEnabled !== false}
                    onChange={(e) =>
                      setState((p) => ({
                        ...p,
                        programAllocationEnabled: e.target.checked,
                      }))
                    }
                  />
                  Ativar envio automático no publicar
                </label>
              </div>

              {state.programAllocationEnabled !== false ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-[640px] w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="text-left">
                        <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                          Categoria do Programa
                        </th>
                        <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                          Tickets por investidor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocationRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="py-4 text-sm font-inter text-[#6B7280]"
                          >
                            Selecione um Programa acima para carregar as
                            categorias.
                          </td>
                        </tr>
                      ) : null}

                      {allocationRows.map((r, idx) => {
                        return (
                          <tr
                            key={`${r.categoryName}-${idx}`}
                            className="border-t border-[#F3F4F6]"
                          >
                            <td className="py-3 text-sm font-inter text-[#111827]">
                              {r.categoryName || "–"}
                            </td>
                            <td className="py-3">
                              <input
                                value={r.ticketsPerInvestor}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, "");
                                  setState((p) => {
                                    const next = Array.isArray(
                                      p.programAllocationRows,
                                    )
                                      ? [...p.programAllocationRows]
                                      : [];
                                    next[idx] = {
                                      ...next[idx],
                                      ticketsPerInvestor: v,
                                    };
                                    return {
                                      ...p,
                                      programAllocationRows: next,
                                    };
                                  });
                                }}
                                inputMode="numeric"
                                className="h-10 w-[180px] px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm font-inter"
                                placeholder="Ex: 2"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <div className="mt-3 text-xs text-[#6B7280] font-inter">
                Regra atual: recorrentes precisam ter pagamento confirmado nos
                últimos 60 dias; únicos (anuais) precisam estar dentro de 1 ano
                do último pagamento.
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <Field label="Vai ter venda promocional?">
            <div className="flex items-center gap-2 flex-wrap">
              <RadioPill
                checked={!state.promoEnabled}
                label="Não"
                onClick={() => setState((p) => ({ ...p, promoEnabled: false }))}
              />
              <RadioPill
                checked={state.promoEnabled}
                label="Sim"
                onClick={() => setState((p) => ({ ...p, promoEnabled: true }))}
              />
            </div>
          </Field>

          {state.promoEnabled ? (
            <Field label="Data final da venda antecipada">
              <TextInput
                type="date"
                value={state.promoEndDate}
                onChange={(e) =>
                  setState((p) => ({ ...p, promoEndDate: e.target.value }))
                }
              />
            </Field>
          ) : null}

          <TicketCategoriesTable
            categories={state.ticketCategories}
            ticketDays={ticketDays}
            onChangeCategory={onChangeCategory}
            onRemoveCategory={onRemoveCategory}
          />

          <div className="text-xs text-[#6B7280] font-inter">
            Observação: por enquanto o preço "promocional" fica guardado no
            evento (adminConfig). A venda com preço variável entra na próxima
            etapa.
          </div>
        </div>
      )}
    </Card>
  );
}

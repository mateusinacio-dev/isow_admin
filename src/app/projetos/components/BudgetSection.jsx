import SectionTitle from "./SectionTitle";
import SmallInput from "./SmallInput";
import BudgetRubric from "./BudgetRubric";

export default function BudgetSection({
  budget,
  budgetTotals,
  minimumViableValue,
  capturedValue,
  setState,
  addBudgetItem,
  setBudgetItemField,
  removeBudgetItem,
  suppliers,
}) {
  return (
    <div className="mt-10">
      <SectionTitle title="Orçamento" subtitle="Itens por rubrica" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <BudgetRubric
            title="Pessoal"
            rubricKey="personnel"
            items={budget.personnel}
            suppliers={suppliers}
            onAdd={() =>
              addBudgetItem("personnel", {
                role: "",
                quantity: 0,
                unit: "Mês",
                unitValue: 0,
                totalValue: 0,
                supplierId: null,
              })
            }
            onChange={(idx, field, value) =>
              setBudgetItemField("personnel", idx, field, value)
            }
            onRemove={(idx) => removeBudgetItem("personnel", idx)}
            columns={["Função", "Qtd", "Unidade", "Valor Unit.", "Total"]}
            kind="personnel"
          />

          <BudgetRubric
            title="Material permanente"
            rubricKey="permanentMaterial"
            items={budget.permanentMaterial}
            suppliers={suppliers}
            onAdd={() =>
              addBudgetItem("permanentMaterial", {
                description: "",
                quantity: 0,
                unitValue: 0,
                totalValue: 0,
                supplierId: null,
              })
            }
            onChange={(idx, field, value) =>
              setBudgetItemField("permanentMaterial", idx, field, value)
            }
            onRemove={(idx) => removeBudgetItem("permanentMaterial", idx)}
            columns={["Descrição", "Qtd", "Valor Unit.", "Total"]}
            kind="simple"
          />

          <BudgetRubric
            title="Material de consumo"
            rubricKey="consumables"
            items={budget.consumables}
            suppliers={suppliers}
            onAdd={() =>
              addBudgetItem("consumables", {
                description: "",
                quantity: 0,
                unitValue: 0,
                totalValue: 0,
                supplierId: null,
              })
            }
            onChange={(idx, field, value) =>
              setBudgetItemField("consumables", idx, field, value)
            }
            onRemove={(idx) => removeBudgetItem("consumables", idx)}
            columns={["Descrição", "Qtd", "Valor Unit.", "Total"]}
            kind="simple"
          />
        </div>

        <div className="space-y-6">
          <BudgetRubric
            title="Viagens"
            rubricKey="travel"
            items={budget.travel}
            suppliers={suppliers}
            onAdd={() =>
              addBudgetItem("travel", {
                description: "",
                quantity: 0,
                unitValue: 0,
                totalValue: 0,
                supplierId: null,
              })
            }
            onChange={(idx, field, value) =>
              setBudgetItemField("travel", idx, field, value)
            }
            onRemove={(idx) => removeBudgetItem("travel", idx)}
            columns={["Descrição", "Qtd", "Valor Unit.", "Total"]}
            kind="simple"
          />

          <BudgetRubric
            title="Diárias"
            rubricKey="perDiem"
            items={budget.perDiem}
            suppliers={suppliers}
            onAdd={() =>
              addBudgetItem("perDiem", {
                description: "",
                quantity: 0,
                unitValue: 0,
                totalValue: 0,
                supplierId: null,
              })
            }
            onChange={(idx, field, value) =>
              setBudgetItemField("perDiem", idx, field, value)
            }
            onRemove={(idx) => removeBudgetItem("perDiem", idx)}
            columns={["Descrição", "Qtd", "Valor Unit.", "Total"]}
            kind="simple"
          />

          <BudgetRubric
            title="Incluir item livre"
            rubricKey="freeItems"
            items={budget.freeItems}
            suppliers={suppliers}
            onAdd={() =>
              addBudgetItem("freeItems", {
                description: "",
                quantity: 0,
                unitValue: 0,
                totalValue: 0,
                supplierId: null,
              })
            }
            onChange={(idx, field, value) =>
              setBudgetItemField("freeItems", idx, field, value)
            }
            onRemove={(idx) => removeBudgetItem("freeItems", idx)}
            columns={["Descrição", "Qtd", "Valor Unit.", "Total"]}
            kind="simple"
          />

          <div className="rounded-xl border border-[#E6E6E6] p-4">
            <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
              Taxa de administração
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={budget.adminFee.mode || "PERCENT"}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    budget: {
                      ...p.budget,
                      adminFee: {
                        ...(p.budget.adminFee || {}),
                        mode: e.target.value,
                      },
                    },
                  }))
                }
                className="h-10 w-full px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
              >
                <option value="PERCENT">Percentual</option>
                <option value="VALUE">Valor</option>
              </select>

              <SmallInput
                value={budget.adminFee.percent}
                onChange={(v) =>
                  setState((p) => ({
                    ...p,
                    budget: {
                      ...p.budget,
                      adminFee: {
                        ...(p.budget.adminFee || {}),
                        percent: v,
                      },
                    },
                  }))
                }
                placeholder="%"
                type="number"
                min={0}
                max={100}
                step={0.1}
              />

              <SmallInput
                value={budget.adminFee.value}
                onChange={(v) =>
                  setState((p) => ({
                    ...p,
                    budget: {
                      ...p.budget,
                      adminFee: {
                        ...(p.budget.adminFee || {}),
                        value: v,
                      },
                    },
                  }))
                }
                placeholder="Valor (R$)"
                type="number"
                min={0}
                step={0.01}
              />
            </div>
            <div className="text-xs text-[#6B7280] font-inter mt-2">
              Se for percentual, usamos a fórmula: PER*(SOMA/(1-PER)).
            </div>
          </div>

          <div className="rounded-xl border border-[#E6E6E6] p-4">
            <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
              Impostos
            </div>
            <SmallInput
              value={budget.taxesPercent}
              onChange={(v) =>
                setState((p) => ({
                  ...p,
                  budget: { ...p.budget, taxesPercent: v },
                }))
              }
              placeholder="Percentual de impostos (%)"
              type="number"
              min={0}
              max={100}
              step={0.1}
            />
            <div className="text-xs text-[#6B7280] font-inter mt-2">
              Fórmula: IMP*(SOMAF/(1-IMP)).
            </div>
          </div>

          <div className="rounded-xl border border-[#E6E6E6] p-4">
            <div className="text-sm font-semibold font-inter text-[#111827]">
              Totais
            </div>
            <div className="mt-2 text-sm font-inter text-[#111827]">
              Soma itens: R$ {budgetTotals.sumRubrics.toFixed(2)}
            </div>
            <div className="text-sm font-inter text-[#111827]">
              Taxa administração: R$ {budgetTotals.adminFeeValue.toFixed(2)}
            </div>
            <div className="text-sm font-inter text-[#111827]">
              Impostos: R$ {budgetTotals.taxesValue.toFixed(2)}
            </div>
            <div className="mt-2 text-base font-semibold font-inter text-[#111827]">
              Valor total do projeto: R$ {budgetTotals.totalProject.toFixed(2)}
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
                Mínimo valor viável (opcional)
              </div>
              <SmallInput
                value={budget.minimumViable}
                onChange={(v) =>
                  setState((p) => ({
                    ...p,
                    budget: { ...p.budget, minimumViable: v },
                  }))
                }
                placeholder="R$"
                type="number"
                min={0}
                step={0.01}
              />
              {minimumViableValue > budgetTotals.totalProject ? (
                <div className="text-xs text-red-600 font-inter mt-2">
                  O mínimo viável não pode ser maior que o valor total.
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
                Valor captado (para liberar execução)
              </div>
              <SmallInput
                value={capturedValue}
                onChange={(v) =>
                  setState((p) => ({
                    ...p,
                    capturedValue: v,
                  }))
                }
                placeholder="R$"
                type="number"
                min={0}
                step={0.01}
              />
              <div className="text-xs text-[#6B7280] font-inter mt-2">
                Quando captado ≥ mínimo viável, habilita "Iniciar execução".
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

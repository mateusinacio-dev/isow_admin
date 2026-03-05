import SectionTitle from "./SectionTitle";
import SmallInput from "./SmallInput";

export default function GoalsSection({
  goals,
  setGoalField,
  addGoal,
  removeGoal,
  setStageField,
  addStage,
  removeStage,
  setProductField,
  addProduct,
  removeProduct,
}) {
  return (
    <div className="mt-10">
      <SectionTitle
        title="Metas e etapas"
        subtitle="Após preencher, você pode adicionar quantas metas e etapas quiser."
      />

      <div className="space-y-6">
        {(goals || []).map((g, goalIdx) => {
          const goalLabel = `Meta ${goalIdx + 1}`;
          return (
            <div
              key={goalIdx}
              className="rounded-xl border border-[#E6E6E6] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold font-inter text-[#111827]">
                  {goalLabel}
                </div>
                <button
                  type="button"
                  onClick={() => removeGoal(goalIdx)}
                  className="text-xs font-inter text-red-600 hover:underline"
                >
                  Remover meta
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <SmallInput
                  value={g.title}
                  onChange={(v) => setGoalField(goalIdx, "title", v)}
                  placeholder="Título da meta (máx 150)"
                />
                <SmallInput
                  value={g.indicatorTarget}
                  onChange={(v) => setGoalField(goalIdx, "indicatorTarget", v)}
                  placeholder="Indicador (número)"
                  type="number"
                  min={0}
                  step={1}
                />
              </div>

              <div className="mt-3">
                <textarea
                  value={g.description}
                  onChange={(e) =>
                    setGoalField(goalIdx, "description", e.target.value)
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                  placeholder="Descrição (máx 500)"
                />
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <SmallInput
                  value={g.monthStart}
                  onChange={(v) => setGoalField(goalIdx, "monthStart", v)}
                  placeholder="Mês de início (ex: 1)"
                  type="number"
                  min={1}
                  step={1}
                />
                <SmallInput
                  value={g.monthEnd}
                  onChange={(v) => setGoalField(goalIdx, "monthEnd", v)}
                  placeholder="Mês de fim (ex: 8)"
                  type="number"
                  min={1}
                  step={1}
                />
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
                  Etapas
                </div>

                <div className="space-y-4">
                  {(g.stages || []).map((s, stageIdx) => {
                    const stageLabel = `Etapa ${goalIdx + 1}.${stageIdx + 1}`;
                    return (
                      <div
                        key={stageIdx}
                        className="rounded-xl border border-[#F0F0F0] p-4 bg-[#FAFAFA]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold font-inter text-[#111827]">
                            {stageLabel}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeStage(goalIdx, stageIdx)}
                            className="text-xs font-inter text-red-600 hover:underline"
                          >
                            Remover etapa
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <SmallInput
                            value={s.title}
                            onChange={(v) =>
                              setStageField(goalIdx, stageIdx, "title", v)
                            }
                            placeholder="Título da etapa (máx 150)"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <SmallInput
                              value={s.monthStart}
                              onChange={(v) =>
                                setStageField(
                                  goalIdx,
                                  stageIdx,
                                  "monthStart",
                                  v,
                                )
                              }
                              placeholder="Mês início"
                              type="number"
                              min={1}
                              step={1}
                            />
                            <SmallInput
                              value={s.monthEnd}
                              onChange={(v) =>
                                setStageField(goalIdx, stageIdx, "monthEnd", v)
                              }
                              placeholder="Mês fim"
                              type="number"
                              min={1}
                              step={1}
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <textarea
                            value={s.description}
                            onChange={(e) =>
                              setStageField(
                                goalIdx,
                                stageIdx,
                                "description",
                                e.target.value,
                              )
                            }
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                            placeholder="Descrição (máx 300)"
                          />
                        </div>

                        <div className="mt-4">
                          <div className="text-sm font-semibold font-inter text-[#111827]">
                            Produtos
                          </div>
                          <div className="text-xs text-[#6B7280] font-inter mt-1">
                            Ex: Relatório Técnico, Certificados, etc.
                          </div>

                          <div className="mt-2 space-y-2">
                            {(s.products || []).map((pr, prodIdx) => {
                              const prodLabel = `Produto ${goalIdx + 1}.${stageIdx + 1}.${prodIdx + 1}`;
                              return (
                                <div
                                  key={prodIdx}
                                  className="grid grid-cols-1 md:grid-cols-4 gap-2"
                                >
                                  <div className="md:col-span-2">
                                    <SmallInput
                                      value={pr.deliverable}
                                      onChange={(v) =>
                                        setProductField(
                                          goalIdx,
                                          stageIdx,
                                          prodIdx,
                                          "deliverable",
                                          v,
                                        )
                                      }
                                      placeholder={`${prodLabel} (entregável)`}
                                    />
                                  </div>
                                  <SmallInput
                                    value={pr.indicatorTarget}
                                    onChange={(v) =>
                                      setProductField(
                                        goalIdx,
                                        stageIdx,
                                        prodIdx,
                                        "indicatorTarget",
                                        v,
                                      )
                                    }
                                    placeholder="Indicador"
                                    type="number"
                                    min={0}
                                  />
                                  <div className="flex items-center gap-2">
                                    <SmallInput
                                      value={pr.verificationSource}
                                      onChange={(v) =>
                                        setProductField(
                                          goalIdx,
                                          stageIdx,
                                          prodIdx,
                                          "verificationSource",
                                          v,
                                        )
                                      }
                                      placeholder="Fonte verificação"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeProduct(
                                          goalIdx,
                                          stageIdx,
                                          prodIdx,
                                        )
                                      }
                                      className="text-xs text-red-600 font-inter hover:underline"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            <button
                              type="button"
                              onClick={() => addProduct(goalIdx, stageIdx)}
                              className="text-sm font-inter underline"
                            >
                              + Adicionar produto
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => addStage(goalIdx)}
                    className="text-sm font-inter underline"
                  >
                    + Adicionar etapa
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addGoal}
          className="text-sm font-inter underline"
        >
          + Adicionar meta
        </button>
      </div>
    </div>
  );
}

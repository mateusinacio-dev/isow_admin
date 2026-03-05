export function CategoryCard({
  category,
  index,
  isContinuous,
  canRemove,
  onRemove,
  onFieldChange,
  onAddBenefit,
  onBenefitChange,
  onRemoveBenefit,
}) {
  return (
    <div className="border border-[#E5E7EB] rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold font-inter text-[#111827]">
          Categoria {index + 1}
        </div>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="h-9 px-4 rounded-full border border-[#FCA5A5] text-sm font-inter text-red-700"
          >
            Remover
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold text-[#6B7280] font-inter mb-1">
            Nome da categoria
          </div>
          <input
            value={category.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            className="h-11 w-full px-4 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
            placeholder="Ex: Bronze"
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-[#6B7280] font-inter mb-1">
            Valor mensal (R$)
          </div>
          <input
            value={category.monthlyValue}
            onChange={(e) =>
              onFieldChange(
                "monthlyValue",
                e.target.value.replace(/[^0-9.,]/g, ""),
              )
            }
            className="h-11 w-full px-4 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
            placeholder="Ex: 50"
          />
          <div className="text-xs text-[#6B7280] font-inter mt-1">
            iSOW vai criar a opção anual automaticamente.
          </div>
        </div>
      </div>

      {isContinuous ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold text-[#6B7280] font-inter mb-1">
              Meta da categoria
            </div>
            <div className="flex items-center gap-2">
              <select
                value={category.goalType}
                onChange={(e) => onFieldChange("goalType", e.target.value)}
                className="h-11 px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
              >
                <option value="MONEY">R$</option>
                <option value="QUANTITY">Quantidade</option>
              </select>
              <input
                value={category.goalValue}
                onChange={(e) =>
                  onFieldChange(
                    "goalValue",
                    e.target.value.replace(/[^0-9.,]/g, ""),
                  )
                }
                className="h-11 w-full px-4 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                placeholder={
                  category.goalType === "QUANTITY" ? "Ex: 100" : "Ex: 50000"
                }
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#6B7280] font-inter">
                Benefícios da categoria
              </div>
              <div className="text-xs text-[#6B7280] font-inter mt-1">
                Você pode deixar sem benefícios e editar depois.
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-inter">
              <input
                type="checkbox"
                checked={Boolean(category.benefitsEnabled)}
                onChange={(e) =>
                  onFieldChange("benefitsEnabled", e.target.checked)
                }
              />
              Ativar
            </label>
          </div>

          {category.benefitsEnabled ? (
            <div className="mt-3 space-y-2">
              {(category.benefits || []).map((b, bi) => {
                return (
                  <div
                    key={bi}
                    className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-2 items-center"
                  >
                    <input
                      value={b.label}
                      onChange={(e) =>
                        onBenefitChange(bi, "label", e.target.value)
                      }
                      className="h-11 w-full px-4 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                      placeholder={`Benefício ${bi + 1} (ex: tickets para evento anual)`}
                    />
                    <input
                      value={b.quantity}
                      onChange={(e) =>
                        onBenefitChange(
                          bi,
                          "quantity",
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      className="h-11 w-full px-4 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                      placeholder="Qtd"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveBenefit(bi)}
                      className="h-11 px-4 rounded-xl border border-[#E5E7EB] text-sm font-inter"
                    >
                      Remover
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={onAddBenefit}
                className="h-9 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter"
              >
                + Adicionar benefício
              </button>
            </div>
          ) : (
            <div className="mt-2 text-sm font-inter text-[#6B7280]">Nenhum</div>
          )}

          <div className="mt-3 text-xs text-[#6B7280] font-inter">
            Observação: ao concluir, a iSOW pode criar a categoria "Minha
            escolha" (anual) com os benefícios da maior categoria.
          </div>
        </div>
      )}
    </div>
  );
}

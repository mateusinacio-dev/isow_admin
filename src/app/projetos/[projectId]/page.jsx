import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useUpload from "@/utils/useUpload";
import AdminShell from "../../../components/admin/AdminShell";
import useProject from "../hooks/useProject";
import { updateProject } from "../services/projectApi";
import { fetchOrgSuppliers } from "../../fornecedores/services/supplierApi";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

function formatDate(dateStr) {
  if (!dateStr) {
    return "-";
  }
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

function money(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) {
    return "R$ 0,00";
  }
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function keyForProduct(g, s, p) {
  return `g${g}-s${s}-p${p}`;
}

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function computeRealIndicators(cfg, execData) {
  const goals = safeArray(cfg?.goals);
  const map = {};

  for (let gi = 0; gi < goals.length; gi += 1) {
    const g = goals[gi] || {};
    const stages = safeArray(g.stages);

    let goalSum = 0;

    for (let si = 0; si < stages.length; si += 1) {
      const s = stages[si] || {};
      const products = safeArray(s.products);
      let stageSum = 0;

      for (let pi = 0; pi < products.length; pi += 1) {
        const k = keyForProduct(gi, si, pi);
        const v = Number(execData?.products?.[k]?.realIndicator || 0);
        if (Number.isFinite(v)) {
          stageSum += v;
        }
      }

      map[`stage:${gi}:${si}`] = stageSum;
      goalSum += stageSum;
    }

    map[`goal:${gi}`] = goalSum;
  }

  return map;
}

export default function ProjetoDetailPage({ params: { projectId } }) {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);
  const [activeTab, setActiveTab] = useState("dados"); // dados | execucao
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const queryClient = useQueryClient();
  const [upload, { loading: uploading }] = useUpload();

  const { data: suppliersData } = useQuery({
    queryKey: ["admin", "org", organizationId, "suppliers"],
    queryFn: () => fetchOrgSuppliers(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });
  const suppliers = suppliersData?.suppliers || [];

  const {
    data,
    isLoading,
    error: loadError,
  } = useProject(organizationId, projectId);
  const project = data?.project || null;

  const cfg = project?.adminConfig || {};
  const execData = cfg?.executionData || { products: {}, budget: {} };

  const realMap = useMemo(() => {
    return computeRealIndicators(cfg, execData);
  }, [cfg, execData]);

  const budgetTotals = cfg?.budget?.totals || null;

  const updateMutation = useMutation({
    mutationFn: async (nextAdminConfig) => {
      return updateProject(organizationId, projectId, {
        name: project?.name,
        shortDescription: project?.shortDescription,
        longDescription: project?.longDescription,
        logoImageUrl: project?.logoImageUrl,
        adminConfig: nextAdminConfig,
        address: project?.address,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "project", projectId],
      });
      setSuccess("Alterações salvas.");
    },
    onError: (e) => {
      console.error(e);
      setError("Não foi possível salvar.");
    },
  });

  const title = project?.name || "Projeto";

  const subtitle = useMemo(() => {
    if (isLoading) {
      return "Carregando projeto…";
    }
    return "Página de execução e gestão";
  }, [isLoading]);

  const tabs = useMemo(() => {
    return [
      { id: "dados", label: "Dados do projeto" },
      { id: "execucao", label: "Execução" },
    ];
  }, []);

  const ensureExecutionData = useCallback((next) => {
    return {
      ...next,
      executionData: {
        products: {},
        budget: {},
        ...(next.executionData || {}),
      },
    };
  }, []);

  const saveExecData = useCallback(
    (nextExecData) => {
      setError(null);
      setSuccess(null);
      const nextCfg = ensureExecutionData({
        ...cfg,
        executionData: nextExecData,
      });
      updateMutation.mutate(nextCfg);
    },
    [cfg, ensureExecutionData, updateMutation],
  );

  const setProductRealIndicator = useCallback(
    (key, value) => {
      const next = {
        ...execData,
        products: {
          ...(execData.products || {}),
          [key]: {
            ...(execData.products?.[key] || {}),
            realIndicator: value,
          },
        },
      };
      saveExecData(next);
    },
    [execData, saveExecData],
  );

  const setProductEvidenceUrl = useCallback(
    (key, url) => {
      const next = {
        ...execData,
        products: {
          ...(execData.products || {}),
          [key]: {
            ...(execData.products?.[key] || {}),
            evidenceUrl: url,
          },
        },
      };
      saveExecData(next);
    },
    [execData, saveExecData],
  );

  const setBudgetSpent = useCallback(
    (rubricKey, idx, patch) => {
      const current = safeArray(execData?.budget?.[rubricKey]);
      const nextArr = [...current];
      nextArr[idx] = { ...(nextArr[idx] || {}), ...(patch || {}) };

      const next = {
        ...execData,
        budget: {
          ...(execData.budget || {}),
          [rubricKey]: nextArr,
        },
      };
      saveExecData(next);
    },
    [execData, saveExecData],
  );

  const handleUploadEvidence = useCallback(
    async (file, key) => {
      setError(null);
      if (!file) {
        return;
      }
      const { url, error: uploadError } = await upload({ file });
      if (uploadError) {
        setError(uploadError);
        return;
      }
      setProductEvidenceUrl(key, url);
    },
    [setProductEvidenceUrl, upload],
  );

  const handleUploadReceipt = useCallback(
    async (file, rubricKey, idx) => {
      setError(null);
      if (!file) {
        return;
      }
      const { url, error: uploadError } = await upload({ file });
      if (uploadError) {
        setError(uploadError);
        return;
      }
      setBudgetSpent(rubricKey, idx, { receiptUrl: url });
    },
    [setBudgetSpent, upload],
  );

  const executionStatus = String(cfg?.execution?.status || "NOT_STARTED");

  const infoCard = (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[#111827] font-inter">
            {project?.name}
          </div>
          <div className="text-xs text-[#6B7280] font-inter mt-1">
            Período: {formatDate(project?.startDate)} –{" "}
            {formatDate(project?.endDate)}
          </div>
        </div>

        <a
          href={`/projetos/${projectId}/editar`}
          className="inline-flex items-center justify-center h-9 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter"
        >
          Editar projeto
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          const cls = active
            ? "bg-[#111827] text-white border-[#111827]"
            : "bg-white text-[#111827] border-[#E5E7EB]";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`h-9 px-4 rounded-full border text-sm font-inter ${cls}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <AdminShell
      title={title}
      subtitle={subtitle}
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      <div className="space-y-6">
        <a
          href="/projetos"
          className="text-sm font-inter text-[#374151] hover:underline"
        >
          ← Voltar para Projetos
        </a>

        {error ? (
          <div className="bg-white border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-600 font-inter">{error}</div>
          </div>
        ) : null}

        {success ? (
          <div className="bg-white border border-emerald-200 rounded-xl p-4">
            <div className="text-sm text-emerald-700 font-inter">{success}</div>
          </div>
        ) : null}

        {loadError ? (
          <div className="bg-white border border-red-200 rounded-xl p-6">
            <div className="text-sm text-red-600 font-inter">
              Não foi possível carregar o projeto.
            </div>
          </div>
        ) : null}

        {project ? infoCard : null}

        {!project && isLoading ? (
          <div className="text-sm font-inter text-[#6B7280]">Carregando…</div>
        ) : null}

        {project && activeTab === "dados" ? (
          <div className="space-y-4">
            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="text-sm font-semibold text-[#111827] font-inter">
                Resumo
              </div>
              <div className="text-sm text-[#374151] font-inter mt-2 whitespace-pre-wrap">
                {cfg.summary || project.shortDescription || "-"}
              </div>
            </div>

            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="text-sm font-semibold text-[#111827] font-inter">
                Local
              </div>
              <div className="text-sm text-[#374151] font-inter mt-2">
                {(cfg.location?.city || "-") +
                  " / " +
                  (cfg.location?.uf || "-")}
              </div>
              <div className="text-xs text-[#6B7280] font-inter mt-2">
                Duração: {cfg.durationMonths || "-"} meses • Beneficiários
                diretos: {cfg.beneficiariesDirect || "-"}
              </div>
            </div>

            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="text-sm font-semibold text-[#111827] font-inter">
                Orçamento (resumo)
              </div>
              {budgetTotals ? (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#F0F0F0] p-3">
                    <div className="text-xs text-[#6B7280] font-inter">
                      Itens
                    </div>
                    <div className="text-sm font-semibold font-inter text-[#111827] mt-1">
                      {money(budgetTotals.sumRubrics)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#F0F0F0] p-3">
                    <div className="text-xs text-[#6B7280] font-inter">
                      Taxa + Impostos
                    </div>
                    <div className="text-sm font-semibold font-inter text-[#111827] mt-1">
                      {money(
                        (budgetTotals.adminFeeValue || 0) +
                          (budgetTotals.taxesValue || 0),
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#F0F0F0] p-3">
                    <div className="text-xs text-[#6B7280] font-inter">
                      Total
                    </div>
                    <div className="text-sm font-semibold font-inter text-[#111827] mt-1">
                      {money(budgetTotals.totalProject)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[#6B7280] font-inter mt-2">
                  Sem orçamento detalhado.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {project && activeTab === "execucao" ? (
          <div className="space-y-4">
            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#111827] font-inter">
                    Execução do projeto
                  </div>
                  <div className="text-xs text-[#6B7280] font-inter mt-1">
                    Status: {executionStatus}
                  </div>
                </div>
                <div className="text-xs text-[#6B7280] font-inter">
                  {uploading || updateMutation.isPending ? "Salvando…" : ""}
                </div>
              </div>

              {executionStatus !== "STARTED" ? (
                <div className="mt-4 text-sm font-inter text-[#6B7280]">
                  Para iniciar execução, use o botão “Iniciar execução” na tela
                  de edição.
                </div>
              ) : null}
            </div>

            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="text-sm font-semibold text-[#111827] font-inter mb-1">
                Execução das metas e etapas
              </div>
              <div className="text-xs text-[#6B7280] font-inter mb-4">
                Preencha o indicador real e anexe a fonte de verificação.
              </div>

              {safeArray(cfg.goals).map((g, gi) => {
                const goalReal = realMap[`goal:${gi}`] || 0;
                return (
                  <div key={gi} className="border-t border-[#F3F4F6] pt-4 mt-4">
                    <div className="text-sm font-semibold font-inter text-[#111827]">
                      Meta {gi + 1}: {g.title || "(sem título)"}
                    </div>
                    <div className="text-xs text-[#6B7280] font-inter mt-1">
                      Indicador alvo: {g.indicatorTarget || "-"} • Indicador
                      real: {goalReal}
                    </div>

                    {safeArray(g.stages).map((s, si) => {
                      const stageReal = realMap[`stage:${gi}:${si}`] || 0;
                      return (
                        <div
                          key={si}
                          className="mt-3 rounded-xl border border-[#F0F0F0] p-4 bg-[#FAFAFA]"
                        >
                          <div className="text-sm font-semibold font-inter text-[#111827]">
                            Etapa {gi + 1}.{si + 1}: {s.title || "(sem título)"}
                          </div>
                          <div className="text-xs text-[#6B7280] font-inter mt-1">
                            Real (soma produtos): {stageReal}
                          </div>

                          <div className="mt-3 space-y-3">
                            {safeArray(s.products).map((p, pi) => {
                              const k = keyForProduct(gi, si, pi);
                              const row = execData?.products?.[k] || {};
                              const evidenceUrl = row.evidenceUrl || "";
                              return (
                                <div
                                  key={k}
                                  className="rounded-xl border border-[#E6E6E6] p-3 bg-white"
                                >
                                  <div className="text-sm font-semibold font-inter text-[#111827]">
                                    Produto {gi + 1}.{si + 1}.{pi + 1}:{" "}
                                    {p.deliverable || "(entregável)"}
                                  </div>
                                  <div className="text-xs text-[#6B7280] font-inter mt-1">
                                    Fonte: {p.verificationSource || "-"}
                                  </div>

                                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                    <div>
                                      <div className="text-xs text-[#6B7280] font-inter">
                                        Indicador real
                                      </div>
                                      <input
                                        type="number"
                                        value={row.realIndicator ?? ""}
                                        onChange={(e) =>
                                          setProductRealIndicator(
                                            k,
                                            e.target.value,
                                          )
                                        }
                                        className="h-10 w-full px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                                      />
                                    </div>

                                    <div className="md:col-span-2">
                                      <div className="text-xs text-[#6B7280] font-inter">
                                        Comprovante (anexo)
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <label className="inline-flex items-center h-10 px-4 rounded-xl border border-[#E5E7EB] text-sm font-inter cursor-pointer">
                                          Anexar
                                          <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) =>
                                              handleUploadEvidence(
                                                e.target.files?.[0] || null,
                                                k,
                                              )
                                            }
                                          />
                                        </label>
                                        {evidenceUrl ? (
                                          <a
                                            href={evidenceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-inter text-[#111827] hover:underline"
                                          >
                                            Ver arquivo
                                          </a>
                                        ) : (
                                          <div className="text-sm text-[#6B7280] font-inter">
                                            Nenhum anexo
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="text-sm font-semibold text-[#111827] font-inter mb-1">
                Execução do orçamento
              </div>
              <div className="text-xs text-[#6B7280] font-inter mb-4">
                Informe valor gasto e anexe comprovante por item.
              </div>

              <BudgetExecutionTable
                title="Pessoal"
                rubricKey="personnel"
                items={safeArray(cfg?.budget?.personnel)}
                spent={safeArray(execData?.budget?.personnel)}
                suppliers={suppliers}
                onChange={setBudgetSpent}
                onUpload={handleUploadReceipt}
              />
              <BudgetExecutionTable
                title="Material permanente"
                rubricKey="permanentMaterial"
                items={safeArray(cfg?.budget?.permanentMaterial)}
                spent={safeArray(execData?.budget?.permanentMaterial)}
                suppliers={suppliers}
                onChange={setBudgetSpent}
                onUpload={handleUploadReceipt}
              />
              <BudgetExecutionTable
                title="Material de consumo"
                rubricKey="consumables"
                items={safeArray(cfg?.budget?.consumables)}
                spent={safeArray(execData?.budget?.consumables)}
                suppliers={suppliers}
                onChange={setBudgetSpent}
                onUpload={handleUploadReceipt}
              />
              <BudgetExecutionTable
                title="Viagens"
                rubricKey="travel"
                items={safeArray(cfg?.budget?.travel)}
                spent={safeArray(execData?.budget?.travel)}
                suppliers={suppliers}
                onChange={setBudgetSpent}
                onUpload={handleUploadReceipt}
              />
              <BudgetExecutionTable
                title="Diárias"
                rubricKey="perDiem"
                items={safeArray(cfg?.budget?.perDiem)}
                spent={safeArray(execData?.budget?.perDiem)}
                suppliers={suppliers}
                onChange={setBudgetSpent}
                onUpload={handleUploadReceipt}
              />

              <div className="mt-6 text-xs text-[#6B7280] font-inter">
                Observação: ainda não bloqueamos o avanço sem comprovante, mas
                já deixamos isso bem explícito aqui.
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}

function BudgetExecutionTable({
  title,
  rubricKey,
  items,
  spent,
  suppliers,
  onChange,
  onUpload,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  if (safeItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="text-sm font-semibold text-[#111827] font-inter mb-2">
        {title}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left">
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Item
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Valor total
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Valor gasto
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Fornecedor
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Comprovante
              </th>
            </tr>
          </thead>
          <tbody>
            {safeItems.map((it, idx) => {
              const row = spent?.[idx] || {};
              const label = it.role || it.description || `Item ${idx + 1}`;
              const receiptUrl = row.receiptUrl || "";
              const selectedSupplierId = row.supplierId || it.supplierId || "";

              return (
                <tr key={idx} className="border-t border-[#F3F4F6]">
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    {label}
                  </td>
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    {money(it.totalValue || 0)}
                  </td>
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    <input
                      type="number"
                      value={row.spentValue ?? ""}
                      onChange={(e) =>
                        onChange(rubricKey, idx, { spentValue: e.target.value })
                      }
                      className="h-10 w-40 px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                      placeholder="R$"
                      min={0}
                      step={0.01}
                    />
                  </td>
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    <select
                      value={selectedSupplierId}
                      onChange={(e) =>
                        onChange(rubricKey, idx, {
                          supplierId: e.target.value || null,
                        })
                      }
                      className="h-10 w-[340px] max-w-full px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
                    >
                      <option value="">(opcional)</option>
                      {safeSuppliers.map((s) => {
                        const name = s.tradeName || s.legalName || "(sem nome)";
                        const doc =
                          `${s.documentType || ""} ${s.documentNumber || ""}`.trim();
                        const optLabel = doc ? `${name} • ${doc}` : name;
                        return (
                          <option key={s.supplierId} value={s.supplierId}>
                            {optLabel}
                          </option>
                        );
                      })}
                    </select>
                    {safeSuppliers.length === 0 ? (
                      <div className="text-[11px] text-[#6B7280] font-inter mt-1">
                        Cadastre fornecedores em /fornecedores.
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center h-10 px-4 rounded-xl border border-[#E5E7EB] text-sm font-inter cursor-pointer">
                        Anexar
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            onUpload(
                              e.target.files?.[0] || null,
                              rubricKey,
                              idx,
                            )
                          }
                        />
                      </label>
                      {receiptUrl ? (
                        <a
                          href={receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-inter hover:underline"
                        >
                          Ver
                        </a>
                      ) : (
                        <span className="text-sm text-[#6B7280] font-inter">
                          -
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

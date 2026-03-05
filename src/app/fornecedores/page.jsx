import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AdminShell from "../../components/admin/AdminShell";
import useOrgSuppliers from "./hooks/useOrgSuppliers";
import { createOrLinkSupplier, unlinkSupplier } from "./services/supplierApi";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

function docLabel(row) {
  if (!row) {
    return "–";
  }
  const type = row.documentType || "";
  const number = row.documentNumber || "";
  if (!type && !number) {
    return "–";
  }
  return `${type} ${number}`.trim();
}

function nameLabel(row) {
  const trade = row?.tradeName ? String(row.tradeName).trim() : "";
  const legal = row?.legalName ? String(row.legalName).trim() : "";
  return trade || legal || "(sem nome)";
}

export default function FornecedoresPage() {
  const qc = useQueryClient();
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const {
    data,
    isLoading,
    error: loadError,
  } = useOrgSuppliers(organizationId, {
    search: search.trim() ? search.trim() : "",
  });

  const rows = data?.suppliers || [];

  const linkMutation = useMutation({
    mutationFn: async (supplierId) => {
      return createOrLinkSupplier(organizationId, { supplierId });
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "suppliers"],
      });
      setError(null);
    },
    onError: (e) => {
      console.error(e);
      setError("Não foi possível vincular o fornecedor.");
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (supplierId) => {
      return unlinkSupplier(organizationId, supplierId);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "suppliers"],
      });
      setError(null);
    },
    onError: (e) => {
      console.error(e);
      setError("Não foi possível remover o fornecedor da ONG.");
    },
  });

  const subtitle = useMemo(() => {
    if (isLoading) {
      return "Carregando fornecedores…";
    }
    return "Fornecedores (CPF/CNPJ)";
  }, [isLoading]);

  const isMutating = linkMutation.isPending || unlinkMutation.isPending;

  return (
    <AdminShell
      title="Fornecedores"
      subtitle={subtitle}
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      <div className="space-y-6">
        {error || loadError ? (
          <div className="bg-white border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-700 font-inter">
              {error || "Não foi possível carregar fornecedores."}
            </div>
          </div>
        ) : null}

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-lg font-semibold font-inter text-[#111827]">
                Cadastro de fornecedores
              </div>
              <div className="text-xs text-[#6B7280] font-inter mt-1">
                Busque por CPF/CNPJ ou nome. Se existir na base iSOW, você só
                vincula.
              </div>
            </div>
            <a
              href="/fornecedores/novo"
              className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-black text-white text-sm font-inter"
            >
              Cadastrar novo
            </a>
          </div>

          <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por CPF/CNPJ ou nome…"
              className="h-10 w-full md:w-[420px] px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
            />
            <div className="text-xs text-[#6B7280] font-inter">
              {search.trim()
                ? "Mostrando resultados na base iSOW (vinculados e não vinculados)."
                : "Mostrando fornecedores vinculados à ONG."}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[980px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Nome
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Documento
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Contato
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Status
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-sm font-inter text-[#6B7280]"
                    >
                      Carregando…
                    </td>
                  </tr>
                ) : null}

                {!isLoading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-sm font-inter text-[#6B7280]"
                    >
                      Nenhum fornecedor encontrado.
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? rows.map((s) => {
                      const linked = Boolean(s.linked);
                      const statusLabel = linked
                        ? "Vinculado à ONG"
                        : "Base iSOW";
                      const statusCls = linked
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]";

                      return (
                        <tr
                          key={s.supplierId}
                          className="border-t border-[#F3F4F6]"
                        >
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            <div className="font-semibold">{nameLabel(s)}</div>
                            <div className="text-xs text-[#6B7280]">
                              {s.tradeName && s.legalName ? s.legalName : ""}
                            </div>
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {docLabel(s)}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#6B7280]">
                            <div>{s.email || "–"}</div>
                            <div className="text-xs">{s.phone || ""}</div>
                          </td>
                          <td className="py-3 text-sm font-inter">
                            <span
                              className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-semibold border ${statusCls}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            <div className="flex items-center gap-2">
                              <a
                                href={`/fornecedores/${s.supplierId}/editar`}
                                className="inline-flex items-center h-9 px-3 rounded-full border border-[#E5E7EB] text-sm font-inter hover:bg-[#F9FAFB]"
                              >
                                Editar
                              </a>

                              {!linked ? (
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  onClick={() =>
                                    linkMutation.mutate(s.supplierId)
                                  }
                                  className="inline-flex items-center h-9 px-3 rounded-full bg-black text-white text-sm font-inter disabled:opacity-60"
                                >
                                  Vincular
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  onClick={() => {
                                    const ok = window.confirm(
                                      "Remover vínculo deste fornecedor com a ONG?",
                                    );
                                    if (!ok) {
                                      return;
                                    }
                                    unlinkMutation.mutate(s.supplierId);
                                  }}
                                  className="inline-flex items-center h-9 px-3 rounded-full border border-red-200 text-red-700 text-sm font-inter hover:bg-red-50 disabled:opacity-60"
                                >
                                  Remover
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  : null}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-[#6B7280] font-inter">
            Dica: se você buscar por um CPF/CNPJ e aparecer como “Base iSOW”,
            clique em “Vincular” para usar em Projetos.
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

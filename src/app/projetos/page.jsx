import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminShell from "../../components/admin/AdminShell";
import KpiCard from "../../components/admin/KpiCard";
import useOrgProjects from "./hooks/useOrgProjects";
import { deleteProject } from "./services/projectApi";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

function formatDate(dateStr) {
  if (!dateStr) {
    return "-";
  }
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

export default function ProjetosPage() {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);
  const [filter, setFilter] = useState("ATIVOS"); // ATIVOS | ENCERRADOS
  const [error, setError] = useState(null);

  const queryClient = useQueryClient();

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const { data, isLoading, error: loadError } = useOrgProjects(organizationId);
  const all = data?.projects || [];

  const active = useMemo(() => {
    return all.filter((p) => String(p.status || "").toUpperCase() === "ACTIVE");
  }, [all]);

  const closed = useMemo(() => {
    return all.filter((p) => String(p.status || "").toUpperCase() !== "ACTIVE");
  }, [all]);

  const rows = filter === "ATIVOS" ? active : closed;

  const handleDelete = useCallback(
    async (projectId) => {
      setError(null);
      const ok = window.confirm(
        "Excluir este projeto? Isso não pode ser desfeito.",
      );
      if (!ok) {
        return;
      }

      try {
        await deleteProject(organizationId, projectId);
        await queryClient.invalidateQueries({
          queryKey: ["admin", "org", organizationId, "projects"],
        });
      } catch (e) {
        console.error(e);
        setError("Não foi possível excluir o projeto.");
      }
    },
    [organizationId, queryClient],
  );

  const pills = useMemo(() => {
    return [
      { id: "ATIVOS", label: "Projetos ativos" },
      { id: "ENCERRADOS", label: "Projetos encerrados" },
    ];
  }, []);

  return (
    <AdminShell
      title="Projetos"
      subtitle="Gestão de projetos da ONG"
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-white border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-600 font-inter">{error}</div>
          </div>
        ) : null}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {pills.map((p) => {
              const activePill = filter === p.id;
              const cls = activePill
                ? "bg-[#111827] text-white border-[#111827]"
                : "bg-white text-[#111827] border-[#E5E7EB]";
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilter(p.id)}
                  className={`h-9 px-4 rounded-full border text-sm font-inter ${cls}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <a
            href="/projetos/novo"
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-gradient-to-b from-[#252525] to-[#0F0F0F] text-white text-sm font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] active:scale-95"
          >
            Cadastrar novo Projeto
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiCard label="Ativos" value={active.length} />
          <KpiCard label="Encerrados" value={closed.length} />
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6 overflow-x-auto">
          <div className="text-lg font-semibold font-inter text-[#111827] mb-1">
            Lista de projetos
          </div>
          <div className="text-xs text-[#6B7280] font-inter mb-4">
            Clique no nome para abrir a página de execução/gestão do projeto.
          </div>

          {loadError ? (
            <div className="text-sm text-red-600 font-inter">
              Não foi possível carregar os projetos.
            </div>
          ) : null}

          {isLoading ? (
            <div className="text-sm text-[#6B7280] font-inter">Carregando…</div>
          ) : null}

          {!isLoading && rows.length === 0 ? (
            <div className="text-sm text-[#6B7280] font-inter">
              Nenhum projeto encontrado.
            </div>
          ) : null}

          {rows.length ? (
            <table className="min-w-[900px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Projeto
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Status
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Início
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Fim
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const status = String(p.status || "-");
                  return (
                    <tr key={p.projectId} className="border-t border-[#F3F4F6]">
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        <a
                          href={`/projetos/${p.projectId}`}
                          className="font-semibold hover:underline"
                        >
                          {p.name || "(sem nome)"}
                        </a>
                        <div className="text-xs text-[#6B7280] font-inter mt-1 line-clamp-2">
                          {p.shortDescription || ""}
                        </div>
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {status}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(p.startDate)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(p.endDate)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        <div className="flex items-center gap-3">
                          <a
                            href={`/projetos/${p.projectId}/editar`}
                            className="text-sm font-inter text-[#111827] hover:underline"
                          >
                            Editar
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.projectId)}
                            className="text-sm font-inter text-red-600 hover:underline"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>

        <div className="text-xs text-[#6B7280] font-inter">
          Dica: defina “Mínimo valor viável” e “Valor captado” dentro do projeto
          para liberar o botão “Iniciar execução”.
        </div>
      </div>
    </AdminShell>
  );
}

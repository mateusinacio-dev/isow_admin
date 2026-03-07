import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import AdminShell from "../../components/admin/AdminShell";
import KpiCard from "../../components/admin/KpiCard";
import useOrgProjects from "./hooks/useOrgProjects";
import { deleteProject } from "./services/projectApi";

/* ─── Helpers ───────────────────────────────────────────────────────── */

function formatDate(value) {
  if (!value) return "–";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
      new Date(value),
    );
  } catch {
    return String(value);
  }
}

function isDraft(status) {
  return String(status || "").toUpperCase() === "DRAFT";
}

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "DRAFT") return "Rascunho";
  if (s === "PUBLISHED") return "Publicado";
  if (s === "ACTIVE") return "Ativo";
  if (s === "STARTED") return "Em execução";
  if (s === "FINISHED") return "Encerrado";
  if (s === "CANCELED") return "Cancelado";
  return status || "–";
}

function statusBadgeClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PUBLISHED" || s === "ACTIVE" || s === "STARTED")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "DRAFT")
    return "bg-yellow-50 text-yellow-800 border border-yellow-200";
  return "bg-gray-100 text-gray-600 border border-gray-200";
}

function pickPrimaryProject(projects) {
  if (!Array.isArray(projects) || projects.length === 0) return null;
  const active = projects.find((p) => {
    const s = String(p.status || "").toUpperCase();
    return s === "PUBLISHED" || s === "ACTIVE" || s === "STARTED";
  });
  return active || projects[0];
}

/* ─── Toast ─────────────────────────────────────────────────────────── */

function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const base =
    "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-inter max-w-sm";
  const colors =
    type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white";

  return (
    <div className={`${base} ${colors}`}>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
}

/* ─── Confirm Modal ──────────────────────────────────────────────────── */

function ConfirmModal({ projectName, isPending, onCancel, onConfirm }) {
  const overlayRef = useRef(null);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) onCancel();
    },
    [onCancel],
  );

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto">
          <Trash2 size={22} className="text-red-600" />
        </div>

        <div className="text-center">
          <div className="text-base font-semibold font-inter text-[#111827]">
            Excluir projeto
          </div>
          <div className="text-sm font-inter text-[#6B7280] mt-2 leading-relaxed">
            Tem certeza que deseja excluir o projeto{" "}
            <span className="font-semibold text-[#111827]">
              &ldquo;{projectName}&rdquo;
            </span>
            ?{" "}
            <span className="text-red-600 font-medium">
              Esta ação não pode ser desfeita.
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 h-10 rounded-lg border border-[#E5E7EB] text-[#374151] text-sm font-inter font-medium hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 h-10 rounded-lg bg-[#DC2626] text-white text-sm font-inter font-medium hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Excluindo…
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Confirmar exclusão
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function ProjetosPage() {
  const [organizationId, setOrganizationId] = useState(null);
  const [filter, setFilter] = useState("ATIVOS");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmProjectId, setConfirmProjectId] = useState(null);
  const [confirmProjectName, setConfirmProjectName] = useState("");
  const [toast, setToast] = useState(null);

  const queryClient = useQueryClient();
  const dismissToast = useCallback(() => setToast(null), []);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || null);
    setShowConfirm(false);
  }, []);

  const { data, isLoading, error: loadError } = useOrgProjects(organizationId);
  const all = data?.projects || [];

  const active = useMemo(
    () =>
      all.filter((p) => {
        const s = String(p.status || "").toUpperCase();
        return s === "ACTIVE" || s === "PUBLISHED" || s === "STARTED";
      }),
    [all],
  );

  const closed = useMemo(
    () =>
      all.filter((p) => {
        const s = String(p.status || "").toUpperCase();
        return s !== "ACTIVE" && s !== "PUBLISHED" && s !== "STARTED";
      }),
    [all],
  );

  const rows = filter === "ATIVOS" ? active : closed;

  const primaryProject = useMemo(() => pickPrimaryProject(all), [all]);
  const hasProject = Boolean(primaryProject);

  const canDelete = useCallback(
    (project) => isDraft(project?.status),
    [],
  );

  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteProject(organizationId, confirmProjectId),
    onSuccess: async () => {
      setShowConfirm(false);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "projects"],
      });
      setToast({ message: "Projeto excluído com sucesso.", type: "success" });
    },
    onError: () => {
      setShowConfirm(false);
      setToast({
        message: "Erro ao excluir projeto. Tente novamente.",
        type: "error",
      });
    },
  });

  const handleDeleteClick = useCallback(
    (project) => {
      if (!canDelete(project)) return;
      setConfirmProjectId(project.projectId);
      setConfirmProjectName(project.name || "Projeto");
      setShowConfirm(true);
    },
    [canDelete],
  );

  const handleConfirm = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  const handleCancel = useCallback(() => {
    if (!deleteMutation.isPending) setShowConfirm(false);
  }, [deleteMutation.isPending]);

  const pills = useMemo(
    () => [
      { id: "ATIVOS", label: "Projetos ativos" },
      { id: "ENCERRADOS", label: "Projetos encerrados" },
    ],
    [],
  );

  return (
    <>
      <AdminShell title="Projetos" onOrgChange={onOrgChange}>
        {/* Sem ONG selecionada */}
        {!organizationId ? (
          <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
            <div className="text-sm font-semibold font-inter text-[#111827]">
              Selecione uma ONG
            </div>
            <div className="text-sm font-inter text-[#6B7280] mt-1">
              Para ver e gerenciar projetos, selecione uma ONG no topo.
            </div>
          </div>
        ) : null}

        {/* Carregando */}
        {organizationId && isLoading ? (
          <div className="text-sm font-inter text-[#6B7280]">Carregando…</div>
        ) : null}

        {/* Erro ao carregar */}
        {organizationId && loadError ? (
          <div className="bg-white border border-red-200 rounded-xl p-4 md:p-6">
            <div className="text-sm font-inter text-red-700">
              Não foi possível carregar os projetos desta ONG.
            </div>
          </div>
        ) : null}

        {/* Conteúdo principal */}
        {organizationId && !isLoading && !loadError ? (
          <div className="space-y-6">
            {/* SEM projetos */}
            {!hasProject ? (
              <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold font-inter text-[#111827]">
                      Nenhum projeto cadastrado
                    </div>
                    <div className="text-sm font-inter text-[#6B7280] mt-1">
                      Cadastre o primeiro projeto para esta ONG.
                    </div>
                  </div>
                  <a
                    href="/projetos/novo"
                    className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 shrink-0"
                  >
                    Cadastrar Projeto
                  </a>
                </div>
              </div>
            ) : null}

            {/* COM projetos */}
            {hasProject ? (
              <>
                {/* Card do projeto principal */}
                <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold font-inter text-[#6B7280] uppercase tracking-wide mb-1">
                        Projeto principal
                      </div>
                      <div className="text-base font-semibold font-inter text-[#111827] truncate">
                        {primaryProject.name || "Projeto"}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-inter ${statusBadgeClass(primaryProject.status)}`}
                        >
                          {statusLabel(primaryProject.status)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/projetos/${primaryProject.projectId}`}
                        className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90"
                      >
                        Ver detalhes
                      </a>
                      <a
                        href={`/projetos/${primaryProject.projectId}/editar`}
                        className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] text-sm font-inter hover:bg-[#F9FAFB]"
                      >
                        Editar
                      </a>
                      <a
                        href="/projetos/novo"
                        className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] text-sm font-inter hover:bg-[#F9FAFB]"
                      >
                        Novo projeto
                      </a>
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <KpiCard label="Ativos" value={active.length} />
                  <KpiCard label="Encerrados" value={closed.length} />
                </div>

                {/* Filtros + Tabela */}
                <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6 overflow-x-auto">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
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
                  </div>

                  {rows.length === 0 ? (
                    <div className="text-sm text-[#6B7280] font-inter">
                      Nenhum projeto encontrado.
                    </div>
                  ) : (
                    <table className="min-w-[900px] w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="text-left">
                          <th className="text-xs font-semibold text-[#6B7280] font-inter py-2 pr-4">
                            Projeto
                          </th>
                          <th className="text-xs font-semibold text-[#6B7280] font-inter py-2 pr-4">
                            Status
                          </th>
                          <th className="text-xs font-semibold text-[#6B7280] font-inter py-2 pr-4">
                            Início
                          </th>
                          <th className="text-xs font-semibold text-[#6B7280] font-inter py-2 pr-4">
                            Fim
                          </th>
                          <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((p) => (
                          <tr
                            key={p.projectId}
                            className="border-t border-[#F3F4F6]"
                          >
                            <td className="py-3 pr-4 text-sm font-inter text-[#111827]">
                              <a
                                href={`/projetos/${p.projectId}`}
                                className="font-semibold hover:underline"
                              >
                                {p.name || "(sem nome)"}
                              </a>
                              {p.shortDescription ? (
                                <div className="text-xs text-[#6B7280] font-inter mt-1 line-clamp-2">
                                  {p.shortDescription}
                                </div>
                              ) : null}
                            </td>
                            <td className="py-3 pr-4 text-sm font-inter">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-inter ${statusBadgeClass(p.status)}`}
                              >
                                {statusLabel(p.status)}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-sm font-inter text-[#6B7280]">
                              {formatDate(p.startDate)}
                            </td>
                            <td className="py-3 pr-4 text-sm font-inter text-[#6B7280]">
                              {formatDate(p.endDate)}
                            </td>
                            <td className="py-3 text-sm font-inter">
                              <div className="flex items-center gap-3">
                                <a
                                  href={`/projetos/${p.projectId}/editar`}
                                  className="text-sm font-inter text-[#111827] hover:underline"
                                >
                                  Editar
                                </a>
                                {/* Excluir: só rascunho */}
                                {canDelete(p) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteClick(p)}
                                    disabled={deleteMutation.isPending}
                                    className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-[#DC2626] text-white text-xs font-inter font-medium hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Trash2 size={13} />
                                    Excluir
                                  </button>
                                ) : (
                                  <div className="relative group inline-block">
                                    <button
                                      type="button"
                                      disabled
                                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-[#E5E7EB] text-[#9CA3AF] text-xs font-inter font-medium cursor-not-allowed"
                                    >
                                      <Trash2 size={13} />
                                      Excluir
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                                      <div className="bg-[#111827] text-white text-xs font-inter rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                        Projetos publicados não podem ser
                                        excluídos
                                      </div>
                                      <div className="w-2 h-2 bg-[#111827] rotate-45 mx-auto -mt-1" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </AdminShell>

      {/* Modal de confirmação */}
      {showConfirm ? (
        <ConfirmModal
          projectName={confirmProjectName}
          isPending={deleteMutation.isPending}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      ) : null}

      {/* Toast */}
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      ) : null}
    </>
  );
}

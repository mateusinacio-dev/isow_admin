import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import AdminShell from "../../components/admin/AdminShell";

/* ─── API ──────────────────────────────────────────────────────────── */

async function fetchOrgEvents(organizationId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events`,
  );
  if (!response.ok) {
    throw new Error(
      `Erro ao carregar eventos [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

async function deleteProgramApi({ organizationId, eventId }) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw new Error(`Erro ao excluir programa [${response.status}]`);
  }
  return response.json();
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

function isProgramType(eventTypeName) {
  const t = String(eventTypeName || "").toUpperCase();
  return t === "STOCKS" || t === "CROWDFUNDING";
}

function pickPrimaryProgram(programs) {
  if (!Array.isArray(programs) || programs.length === 0) return null;
  const active = programs.find((p) => {
    const s = String(p.status || "").toUpperCase();
    return s === "PUBLISHED" || s === "STARTED";
  });
  return active || programs[0];
}

function isDraft(status) {
  return String(status || "").toUpperCase() === "DRAFT";
}

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "DRAFT") return "Rascunho";
  if (s === "PUBLISHED") return "Publicado";
  if (s === "STARTED") return "Em andamento";
  if (s === "FINISHED") return "Encerrado";
  if (s === "CANCELED") return "Cancelado";
  return status || "–";
}

function statusBadgeClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PUBLISHED" || s === "STARTED")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "DRAFT")
    return "bg-yellow-50 text-yellow-800 border border-yellow-200";
  return "bg-gray-100 text-gray-600 border border-gray-200";
}

function typeLabel(eventTypeName) {
  const t = String(eventTypeName || "").toUpperCase();
  if (t === "STOCKS") return "Pacote de Benefícios";
  if (t === "CROWDFUNDING") return "Investimento Direto";
  return eventTypeName || "–";
}

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

function ConfirmModal({ programName, isPending, onCancel, onConfirm }) {
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
        {/* Ícone */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto">
          <Trash2 size={22} className="text-red-600" />
        </div>

        {/* Título */}
        <div className="text-center">
          <div className="text-base font-semibold font-inter text-[#111827]">
            Excluir programa
          </div>
          <div className="text-sm font-inter text-[#6B7280] mt-2 leading-relaxed">
            Tem certeza que deseja excluir o programa{" "}
            <span className="font-semibold text-[#111827]">
              &ldquo;{programName}&rdquo;
            </span>
            ?{" "}
            <span className="text-red-600 font-medium">
              Esta ação não pode ser desfeita.
            </span>
          </div>
        </div>

        {/* Botões */}
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

export default function ProgramasPage() {
  const [organizationId, setOrganizationId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const queryClient = useQueryClient();

  const dismissToast = useCallback(() => setToast(null), []);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || null);
    setShowConfirm(false);
  }, []);

  const {
    data: eventsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "programas"],
    queryFn: () => fetchOrgEvents(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });

  const allEvents = eventsData?.events || [];

  const programs = useMemo(
    () => allEvents.filter((e) => isProgramType(e.eventTypeName)),
    [allEvents],
  );

  const primaryProgram = useMemo(
    () => pickPrimaryProgram(programs),
    [programs],
  );

  const hasProgram = Boolean(primaryProgram);
  const canDelete = primaryProgram ? isDraft(primaryProgram.status) : false;

  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteProgramApi({ organizationId, eventId: primaryProgram.eventId }),
    onSuccess: async () => {
      setShowConfirm(false);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "programas"],
      });
      setToast({ message: "Programa excluído com sucesso.", type: "success" });
    },
    onError: () => {
      setShowConfirm(false);
      setToast({
        message: "Erro ao excluir programa. Tente novamente.",
        type: "error",
      });
    },
  });

  const handleDeleteClick = useCallback(() => {
    if (!canDelete) return;
    setShowConfirm(true);
  }, [canDelete]);

  const handleConfirm = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  const handleCancel = useCallback(() => {
    if (!deleteMutation.isPending) setShowConfirm(false);
  }, [deleteMutation.isPending]);

  return (
    <>
      <AdminShell title="Programas" onOrgChange={onOrgChange}>
        {/* Sem ONG selecionada */}
        {!organizationId ? (
          <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
            <div className="text-sm font-semibold font-inter text-[#111827]">
              Selecione uma ONG
            </div>
            <div className="text-sm font-inter text-[#6B7280] mt-1">
              Para ver e criar programas, selecione uma ONG no topo.
            </div>
          </div>
        ) : null}

        {/* Carregando */}
        {organizationId && isLoading ? (
          <div className="text-sm font-inter text-[#6B7280]">Carregando…</div>
        ) : null}

        {/* Erro ao carregar */}
        {organizationId && error ? (
          <div className="bg-white border border-red-200 rounded-xl p-4 md:p-6">
            <div className="text-sm font-inter text-red-700">
              Não foi possível carregar os programas desta ONG.
            </div>
          </div>
        ) : null}

        {/* Conteúdo principal */}
        {organizationId && !isLoading && !error ? (
          <div className="space-y-6">
            {/* SEM programa */}
            {!hasProgram ? (
              <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold font-inter text-[#111827]">
                      Nenhum programa cadastrado
                    </div>
                    <div className="text-sm font-inter text-[#6B7280] mt-1">
                      Cadastre um programa de Pacote de Benefícios ou
                      Investimento Direto para esta ONG.
                    </div>
                  </div>
                  <a
                    href="/programas/novo"
                    className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 shrink-0"
                  >
                    Cadastrar Programa
                  </a>
                </div>
              </div>
            ) : null}

            {/* COM programa */}
            {hasProgram ? (
              <>
                {/* Card "Programa atual" */}
                <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold font-inter text-[#6B7280] uppercase tracking-wide mb-1">
                        Programa atual
                      </div>
                      <div className="text-base font-semibold font-inter text-[#111827] truncate">
                        {primaryProgram.name || "Programa"}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-inter ${statusBadgeClass(primaryProgram.status)}`}
                        >
                          {statusLabel(primaryProgram.status)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-inter bg-[#EEF2FF] text-[#3730A3]">
                          {typeLabel(primaryProgram.eventTypeName)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/programas/${primaryProgram.eventId}`}
                        className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90"
                      >
                        Ver detalhes
                      </a>
                      <a
                        href={`/programas/${primaryProgram.eventId}/editar`}
                        className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] text-sm font-inter hover:bg-[#F9FAFB]"
                      >
                        Editar
                      </a>
                    </div>
                  </div>
                </div>

                {/* Tabela "Programa" */}
                <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
                  <div className="text-lg font-semibold font-inter text-[#111827] mb-4">
                    Programa
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-[600px] w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="text-left">
                          <th className="text-xs font-semibold text-[#6B7280] font-inter py-2 pr-4">
                            Nome
                          </th>
                          <th className="text-xs font-semibold text-[#6B7280] font-inter py-2 pr-4">
                            Status
                          </th>
                          <th className="text-xs font-semibold text-[#6B7280] font-inter py-2 pr-4">
                            Início
                          </th>
                          <th className="text-xs font-semibold text-[#6B7280] font-inter py-2 pr-4">
                            Tipo
                          </th>
                          <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-[#F3F4F6]">
                          <td className="py-3 pr-4 text-sm font-semibold font-inter text-[#111827]">
                            {primaryProgram.name || "(sem nome)"}
                          </td>
                          <td className="py-3 pr-4 text-sm font-inter text-[#6B7280]">
                            {statusLabel(primaryProgram.status)}
                          </td>
                          <td className="py-3 pr-4 text-sm font-inter text-[#6B7280]">
                            {formatDate(primaryProgram.startDate)}
                          </td>
                          <td className="py-3 pr-4 text-sm font-inter">
                            <span className="inline-flex items-center px-3 h-7 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#3730A3]">
                              {typeLabel(primaryProgram.eventTypeName)}
                            </span>
                          </td>
                          <td className="py-3 text-sm font-inter">
                            {/* Botão Excluir com regra de negócio */}
                            {canDelete ? (
                              <button
                                type="button"
                                onClick={handleDeleteClick}
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
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                                  <div className="bg-[#111827] text-white text-xs font-inter rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                    Programas publicados não podem ser excluídos
                                  </div>
                                  <div className="w-2 h-2 bg-[#111827] rotate-45 mx-auto -mt-1" />
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </AdminShell>

      {/* Modal de confirmação */}
      {showConfirm && primaryProgram ? (
        <ConfirmModal
          programName={primaryProgram.name || "Programa"}
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

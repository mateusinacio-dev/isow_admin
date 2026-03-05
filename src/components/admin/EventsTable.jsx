import { useMemo } from "react";

function formatDate(value) {
  if (!value) {
    return "–";
  }
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(d);
  } catch {
    return String(value);
  }
}

function badgeColor(type) {
  if (!type) {
    return "bg-[#F3F4F6] text-[#374151]";
  }

  const t = String(type).toUpperCase();
  if (t === "STOCKS" || t === "CROWDFUNDING") {
    return "bg-[#EEF2FF] text-[#3730A3]";
  }
  if (t === "FREE_HACKATHON") {
    return "bg-[#ECFDF5] text-[#065F46]";
  }
  if (t === "ONPREMISE") {
    return "bg-[#F5F3FF] text-[#5B21B6]";
  }

  return "bg-[#F3F4F6] text-[#374151]";
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

function typeLabel(type) {
  const t = String(type || "").toUpperCase();
  if (t === "STOCKS") return "Pacote de Benefícios";
  if (t === "CROWDFUNDING") return "Investimento Direto";
  return type || "–";
}

export default function EventsTable({
  title,
  subtitle,
  events,
  loading,
  error,
  organizationId,
  linkBase,
  emptyMessage,
  showType = true,
}) {
  const rows = events || [];

  const hasTypeCol = useMemo(() => {
    if (!showType) {
      return false;
    }
    return true;
  }, [showType]);

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-lg font-semibold font-inter text-[#111827] truncate">
            {title}
          </div>
          {subtitle ? (
            <div className="text-xs text-[#6B7280] font-inter mt-1">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600 font-inter mb-4">
          Não foi possível carregar a lista.
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left">
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Nome
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
              {hasTypeCol ? (
                <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                  Tipo
                </th>
              ) : null}
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={hasTypeCol ? 6 : 5}
                  className="py-6 text-sm font-inter text-[#6B7280]"
                >
                  Carregando…
                </td>
              </tr>
            ) : null}

            {!loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={hasTypeCol ? 6 : 5}
                  className="py-6 text-sm font-inter text-[#6B7280]"
                >
                  {emptyMessage || "Nenhum evento encontrado."}
                </td>
              </tr>
            ) : null}

            {!loading
              ? rows.map((e) => {
                  const status = e.status || "–";
                  const type = e.eventTypeName || e.attendanceType || "–";
                  const link = `${linkBase}/${e.eventId}?org=${organizationId}`;
                  const typeClass = badgeColor(type);

                  return (
                    <tr key={e.eventId} className="border-t border-[#F3F4F6]">
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        <a
                          href={link}
                          className="font-semibold hover:underline"
                          title="Abrir painel"
                        >
                          {e.name || "(sem nome)"}
                        </a>
                        <div className="text-xs text-[#6B7280] font-inter mt-1">
                          Clique para abrir
                        </div>
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {statusLabel(status)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(e.startDate)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(e.endDate)}
                      </td>
                      {hasTypeCol ? (
                        <td className="py-3 text-sm font-inter">
                          <span
                            className={`inline-flex items-center px-3 h-7 rounded-full text-xs font-semibold ${typeClass}`}
                          >
                            {typeLabel(type)}
                          </span>
                        </td>
                      ) : null}
                      <td className="py-3 text-sm font-inter">
                        <a
                          href={link}
                          className="inline-flex items-center h-9 px-4 rounded-full bg-gradient-to-b from-[#252525] to-[#0F0F0F] text-white text-sm font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] active:scale-95"
                        >
                          Abrir
                        </a>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

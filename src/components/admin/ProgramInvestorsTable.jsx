import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

function formatMoneyBRL(value) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value || 0));
  } catch {
    return String(value);
  }
}

function formatNumberBR(value) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return String(value);
  }
}

function formatDate(value) {
  if (!value) {
    return "–";
  }
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(value);
  }
}

function downloadTextFile({ filename, text, mimeType }) {
  try {
    const blob = new Blob([text], { type: mimeType || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
  }
}

function toCsvValue(v) {
  const s = String(v ?? "");
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

async function fetchInvestors({
  organizationId,
  eventId,
  search,
  limit,
  offset,
}) {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const url = `/api/admin/organizations/${organizationId}/events/${eventId}/investors?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `When fetching ${url}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

async function fetchAllInvestors({ organizationId, eventId, search }) {
  const limit = 100;
  let offset = 0;
  let totalCount = Infinity;
  const all = [];

  // safety to avoid infinite loops
  let loops = 0;
  while (offset < totalCount) {
    loops += 1;
    if (loops > 200) {
      break;
    }

    const data = await fetchInvestors({
      organizationId,
      eventId,
      search,
      limit,
      offset,
    });

    const rows = data?.investors || [];
    const nextTotal = Number(data?.page?.totalCount || 0);
    totalCount = Number.isFinite(nextTotal) ? nextTotal : 0;

    all.push(...rows);
    offset += limit;

    if (rows.length === 0) {
      break;
    }
  }

  return all;
}

function EmailModal({ open, onClose, rows, selected, setSelected }) {
  const allKeys = useMemo(
    () => (rows || []).map((r) => r.investorKey).filter(Boolean),
    [rows],
  );

  const allOnPageSelected = useMemo(() => {
    if (allKeys.length === 0) {
      return false;
    }
    return allKeys.every((k) => selected.has(k));
  }, [allKeys, selected]);

  const toggleAllOnPage = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const all = allKeys.every((k) => next.has(k));
      for (const k of allKeys) {
        if (all) {
          next.delete(k);
        } else {
          next.add(k);
        }
      }
      return next;
    });
  }, [allKeys, setSelected]);

  const toggleOne = useCallback(
    (key) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    [setSelected],
  );

  const selectedEmails = useMemo(() => {
    const emails = [];
    for (const r of rows || []) {
      if (!selected.has(r.investorKey)) {
        continue;
      }
      if (r.investorEmail) {
        emails.push(r.investorEmail);
      }
    }
    return Array.from(new Set(emails));
  }, [rows, selected]);

  const copyEmails = useCallback(async () => {
    try {
      const text = selectedEmails.join(", ");
      if (!text) {
        return;
      }
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error(e);
    }
  }, [selectedEmails]);

  const mailtoHref = useMemo(() => {
    const bcc = selectedEmails.join(",");
    if (!bcc) {
      return null;
    }
    return `mailto:?bcc=${encodeURIComponent(bcc)}`;
  }, [selectedEmails]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[760px] bg-white rounded-2xl border border-[#E5E7EB] shadow-xl">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[#F3F4F6]">
          <div className="text-base font-semibold font-inter text-[#111827]">
            Enviar e-mail (seleção)
          </div>
          <button
            className="h-9 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              className="h-10 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter"
              onClick={toggleAllOnPage}
            >
              {allOnPageSelected
                ? "Desmarcar todos (página)"
                : "Selecionar todos (página)"}
            </button>

            <button
              className="h-10 px-4 rounded-full bg-[#111827] text-white text-sm font-semibold font-inter disabled:opacity-50"
              onClick={copyEmails}
              disabled={selectedEmails.length === 0}
            >
              Copiar e-mails
            </button>

            {mailtoHref ? (
              <a
                href={mailtoHref}
                className="h-10 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter inline-flex items-center justify-center"
              >
                Abrir no e-mail
              </a>
            ) : (
              <div className="text-xs text-[#6B7280] font-inter">
                Selecione investidores com e-mail.
              </div>
            )}
          </div>

          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="max-h-[340px] overflow-auto">
              <table className="min-w-[600px] w-full border-separate border-spacing-0">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left">
                    <th className="w-10 py-2 px-3 text-xs font-semibold text-[#6B7280] font-inter">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleAllOnPage}
                      />
                    </th>
                    <th className="py-2 text-xs font-semibold text-[#6B7280] font-inter">
                      Investidor
                    </th>
                    <th className="py-2 text-xs font-semibold text-[#6B7280] font-inter">
                      E-mail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(rows || []).map((r) => {
                    const checked = selected.has(r.investorKey);
                    return (
                      <tr
                        key={r.investorKey}
                        className="border-t border-[#F3F4F6]"
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(r.investorKey)}
                          />
                        </td>
                        <td className="py-2 text-sm font-inter text-[#111827]">
                          {r.investorName || "–"}
                        </td>
                        <td className="py-2 text-sm font-inter text-[#6B7280]">
                          {r.investorEmail || "–"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs text-[#6B7280] font-inter">
            Dica: clique em “Copiar e-mails” e cole no BCC do seu provedor.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProgramInvestorsTable({ organizationId, eventId }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState(null);

  const limit = 25;
  const offset = page * limit;

  const queryKey = useMemo(() => {
    return [
      "admin",
      "program",
      eventId,
      "investors",
      { organizationId, search, limit, offset },
    ];
  }, [eventId, limit, offset, organizationId, search]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchInvestors({ organizationId, eventId, search, limit, offset }),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });

  const rows = data?.investors || [];
  const totalCount = data?.page?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const allKeys = useMemo(
    () => rows.map((r) => r.investorKey).filter(Boolean),
    [rows],
  );

  const allOnPageSelected = useMemo(() => {
    if (allKeys.length === 0) {
      return false;
    }
    return allKeys.every((k) => selected.has(k));
  }, [allKeys, selected]);

  const toggleAllOnPage = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const all = allKeys.every((k) => next.has(k));
      for (const k of allKeys) {
        if (all) {
          next.delete(k);
        } else {
          next.add(k);
        }
      }
      return next;
    });
  }, [allKeys]);

  const toggleOne = useCallback((key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const exportInvestorsCsv = useCallback(async () => {
    try {
      if (!organizationId || !eventId) {
        return;
      }
      setExportError(null);
      setExportingCsv(true);

      const all = await fetchAllInvestors({
        organizationId,
        eventId,
        search,
      });

      const header = [
        "Nome",
        "E-mail",
        "Documento",
        "Categoria",
        "Valor bruto",
        "Valor líquido",
        "Único/Recorrente",
        "Data do investimento",
        "Último pagamento",
        "Chave",
      ];

      const lines = [];
      lines.push(header.map(toCsvValue).join(";"));

      for (const r of all) {
        const kindLabel = r.hasRecurring ? "Recorrente" : "Único";
        const line = [
          r.investorName || "",
          r.investorEmail || "",
          r.investorLegal || r.investorExternal || "",
          r.category || "",
          formatNumberBR(r.grossTotal),
          formatNumberBR(r.netTotal),
          kindLabel,
          formatDate(r.investmentAt),
          formatDate(r.lastPaymentAt),
          r.investorKey || "",
        ];
        lines.push(line.map(toCsvValue).join(";"));
      }

      const text = `\uFEFF${lines.join("\n")}`;
      downloadTextFile({
        filename: `programa_${eventId}_investidores.csv`,
        text,
        mimeType: "text/csv;charset=utf-8",
      });
    } catch (e) {
      console.error(e);
      setExportError(
        "Não foi possível exportar os investidores (CSV).\nTente novamente.",
      );
    } finally {
      setExportingCsv(false);
    }
  }, [eventId, organizationId, search]);

  const exportInvestorsPdf = useCallback(async () => {
    try {
      if (!organizationId || !eventId) {
        return;
      }
      setExportError(null);
      setExportingPdf(true);

      const all = await fetchAllInvestors({
        organizationId,
        eventId,
        search,
      });

      const win = window.open("", "_blank");
      if (!win) {
        return;
      }

      const now = new Date();
      const nowLabel = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(now);

      const safeSearch = search ? String(search) : "";
      const searchHtml = safeSearch
        ? `<div style="color:#6B7280;font-size:12px;margin-top:6px;">Filtro: ${safeSearch.replace(/</g, "&lt;")}</div>`
        : "";

      const rowsHtml = all
        .map((r) => {
          const kindLabel = r.hasRecurring ? "Recorrente" : "Único";
          const doc = r.investorLegal || r.investorExternal || "";
          return `
            <tr>
              <td style="border:1px solid #E5E7EB;padding:6px;">${(r.investorName || "").replace(/</g, "&lt;")}</td>
              <td style="border:1px solid #E5E7EB;padding:6px;">${(r.investorEmail || "").replace(/</g, "&lt;")}</td>
              <td style="border:1px solid #E5E7EB;padding:6px;">${String(doc).replace(/</g, "&lt;")}</td>
              <td style="border:1px solid #E5E7EB;padding:6px;">${(r.category || "").replace(/</g, "&lt;")}</td>
              <td style="border:1px solid #E5E7EB;padding:6px; text-align:right;">${formatMoneyBRL(r.grossTotal)}</td>
              <td style="border:1px solid #E5E7EB;padding:6px; text-align:right;">${formatMoneyBRL(r.netTotal)}</td>
              <td style="border:1px solid #E5E7EB;padding:6px;">${kindLabel}</td>
              <td style="border:1px solid #E5E7EB;padding:6px;">${formatDate(r.investmentAt)}</td>
              <td style="border:1px solid #E5E7EB;padding:6px;">${formatDate(r.lastPaymentAt)}</td>
            </tr>
          `;
        })
        .join("");

      const html = `
        <html>
          <head>
            <title>Programa - Investidores</title>
            <meta charset="utf-8" />
            <style>
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body style="font-family: Inter, Arial, sans-serif; padding: 24px; color: #111827;">
            <div class="no-print" style="margin-bottom: 12px; font-size: 12px; color: #6B7280;">
              Dica: no diálogo de impressão, escolha “Salvar como PDF”.
            </div>
            <h2 style="margin:0;">Investidores do Programa</h2>
            <div style="color:#6B7280;font-size:12px;margin-top:6px;">Gerado em: ${nowLabel}</div>
            ${searchHtml}
            <div style="color:#6B7280;font-size:12px;margin-top:6px;margin-bottom:12px;">Total: ${all.length}</div>

            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <tr>
                <th style="text-align:left;border:1px solid #E5E7EB;padding:6px;">Nome</th>
                <th style="text-align:left;border:1px solid #E5E7EB;padding:6px;">E-mail</th>
                <th style="text-align:left;border:1px solid #E5E7EB;padding:6px;">Documento</th>
                <th style="text-align:left;border:1px solid #E5E7EB;padding:6px;">Categoria</th>
                <th style="text-align:right;border:1px solid #E5E7EB;padding:6px;">Bruto</th>
                <th style="text-align:right;border:1px solid #E5E7EB;padding:6px;">Líquido</th>
                <th style="text-align:left;border:1px solid #E5E7EB;padding:6px;">Tipo</th>
                <th style="text-align:left;border:1px solid #E5E7EB;padding:6px;">Início</th>
                <th style="text-align:left;border:1px solid #E5E7EB;padding:6px;">Último pag.</th>
              </tr>
              ${rowsHtml}
            </table>
          </body>
        </html>
      `;

      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    } catch (e) {
      console.error(e);
      setExportError(
        "Não foi possível exportar os investidores (PDF).\nTente novamente.",
      );
    } finally {
      setExportingPdf(false);
    }
  }, [eventId, organizationId, search]);

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <EmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        rows={rows}
        selected={selected}
        setSelected={setSelected}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-lg font-semibold font-inter text-[#111827]">
            Investidores
          </div>
          <div className="text-xs text-[#6B7280] font-inter">
            Categoria = TicketType da compra inicial (recorrência via
            subscriptionId)
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
              setSelected(new Set());
            }}
            placeholder="Buscar por nome / email / doc / categoria"
            className="h-10 w-full sm:w-[360px] px-4 rounded-full bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
          />

          <button
            className="h-10 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter disabled:opacity-50"
            onClick={exportInvestorsPdf}
            disabled={rows.length === 0 || exportingPdf || exportingCsv}
            title="Gera uma versão para imprimir / salvar como PDF"
          >
            {exportingPdf ? "Exportando…" : "Exportar PDF"}
          </button>

          <button
            className="h-10 px-4 rounded-full bg-[#111827] text-white text-sm font-semibold font-inter disabled:opacity-50"
            onClick={exportInvestorsCsv}
            disabled={rows.length === 0 || exportingCsv || exportingPdf}
            title="Baixa um CSV que abre no Excel"
          >
            {exportingCsv ? "Exportando…" : "Exportar Excel (CSV)"}
          </button>

          <button
            className="h-10 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter disabled:opacity-50"
            onClick={() => setEmailModalOpen(true)}
            disabled={rows.length === 0}
          >
            Enviar e-mail
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600 font-inter">
          Não foi possível carregar os investidores.
        </div>
      ) : null}

      {exportError ? (
        <div className="text-sm text-red-600 font-inter mb-3 whitespace-pre-line">
          {exportError}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[1160px] w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left">
              <th className="w-10 text-xs font-semibold text-[#6B7280] font-inter py-2">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAllOnPage}
                />
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Nome
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Categoria
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Valor do investimento
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Valor líquido
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Único/Recorrente
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Data do investimento
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Último pagamento
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-sm font-inter text-[#6B7280]"
                >
                  Carregando…
                </td>
              </tr>
            ) : null}

            {!isLoading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-sm font-inter text-[#6B7280]"
                >
                  Nenhum investidor encontrado.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? rows.map((r) => {
                  const checked = selected.has(r.investorKey);
                  const kindLabel = r.hasRecurring ? "Recorrente" : "Único";

                  const investmentValue = r.hasRecurring
                    ? `${formatMoneyBRL(r.grossTotal)} (realizado)`
                    : formatMoneyBRL(r.grossTotal);

                  const href = `/programas/${eventId}/investidores/${encodeURIComponent(
                    r.investorKey,
                  )}`;

                  return (
                    <tr
                      key={r.investorKey}
                      className="border-t border-[#F3F4F6]"
                    >
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(r.investorKey)}
                        />
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        <a
                          href={href}
                          className="font-semibold hover:underline"
                        >
                          {r.investorName || "–"}
                        </a>
                        <div className="text-xs text-[#6B7280] font-inter">
                          {r.investorExternal ||
                            r.investorLegal ||
                            r.investorKey ||
                            "–"}
                        </div>
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {r.category || "–"}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {investmentValue}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {formatMoneyBRL(r.netTotal)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {kindLabel}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(r.investmentAt)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(r.lastPaymentAt)}
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-[#6B7280] font-inter">
          {totalCount ? `${totalCount} investidores` : ""}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="h-9 px-4 rounded-full border border-[#E5E5E5] text-sm font-inter disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Anterior
          </button>
          <div className="text-sm font-inter text-[#6B7280]">
            {page + 1} / {totalPages}
          </div>
          <button
            className="h-9 px-4 rounded-full border border-[#E5E5E5] text-sm font-inter disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page + 1 >= totalPages}
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}

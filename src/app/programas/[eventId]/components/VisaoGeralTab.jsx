import { useCallback, useMemo } from "react";
import ProgramInvestorsTable from "@/components/admin/ProgramInvestorsTable";
import { formatMoneyBRL } from "@/utils/formatters";
import { KpiSection } from "./KpiSection";
import { StackedYearChart } from "./StackedYearChart";
import { CategoryPieChart } from "./CategoryPieChart";
import { TicketsSection } from "./TicketsSection";
import { ProgramEventsSection } from "./ProgramEventsSection";

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

export function VisaoGeralTab({
  organizationId,
  eventId,
  programYear,
  yearTabs,
  selectedKpiYear,
  onKpiYearChange,
  totalInvestmentNetProjected,
  totalInAccountNet,
  investorsCount,
  recurringShareholders,
  programDashboard,
  onShowBreakdown,
  stackedYearRows,
  categoryMeta,
  selectedPieYear,
  onYearChange,
  pieYearData,
  kpisByYearRows,
  sold,
  available,
  locked,
  ticketTypes,
  programEventsFuture,
  programEventsPast,
}) {
  const exportCsv = useCallback(() => {
    // Excel-friendly CSV (with BOM)
    const headerA = [
      "Ano",
      "Total líquido pago",
      "Taxa bancária (pago)",
      "Taxa iSOW (pago)",
      "Investidores",
      "Recorrentes (com pagamento)",
    ];

    const lines = [];
    lines.push(headerA.map(toCsvValue).join(";"));

    for (const r of kpisByYearRows || []) {
      const row = [
        r.year,
        formatMoneyBRL(r.netPaid),
        formatMoneyBRL(r.bankFeePaid),
        formatMoneyBRL(r.isowFeePaid),
        r.investorsPaid,
        r.recurringSubsPaid,
      ];
      lines.push(row.map(toCsvValue).join(";"));
    }

    lines.push("");

    const headerB = ["Ano", ...categoryMeta.map((c) => c.name), "Total"];
    lines.push(headerB.map(toCsvValue).join(";"));

    for (const yr of stackedYearRows || []) {
      let total = 0;
      const row = [String(yr.year)];
      for (const c of categoryMeta) {
        const v = Number(yr[c.key] || 0);
        total += v;
        row.push(formatMoneyBRL(v));
      }
      row.push(formatMoneyBRL(total));
      lines.push(row.map(toCsvValue).join(";"));
    }

    const text = `\uFEFF${lines.join("\n")}`;
    downloadTextFile({
      filename: `programa_${eventId}_dashboard.csv`,
      text,
      mimeType: "text/csv;charset=utf-8",
    });
  }, [categoryMeta, eventId, kpisByYearRows, stackedYearRows]);

  const exportPdf = useCallback(() => {
    try {
      const yearLabel = selectedKpiYear || programYear || "–";
      const win = window.open("", "_blank");
      if (!win) {
        return;
      }

      const paidLabel = "KPIs (pago no ano)";

      const kpiHtml = `
        <h2 style="margin: 0 0 8px;">Dashboard do Programa</h2>
        <div style="color:#6B7280;font-size:12px;margin-bottom:16px;">Ano selecionado (KPIs): ${yearLabel}</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr>
            <th style="text-align:left;border:1px solid #E5E7EB;padding:8px;">Métrica</th>
            <th style="text-align:left;border:1px solid #E5E7EB;padding:8px;">Valor</th>
          </tr>
          <tr><td style="border:1px solid #E5E7EB;padding:8px;">Total de investimento (líquido)</td><td style="border:1px solid #E5E7EB;padding:8px;">${formatMoneyBRL(totalInvestmentNetProjected)}</td></tr>
          <tr><td style="border:1px solid #E5E7EB;padding:8px;">Total em conta (líquido)</td><td style="border:1px solid #E5E7EB;padding:8px;">${formatMoneyBRL(totalInAccountNet)}</td></tr>
          <tr><td style="border:1px solid #E5E7EB;padding:8px;">Número de investidores</td><td style="border:1px solid #E5E7EB;padding:8px;">${investorsCount}</td></tr>
          <tr><td style="border:1px solid #E5E7EB;padding:8px;">Acionistas recorrentes</td><td style="border:1px solid #E5E7EB;padding:8px;">${recurringShareholders}</td></tr>
        </table>
      `;

      const yearlyHtmlRows = (kpisByYearRows || [])
        .map((r) => {
          return `
            <tr>
              <td style="border:1px solid #E5E7EB;padding:8px;">${r.year}</td>
              <td style="border:1px solid #E5E7EB;padding:8px;">${formatMoneyBRL(r.netPaid)}</td>
              <td style="border:1px solid #E5E7EB;padding:8px;">${r.investorsPaid}</td>
              <td style="border:1px solid #E5E7EB;padding:8px;">${r.recurringSubsPaid}</td>
            </tr>
          `;
        })
        .join("");

      const yearlyTable = `
        <h3 style="margin: 16px 0 8px;">${paidLabel}</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <th style="text-align:left;border:1px solid #E5E7EB;padding:8px;">Ano</th>
            <th style="text-align:left;border:1px solid #E5E7EB;padding:8px;">Líquido pago</th>
            <th style="text-align:left;border:1px solid #E5E7EB;padding:8px;">Investidores</th>
            <th style="text-align:left;border:1px solid #E5E7EB;padding:8px;">Recorrentes</th>
          </tr>
          ${yearlyHtmlRows}
        </table>
      `;

      const html = `
        <html>
          <head>
            <title>Programa - Export</title>
          </head>
          <body style="font-family: Inter, Arial, sans-serif; padding: 24px; color: #111827;">
            ${kpiHtml}
            ${yearlyTable}
            <div style="margin-top: 16px; font-size: 11px; color: #6B7280;">Dica: no diálogo de impressão, escolha “Salvar como PDF”.</div>
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
    }
  }, [
    investorsCount,
    kpisByYearRows,
    programYear,
    recurringShareholders,
    selectedKpiYear,
    totalInAccountNet,
    totalInvestmentNetProjected,
  ]);

  const exportButtonsDisabled = useMemo(() => {
    const hasYear = (kpisByYearRows || []).length > 0;
    const hasChart = (stackedYearRows || []).length > 0;
    return !(hasYear || hasChart);
  }, [kpisByYearRows, stackedYearRows]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2">
        <button
          type="button"
          className="h-10 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter disabled:opacity-50"
          onClick={exportPdf}
          disabled={exportButtonsDisabled}
          title="Gera uma versão para imprimir / salvar como PDF"
        >
          Exportar PDF
        </button>
        <button
          type="button"
          className="h-10 px-4 rounded-full bg-[#111827] text-white text-sm font-semibold font-inter disabled:opacity-50"
          onClick={exportCsv}
          disabled={exportButtonsDisabled}
          title="Baixa um CSV que abre no Excel"
        >
          Exportar Excel (CSV)
        </button>
      </div>

      <KpiSection
        programYear={programYear}
        yearTabs={yearTabs}
        selectedKpiYear={selectedKpiYear}
        onKpiYearChange={onKpiYearChange}
        totalInvestmentNetProjected={totalInvestmentNetProjected}
        totalInAccountNet={totalInAccountNet}
        investorsCount={investorsCount}
        recurringShareholders={recurringShareholders}
        programDashboard={programDashboard}
        onShowBreakdown={onShowBreakdown}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <StackedYearChart
          stackedYearRows={stackedYearRows}
          categoryMeta={categoryMeta}
        />

        <CategoryPieChart
          yearTabs={yearTabs}
          selectedPieYear={selectedPieYear}
          onYearChange={onYearChange}
          pieYearData={pieYearData}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TicketsSection
          sold={sold}
          available={available}
          locked={locked}
          ticketTypes={ticketTypes}
        />
      </div>

      <ProgramEventsSection
        eventId={eventId}
        programEventsFuture={programEventsFuture}
        programEventsPast={programEventsPast}
      />

      <ProgramInvestorsTable
        organizationId={organizationId}
        eventId={eventId}
      />
    </>
  );
}

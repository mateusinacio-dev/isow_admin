import { monthsRemainingInYearFromLastCharge } from "../utils/dateUtils.js";

export function processProgramCharts(yearlyByCategory) {
  const categorySet = new Set();
  const yearSet = new Set();
  for (const r of yearlyByCategory || []) {
    if (r.category) {
      categorySet.add(String(r.category));
    }
    yearSet.add(String(r.year));
  }

  const categories = Array.from(categorySet);
  const years = Array.from(yearSet).sort();

  // Use a more distinct palette so categories are easy to tell apart in both charts
  const palette = [
    "#2563EB", // blue
    "#16A34A", // green
    "#F97316", // orange
    "#7C3AED", // purple
    "#DB2777", // pink
    "#0EA5E9", // sky
    "#DC2626", // red
    "#A16207", // amber
    "#059669", // emerald
    "#4F46E5", // indigo
  ];

  const categoryMeta = categories.map((name, i) => ({
    name,
    key: `c${i}`,
    color: palette[i % palette.length],
  }));

  const yearRowsMap = new Map();
  for (const y of years) {
    yearRowsMap.set(y, { year: y });
  }
  for (const r of yearlyByCategory || []) {
    const y = String(r.year);
    const row = yearRowsMap.get(y) || { year: y };
    const catName = String(r.category || "–");
    const meta = categoryMeta.find((c) => c.name === catName);
    const key = meta?.key;
    if (key) {
      row[key] = Number(r.net || 0);
    }
    yearRowsMap.set(y, row);
  }
  const stackedYearRows = Array.from(yearRowsMap.values()).sort((a, b) =>
    String(a.year).localeCompare(String(b.year)),
  );

  return { categoryMeta, years, stackedYearRows };
}

export function processProgramProjections(programPayments, currentYear) {
  const yearPaid = programPayments?.[0] || {};

  const churnDays = 30;
  let projectedNet = 0;
  let projectedGross = 0;
  let projectedBankFee = 0;
  let projectedIsowFee = 0;
  let activeRecurringCount = 0;

  for (const row of programPayments || []) {
    const subscriptionId = row.subscriptionId;
    if (!subscriptionId) {
      continue;
    }
    const days = Number(row.daysSinceLastCharge || 999999);
    if (days >= churnDays) {
      continue;
    }
    const remainingMonths = monthsRemainingInYearFromLastCharge(
      row.lastChargeAt,
      currentYear,
    );
    if (remainingMonths <= 0) {
      continue;
    }

    const lastNet = Number(row.lastNet || 0);
    const lastGross = Number(row.lastGross || 0);
    const lastBankFee = Number(row.lastBankFee || 0);
    const lastIsowFee = Number(row.lastIsowFee || 0);

    projectedNet += remainingMonths * lastNet;
    projectedGross += remainingMonths * lastGross;
    projectedBankFee += remainingMonths * lastBankFee;
    projectedIsowFee += remainingMonths * lastIsowFee;
    activeRecurringCount += 1;
  }

  const grossPaidYear = Number(yearPaid.gross_paid || 0);
  const netPaidYear = Number(yearPaid.net_paid || 0);
  const bankFeePaidYear = Number(yearPaid.bank_fee_paid || 0);
  const isowFeePaidYear = Number(yearPaid.isow_fee_paid || 0);

  const totalInvestmentNetProjected = netPaidYear + projectedNet;
  const totalInvestmentGrossProjected = grossPaidYear + projectedGross;
  const totalInvestmentBankFeeProjected = bankFeePaidYear + projectedBankFee;
  const totalInvestmentIsowFeeProjected = isowFeePaidYear + projectedIsowFee;

  return {
    kpis: {
      totalInvestmentNetProjected,
      totalInAccountNet: netPaidYear,
      investorsCount: Number(yearPaid.investors_paid || 0),
      recurringShareholders: activeRecurringCount,
      breakdown: {
        paidYear: {
          gross: grossPaidYear,
          bankFee: bankFeePaidYear,
          isowFee: isowFeePaidYear,
          net: netPaidYear,
        },
        projectedUntilYearEnd: {
          gross: totalInvestmentGrossProjected,
          bankFee: totalInvestmentBankFeeProjected,
          isowFee: totalInvestmentIsowFeeProjected,
          net: totalInvestmentNetProjected,
        },
      },
    },
  };
}

export function processRelatedEvents(relatedEvents) {
  const futureEvents = [];
  const pastEvents = [];
  for (const e of relatedEvents || []) {
    const item = {
      eventId: e.eventId,
      name: e.name,
      startDate: e.startDate,
      endDate: e.endDate,
      locationLabel: [e.city, e.state].filter(Boolean).join(", ") || "–",
      ticketsTotal: Number(e.ticketsTotal || 0),
      ticketsSent: Boolean(e.ticketsSent),
      inscritos: Number(e.attendees || 0),
      presentes: Number(e.presentes || 0),
    };
    if (e.isFuture) {
      futureEvents.push(item);
    } else {
      pastEvents.push(item);
    }
  }

  return { futureEvents, pastEvents };
}

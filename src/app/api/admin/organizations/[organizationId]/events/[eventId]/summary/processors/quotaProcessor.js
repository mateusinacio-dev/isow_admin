export function processQuotaAggregates(quotaAgg, ticketTypes, ticketClusters) {
  const quotaByTypeMap = new Map();
  const quotaByClusterMap = new Map();

  for (const row of quotaAgg || []) {
    const item = {
      transactionsCount: Number(row.transactionsCount || 0),
      donorsCount: Number(row.donorsCount || 0),
      grossTotal: Number(row.grossTotal || 0),
      netTotal: Number(row.netTotal || 0),
      recurringSubscriptions: Number(row.recurringSubscriptions || 0),
      recurringTransactions: Number(row.recurringTransactions || 0),
      lastChargeAt: row.lastChargeAt || null,
    };

    if (row.kind === "TYPE") {
      quotaByTypeMap.set(String(row.id), item);
    } else if (row.kind === "CLUSTER") {
      quotaByClusterMap.set(String(row.id), item);
    }
  }

  const quotaByTicketType = (ticketTypes || []).map((t) => {
    const extra = quotaByTypeMap.get(String(t.id)) || {};
    return {
      id: t.id,
      name: t.name,
      total: Number(t.total || 0),
      sold: Number(t.sold || 0),
      locked: Number(t.locked || 0),
      financial: {
        netTotal: Number(extra.netTotal || 0),
        grossTotal: Number(extra.grossTotal || 0),
        donorsCount: Number(extra.donorsCount || 0),
        transactionsCount: Number(extra.transactionsCount || 0),
        recurringSubscriptions: Number(extra.recurringSubscriptions || 0),
        recurringTransactions: Number(extra.recurringTransactions || 0),
        lastChargeAt: extra.lastChargeAt || null,
      },
    };
  });

  const quotaByCluster = (ticketClusters || []).map((c) => {
    const extra = quotaByClusterMap.get(String(c.id)) || {};
    return {
      id: c.id,
      name: c.name,
      total: Number(c.total || 0),
      sold: Number(c.sold || 0),
      locked: Number(c.locked || 0),
      financial: {
        netTotal: Number(extra.netTotal || 0),
        grossTotal: Number(extra.grossTotal || 0),
        donorsCount: Number(extra.donorsCount || 0),
        transactionsCount: Number(extra.transactionsCount || 0),
        recurringSubscriptions: Number(extra.recurringSubscriptions || 0),
        recurringTransactions: Number(extra.recurringTransactions || 0),
        lastChargeAt: extra.lastChargeAt || null,
      },
    };
  });

  return { quotaByTicketType, quotaByCluster };
}

import { StatusPill } from "./StatusPill";

export function ComplianceStatusGrid({ complianceItems, onItemClick }) {
  const hasClick = typeof onItemClick === "function";

  const getSubText = (item) => {
    if (item?.expiresAt) {
      return `Vence: ${item.expiresAt}`;
    }

    if (item?.type === "FINANCIAL_STATEMENTS") {
      return "Atualizar todo ano (até março)";
    }

    if (item?.type === "CONSTITUTION_MINUTES") {
      return "Sem vencimento · não precisa atualizar";
    }

    if (item?.type === "STATUTE" || item?.type === "CNPJ_CARD") {
      return "Sem vencimento · atualize se mudar";
    }

    return "Sem vencimento";
  };

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold font-inter text-[#111827]">
          Status
        </div>
        {hasClick ? (
          <div className="text-[11px] text-[#6B7280] font-inter">
            Clique no nome do documento para enviar/atualizar.
          </div>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
        {complianceItems.map((item) => {
          const sub = getSubText(item);

          const label = hasClick ? (
            <button
              type="button"
              className="text-left text-sm font-inter text-[#111827] truncate underline decoration-[#111827]/30 hover:decoration-[#111827]"
              onClick={() => onItemClick(item)}
              title="Enviar/atualizar este documento"
            >
              {item.label}
            </button>
          ) : (
            <div className="text-sm font-inter text-[#111827] truncate">
              {item.label}
            </div>
          );

          return (
            <div
              key={item.type}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#E6E6E6] bg-[#FAFAFA] p-3"
            >
              <div className="min-w-0">
                {label}
                <div className="text-[11px] text-[#6B7280] font-inter mt-0.5">
                  {sub}
                </div>
              </div>
              <div title={(item.warnings || []).join("\n")}>
                <StatusPill status={item.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

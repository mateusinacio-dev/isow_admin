import { useMemo } from "react";

function formatMoneyBRL(value) {
  if (value === null || value === undefined) {
    return "–";
  }
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  } catch {
    return String(value);
  }
}

export default function KpiCard({ label, value, kind, hint, href }) {
  const display = useMemo(() => {
    if (kind === "money") {
      return formatMoneyBRL(value);
    }
    if (value === null || value === undefined) {
      return "–";
    }
    return String(value);
  }, [kind, value]);

  const Wrapper = href ? "a" : "div";
  const wrapperProps = href
    ? {
        href,
        className:
          "bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6 block transition-all duration-150 hover:border-[#D1D5DB] hover:bg-white/80 active:scale-[0.99]",
      }
    : {
        className: "bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6",
      };

  return (
    <Wrapper {...wrapperProps}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-inter text-[#6B7280] mb-2 whitespace-nowrap">
            {label}
          </div>
          {hint ? (
            <div className="text-[11px] font-inter text-[#9CA3AF] -mt-1 mb-2">
              {hint}
            </div>
          ) : null}
        </div>

        {href ? (
          <div className="text-[11px] font-inter text-[#6B7280]">Ver</div>
        ) : null}
      </div>

      <div className="text-2xl md:text-3xl font-bold font-inter text-black">
        {display}
      </div>
    </Wrapper>
  );
}

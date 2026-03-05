import SectionTitle from "./SectionTitle";

export default function OdsSection({ ods, setState, odsOptions }) {
  return (
    <div className="rounded-xl border border-[#E6E6E6] p-4">
      <SectionTitle title="ODS" subtitle="Selecione os ODS's" />
      <div className="flex flex-wrap gap-2">
        {odsOptions.map((o) => {
          const active = (ods || []).includes(o);
          const cls = active
            ? "bg-[#111827] text-white border-[#111827]"
            : "bg-white text-[#111827] border-[#E5E7EB]";
          return (
            <button
              key={o}
              type="button"
              onClick={() =>
                setState((p) => {
                  const current = Array.isArray(p.ods) ? p.ods : [];
                  const next = active
                    ? current.filter((x) => x !== o)
                    : [...current, o];
                  return { ...p, ods: next };
                })
              }
              className={`h-9 px-3 rounded-full border text-sm font-inter ${cls}`}
            >
              ODS {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

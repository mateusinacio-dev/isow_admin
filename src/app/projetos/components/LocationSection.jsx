import SectionTitle from "./SectionTitle";
import SmallInput from "./SmallInput";

export default function LocationSection({ location, setState, brazilStates }) {
  return (
    <div>
      <SectionTitle
        title="Local do projeto"
        subtitle="Selecione o Estado e depois informe o município"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select
          value={location.uf || ""}
          onChange={(e) =>
            setState((p) => ({
              ...p,
              location: { ...p.location, uf: e.target.value },
            }))
          }
          className="h-10 w-full px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
        >
          <option value="">Estado (UF)</option>
          {brazilStates.map((s) => (
            <option key={s.uf} value={s.uf}>
              {s.name} ({s.uf})
            </option>
          ))}
          <option value="OUTRO">Outro</option>
        </select>

        <SmallInput
          value={location.city}
          onChange={(v) =>
            setState((p) => ({
              ...p,
              location: { ...p.location, city: v },
            }))
          }
          placeholder="Município"
        />
      </div>

      {location.uf === "OUTRO" ? (
        <div className="mt-2">
          <SmallInput
            value={location.ufOther || ""}
            onChange={(v) =>
              setState((p) => ({
                ...p,
                location: { ...p.location, ufOther: v },
              }))
            }
            placeholder="Digite o Estado"
          />
        </div>
      ) : null}
    </div>
  );
}

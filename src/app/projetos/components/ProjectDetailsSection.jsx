import SmallInput from "./SmallInput";

export default function ProjectDetailsSection({ state, setState }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
            Duração (meses)
          </div>
          <SmallInput
            value={state.durationMonths}
            onChange={(v) =>
              setState((p) => ({
                ...p,
                durationMonths: v,
              }))
            }
            placeholder="Ex: 24"
            type="number"
            min={1}
            max={120}
          />
        </div>

        <div>
          <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
            Beneficiários diretos
          </div>
          <SmallInput
            value={state.beneficiariesDirect}
            onChange={(v) =>
              setState((p) => ({
                ...p,
                beneficiariesDirect: v,
              }))
            }
            placeholder="Ex: 120"
            type="number"
            min={0}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
          Perfil dos beneficiários (opcional, máx 300)
        </div>
        <textarea
          value={state.beneficiariesProfile}
          onChange={(e) =>
            setState((p) => ({
              ...p,
              beneficiariesProfile: e.target.value,
            }))
          }
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
        />
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
          Justificativa (opcional, máx 5.000)
        </div>
        <textarea
          value={state.justification}
          onChange={(e) =>
            setState((p) => ({
              ...p,
              justification: e.target.value,
            }))
          }
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
        />
      </div>
    </div>
  );
}

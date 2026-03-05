import { useState } from "react";
import {
  buildDefaultBenefitsCategory,
  buildDefaultContinuousCategory,
} from "../utils/programConfigParser";

export function ModalitySelector({ state, setState, helpText }) {
  const [showModalityHelp, setShowModalityHelp] = useState(false);

  return (
    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="text-sm font-semibold font-inter text-[#111827]">
            Selecionar modalidade
          </div>
          <button
            type="button"
            onClick={() => setShowModalityHelp((v) => !v)}
            className="h-6 w-6 rounded-full border border-[#E5E7EB] text-xs font-inter text-[#111827]"
            title="Ver explicação"
          >
            ?
          </button>
        </div>

        {showModalityHelp ? (
          <div className="mb-3 text-xs text-[#6B7280] font-inter">
            {helpText}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-inter">
            <input
              type="radio"
              checked={state.kind === "BENEFITS"}
              onChange={() =>
                setState((prev) => ({
                  ...prev,
                  kind: "BENEFITS",
                  categories: [buildDefaultBenefitsCategory()],
                }))
              }
            />
            Programa com benefícios
          </label>
          <label className="flex items-center gap-2 text-sm font-inter">
            <input
              type="radio"
              checked={state.kind === "CONTINUOUS"}
              onChange={() =>
                setState((prev) => ({
                  ...prev,
                  kind: "CONTINUOUS",
                  categories: [buildDefaultContinuousCategory()],
                }))
              }
            />
            Campanha contínua
          </label>
        </div>
      </div>
    </div>
  );
}

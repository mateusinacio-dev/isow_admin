import { Card } from "./FormCard";
import { Field } from "./FormField";
import { TextInput, TextArea, RadioPill } from "./FormInputs";

export function AdditionalInfoSection({ state, setState }) {
  return (
    <Card title="Informações adicionais">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Idade mínima">
          <div className="flex items-center gap-2 flex-wrap">
            <RadioPill
              checked={!state.minAgeEnabled}
              label="Não"
              onClick={() =>
                setState((p) => ({ ...p, minAgeEnabled: false, minAge: "" }))
              }
            />
            <RadioPill
              checked={state.minAgeEnabled}
              label="Sim"
              onClick={() => setState((p) => ({ ...p, minAgeEnabled: true }))}
            />
            {state.minAgeEnabled ? (
              <div className="w-[140px]">
                <TextInput
                  inputMode="numeric"
                  value={state.minAge}
                  onChange={(e) =>
                    setState((p) => ({
                      ...p,
                      minAge: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="Ex: 18"
                />
              </div>
            ) : null}
          </div>
        </Field>

        <Field label="Início do check-in (opcional)">
          <TextInput
            type="time"
            value={state.checkInStartTime}
            onChange={(e) =>
              setState((p) => ({ ...p, checkInStartTime: e.target.value }))
            }
          />
        </Field>

        <Field label="Estacionamento">
          <div className="flex items-center gap-2 flex-wrap">
            <RadioPill
              checked={!state.parkingEnabled}
              label="Não"
              onClick={() =>
                setState((p) => ({
                  ...p,
                  parkingEnabled: false,
                  parkingLotsText: "",
                }))
              }
            />
            <RadioPill
              checked={state.parkingEnabled}
              label="Sim"
              onClick={() => setState((p) => ({ ...p, parkingEnabled: true }))}
            />
            {state.parkingEnabled ? (
              <select
                value={state.parkingType}
                onChange={(e) =>
                  setState((p) => ({ ...p, parkingType: e.target.value }))
                }
                className="h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm font-inter"
              >
                <option value="FREE">Gratuito</option>
                <option value="PAID">Pago</option>
              </select>
            ) : null}
          </div>
        </Field>

        {state.parkingEnabled ? (
          <Field
            label="Estacionamentos (nomes e endereços)"
            hint="Por enquanto é texto livre (uma linha por estacionamento)."
          >
            <TextArea
              value={state.parkingLotsText}
              onChange={(e) =>
                setState((p) => ({ ...p, parkingLotsText: e.target.value }))
              }
              placeholder="Estacionamento A — Rua X, 123&#10;Estacionamento B — Rua Y, 456"
            />
          </Field>
        ) : (
          <div />
        )}
      </div>
    </Card>
  );
}

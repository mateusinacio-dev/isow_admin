import { Card } from "./FormCard";
import { Field } from "./FormField";
import { TextInput } from "./FormInputs";

export function LocationSection({ state, setState }) {
  return (
    <Card title="Local">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome do local">
          <TextInput
            value={state.placeName}
            onChange={(e) =>
              setState((p) => ({ ...p, placeName: e.target.value }))
            }
            placeholder="Ex: Auditório BTG"
          />
        </Field>
        <Field label="Endereço">
          <TextInput
            value={state.street}
            onChange={(e) =>
              setState((p) => ({ ...p, street: e.target.value }))
            }
            placeholder="Rua, avenida…"
          />
        </Field>
        <Field label="Número">
          <TextInput
            value={state.streetNumber}
            onChange={(e) =>
              setState((p) => ({ ...p, streetNumber: e.target.value }))
            }
            placeholder="123"
          />
        </Field>
        <Field label="Cidade">
          <TextInput
            value={state.city}
            onChange={(e) => setState((p) => ({ ...p, city: e.target.value }))}
            placeholder="São Paulo"
          />
        </Field>
        <Field label="Estado (UF)">
          <TextInput
            value={state.stateCode}
            onChange={(e) =>
              setState((p) => ({ ...p, stateCode: e.target.value }))
            }
            placeholder="SP"
          />
        </Field>
      </div>
    </Card>
  );
}

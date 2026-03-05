import { Card } from "./FormCard";
import { Field } from "./FormField";
import { TextInput } from "./FormInputs";

export function DateTimeSection({ state, setState }) {
  return (
    <Card title="Data e hora">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Data de início">
          <TextInput
            type="date"
            value={state.startDate}
            onChange={(e) =>
              setState((p) => ({ ...p, startDate: e.target.value }))
            }
          />
        </Field>
        <Field label="Hora de início">
          <TextInput
            type="time"
            value={state.startTime}
            onChange={(e) =>
              setState((p) => ({ ...p, startTime: e.target.value }))
            }
          />
        </Field>
        <Field label="Data final">
          <TextInput
            type="date"
            value={state.endDate}
            onChange={(e) =>
              setState((p) => ({ ...p, endDate: e.target.value }))
            }
          />
        </Field>
        <Field label="Hora de encerramento">
          <TextInput
            type="time"
            value={state.endTime}
            onChange={(e) =>
              setState((p) => ({ ...p, endTime: e.target.value }))
            }
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Data de publicação">
          <TextInput
            type="date"
            value={state.publishingDate}
            onChange={(e) =>
              setState((p) => ({ ...p, publishingDate: e.target.value }))
            }
          />
        </Field>
        <Field label="Hora de publicação (opcional)">
          <TextInput
            type="time"
            value={state.publishingTime}
            onChange={(e) =>
              setState((p) => ({ ...p, publishingTime: e.target.value }))
            }
          />
        </Field>
      </div>
    </Card>
  );
}

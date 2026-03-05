import { Card } from "./FormCard";
import { Field } from "./FormField";

export function ProgramSection({ programs, value, onChange }) {
  return (
    <Card title="Programa (opcional)">
      <Field
        label="Relacionar com um Programa"
        hint="Se você selecionar um Programa, o evento vira privado e gratuito automaticamente."
      >
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 px-3 w-full rounded-lg border border-[#E5E7EB] bg-white text-sm font-inter"
        >
          <option value="">Sem programa</option>
          {programs.map((p) => (
            <option key={p.eventId} value={p.eventId}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
    </Card>
  );
}

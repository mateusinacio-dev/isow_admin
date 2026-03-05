import { Card } from "./FormCard";
import { Field } from "./FormField";

export function AgendaSection({ agendaFileUrl, onPickAgendaFile }) {
  return (
    <Card title="Programação (opcional)">
      <Field
        label="Anexar programação do evento"
        hint="PDF, imagem ou doc. (faz upload e salva o link no evento)"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <input type="file" onChange={onPickAgendaFile} />
          {agendaFileUrl ? (
            <a
              href={agendaFileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-inter font-semibold text-[#111827] underline"
            >
              Ver arquivo
            </a>
          ) : null}
        </div>
      </Field>
    </Card>
  );
}

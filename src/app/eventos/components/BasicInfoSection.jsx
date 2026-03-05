import { Card } from "./FormCard";
import { Field } from "./FormField";
import { TextInput, TextArea, RadioPill } from "./FormInputs";

export function BasicInfoSection({
  state,
  setState,
  isProgramLinked,
  uploading,
  onPickLogoFile,
}) {
  return (
    <Card title="Informações básicas">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome do evento">
          <TextInput
            value={state.name}
            onChange={(e) => setState((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ex: Workshop de Impacto"
          />
        </Field>

        <Field
          label="Logo do evento"
          hint="Se não tiver logo, você pode deixar vazio."
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl border border-[#E6E6E6] bg-[#F3F4F6] overflow-hidden flex items-center justify-center">
              {state.logoImageUrl ? (
                <img
                  src={state.logoImageUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs font-inter text-[#6B7280]">logo</div>
              )}
            </div>
            <div className="flex-1">
              <input type="file" accept="image/*" onChange={onPickLogoFile} />
              {uploading ? (
                <div className="text-xs font-inter text-[#6B7280] mt-1">
                  Enviando…
                </div>
              ) : null}
            </div>
          </div>
        </Field>

        <Field label="Descrição (máx. 300 caracteres)">
          <TextArea
            value={state.shortDescription}
            onChange={(e) => {
              const next = e.target.value.slice(0, 300);
              setState((p) => ({ ...p, shortDescription: next }));
            }}
            placeholder="Resumo curto do evento"
          />
          <div className="text-xs font-inter text-[#9CA3AF] mt-1">
            {String(state.shortDescription || "").length}/300
          </div>
        </Field>

        <Field label="Detalhes (opcional)">
          <TextArea
            value={state.longDescription}
            onChange={(e) =>
              setState((p) => ({ ...p, longDescription: e.target.value }))
            }
            placeholder="Texto mais longo, agenda resumida, instruções, etc."
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Público ou privado">
          <div className="flex items-center gap-2 flex-wrap">
            <RadioPill
              checked={state.isPublic}
              label="Público"
              disabled={isProgramLinked}
              onClick={() => setState((p) => ({ ...p, isPublic: true }))}
            />
            <RadioPill
              checked={!state.isPublic}
              label="Privado"
              onClick={() => setState((p) => ({ ...p, isPublic: false }))}
            />
          </div>
        </Field>

        {!state.isPublic ? (
          <Field
            label="Convidar por e-mail (privado)"
            hint="Cole e-mails separados por espaço, vírgula ou quebra de linha."
          >
            <TextArea
              value={state.privateInviteEmails}
              onChange={(e) =>
                setState((p) => ({
                  ...p,
                  privateInviteEmails: e.target.value,
                }))
              }
              placeholder="joao@empresa.com&#10;maria@empresa.com"
            />
          </Field>
        ) : (
          <div />
        )}
      </div>
    </Card>
  );
}

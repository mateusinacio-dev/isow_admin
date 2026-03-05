export function AttachmentSection({ state, setState, onPickAttachment }) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
          Tem anexo?
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-inter">
            <input
              type="checkbox"
              checked={Boolean(state.hasAttachment)}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  hasAttachment: e.target.checked,
                }))
              }
            />
            Sim
          </label>

          {state.hasAttachment ? (
            <label className="inline-flex items-center h-9 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter cursor-pointer">
              Selecionar arquivo
              <input
                type="file"
                className="hidden"
                onChange={onPickAttachment}
              />
            </label>
          ) : null}
        </div>

        {state.hasAttachment ? (
          <div className="text-xs text-[#6B7280] font-inter mt-2">
            {state.attachmentUrl ? (
              <a
                href={state.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Ver anexo
              </a>
            ) : (
              "Nenhum arquivo selecionado"
            )}
          </div>
        ) : null}
      </div>

      <div>
        <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
          Tem número máximo de participantes?
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-inter">
            <input
              type="checkbox"
              checked={Boolean(state.maxParticipantsEnabled)}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  maxParticipantsEnabled: e.target.checked,
                }))
              }
            />
            Sim
          </label>

          {state.maxParticipantsEnabled ? (
            <input
              value={state.maxParticipants}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  maxParticipants: e.target.value.replace(/[^0-9]/g, ""),
                }))
              }
              placeholder="Ex: 300"
              className="h-11 w-[160px] px-4 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
            />
          ) : null}
        </div>
        <div className="text-xs text-[#6B7280] font-inter mt-2">
          Isso limita quantas pessoas podem participar do programa.
        </div>
      </div>
    </div>
  );
}

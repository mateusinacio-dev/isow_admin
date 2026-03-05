export function BasicInfoSection({
  state,
  setState,
  remaining,
  onPickLogoFile,
}) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
          Nome do Programa
        </div>
        <input
          value={state.name}
          onChange={(e) =>
            setState((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Ex: Programa UP"
          className="h-11 w-full px-4 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
        />

        <div className="mt-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border border-[#E5E7EB] bg-[#F3F4F6] overflow-hidden flex items-center justify-center">
            {state.logoImageUrl ? (
              <img
                src={state.logoImageUrl}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xs text-[#6B7280] font-inter">Logo</div>
            )}
          </div>

          <div className="flex-1">
            <div className="text-sm font-semibold font-inter text-[#111827]">
              Logo do Programa
            </div>
            <div className="text-xs text-[#6B7280] font-inter mt-1">
              Use o recorte estilo Instagram para ajustar.
            </div>
            <label className="inline-flex items-center h-9 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter mt-2 cursor-pointer">
              Selecionar imagem
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickLogoFile}
              />
            </label>
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
          Texto (máximo 500 caracteres)
        </div>
        <textarea
          value={state.text}
          onChange={(e) =>
            setState((prev) => ({ ...prev, text: e.target.value }))
          }
          rows={6}
          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
          placeholder="Descreva o programa…"
        />
        <div className="text-xs text-[#6B7280] font-inter mt-1">
          Restam {remaining} caracteres
        </div>
      </div>
    </div>
  );
}

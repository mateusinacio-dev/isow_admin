import SectionTitle from "./SectionTitle";
import MosaicPreview from "./MosaicPreview";

export default function LogoImageSection({
  state,
  setState,
  uploading,
  onPickLogo,
  onAddImages,
  fileInputLogoRef,
  fileInputImagesRef,
  maxProjectImages,
}) {
  return (
    <div>
      <SectionTitle
        title="Logo (ou imagem)"
        subtitle="Com recorte estilo Instagram"
      />

      <div className="flex items-center gap-4">
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

        <div>
          <button
            type="button"
            onClick={onPickLogo}
            disabled={uploading}
            className="h-10 px-4 rounded-lg bg-black text-white text-sm font-inter disabled:opacity-60"
          >
            {uploading ? "Enviando…" : "Selecionar logo"}
          </button>
          <div className="text-[11px] text-[#6B7280] font-inter mt-1">
            Ajuste o enquadramento antes de salvar.
          </div>
        </div>
      </div>

      <input
        ref={fileInputLogoRef}
        type="file"
        accept="image/*"
        className="hidden"
      />

      <div className="mt-6">
        <SectionTitle
          title="Imagens associadas ao projeto (opcional)"
          subtitle={`Máximo ${maxProjectImages} imagens (vira um mosaico)`}
        />

        <div className="flex items-center gap-4">
          <MosaicPreview urls={state.images} />

          <div className="flex-1">
            <button
              type="button"
              onClick={onAddImages}
              disabled={
                uploading || (state.images || []).length >= maxProjectImages
              }
              className="h-10 px-4 rounded-lg border border-[#E5E7EB] text-sm font-inter disabled:opacity-60"
            >
              Adicionar imagens
            </button>

            {(state.images || []).length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {(state.images || []).map((u, idx) => (
                  <button
                    key={u + idx}
                    type="button"
                    onClick={() =>
                      setState((p) => ({
                        ...p,
                        images: (p.images || []).filter((_, i) => i !== idx),
                      }))
                    }
                    className="text-xs font-inter text-red-600 hover:underline"
                  >
                    Remover {idx + 1}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <input
          ref={fileInputImagesRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>
    </div>
  );
}

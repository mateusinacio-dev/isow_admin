const MAX_PROJECT_IMAGES = 4;

export default function MosaicPreview({ urls }) {
  const safeUrls = Array.isArray(urls) ? urls : [];
  const cells = safeUrls.slice(0, MAX_PROJECT_IMAGES);

  if (cells.length === 0) {
    return (
      <div className="w-40 h-28 rounded-xl border border-[#E6E6E6] bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-[11px] text-[#6B7280] font-inter">Sem imagens</div>
      </div>
    );
  }

  const gridCols = cells.length <= 2 ? 2 : 2;

  return (
    <div
      className="w-40 h-28 rounded-xl border border-[#E6E6E6] bg-[#F3F4F6] overflow-hidden grid"
      style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
    >
      {cells.map((u, idx) => {
        return (
          <div key={u + idx} className="w-full h-full">
            <img src={u} alt="Imagem" className="w-full h-full object-cover" />
          </div>
        );
      })}
    </div>
  );
}

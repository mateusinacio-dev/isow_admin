export function LogoUploadSection({
  logoImageUrl,
  uploading,
  handlePickLogo,
  fileInputRef,
  setCropFile,
  setCropOpen,
}) {
  return (
    <div className="md:col-span-2">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl border border-[#E6E6E6] bg-[#F3F4F6] overflow-hidden flex items-center justify-center">
          {logoImageUrl ? (
            <img
              src={logoImageUrl}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-[11px] text-[#6B7280] font-inter">
              Sem logo
            </div>
          )}
        </div>
        <div>
          <button
            className="h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 disabled:opacity-60"
            onClick={handlePickLogo}
            disabled={uploading}
          >
            {uploading ? "Enviando…" : "Enviar logo"}
          </button>
          <div className="text-[11px] text-[#6B7280] font-inter mt-1">
            Com recorte estilo Instagram.
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          if (f) {
            setCropFile(f);
            setCropOpen(true);
          }
        }}
      />
    </div>
  );
}

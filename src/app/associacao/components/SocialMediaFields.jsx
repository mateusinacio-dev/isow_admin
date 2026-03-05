export function SocialMediaFields({ form, setForm }) {
  return (
    <>
      <div className="md:col-span-2">
        <div className="text-sm font-semibold font-inter text-[#111827] mt-2">
          Redes sociais (opcional)
        </div>
      </div>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Instagram (opcional)</div>
        <input
          className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E6E6E6]"
          value={form.instagram}
          onChange={(e) =>
            setForm((p) => ({ ...p, instagram: e.target.value }))
          }
        />
      </label>

      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Facebook (opcional)</div>
        <input
          className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E6E6E6]"
          value={form.facebook}
          onChange={(e) => setForm((p) => ({ ...p, facebook: e.target.value }))}
        />
      </label>

      <label className="text-sm font-inter md:col-span-2">
        <div className="text-xs text-[#6B7280]">LinkedIn (opcional)</div>
        <input
          className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E6E6E6]"
          value={form.linkedin}
          onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))}
        />
      </label>
    </>
  );
}

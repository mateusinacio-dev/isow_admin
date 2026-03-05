export default function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-3">
      <div className="text-sm font-semibold font-inter text-[#111827]">
        {title}
      </div>
      {subtitle ? (
        <div className="text-xs text-[#6B7280] font-inter mt-1">{subtitle}</div>
      ) : null}
    </div>
  );
}

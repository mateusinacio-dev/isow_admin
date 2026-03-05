export function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs font-semibold text-[#6B7280] font-inter">
        {label}
      </div>
      {hint ? (
        <div className="text-[12px] text-[#9CA3AF] font-inter mt-1">{hint}</div>
      ) : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

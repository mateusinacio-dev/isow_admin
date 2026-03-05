export default function SmallInput({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  step,
}) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      min={min}
      max={max}
      step={step}
      className="h-10 w-full px-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
    />
  );
}

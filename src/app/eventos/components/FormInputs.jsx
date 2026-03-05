export function TextInput(props) {
  const isDateOrTime = props.type === "date" || props.type === "time";
  const nextProps = {
    ...props,
    ...(isDateOrTime ? { lang: props.lang || "pt-BR" } : {}),
    ...(props.type === "time" && props.step == null ? { step: 60 } : {}),
  };

  return (
    <input
      {...nextProps}
      className={`h-10 px-3 w-full rounded-lg border border-[#E5E7EB] bg-white text-sm font-inter outline-none focus:ring-2 focus:ring-black/10 ${
        props.className || ""
      }`}
    />
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`min-h-[92px] p-3 w-full rounded-lg border border-[#E5E7EB] bg-white text-sm font-inter outline-none focus:ring-2 focus:ring-black/10 ${
        props.className || ""
      }`}
    />
  );
}

export function RadioPill({ checked, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-10 px-4 rounded-full border text-sm font-semibold font-inter transition-all duration-150 active:scale-95 ${
        checked
          ? "border-black bg-black text-white"
          : "border-[#E6E6E6] bg-white text-[#111827] hover:bg-[#F9FAFB]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {label}
    </button>
  );
}

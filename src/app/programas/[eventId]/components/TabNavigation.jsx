export function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        const activeClass = isActive
          ? "bg-[#111827] text-white border-[#111827]"
          : "bg-white text-[#111827] border-[#E5E7EB]";

        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`h-9 px-4 rounded-full border text-sm font-inter ${activeClass}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

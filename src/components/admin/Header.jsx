import { useMemo } from "react";
import { Menu, Search } from "lucide-react";
import OrganizationPicker from "./OrganizationPicker";

export default function Header({
  title,
  subtitle,
  onMenuClick,
  onOrgChange,
  lockedOrganizationId,
}) {
  const heading = useMemo(() => {
    return {
      title: title || "Dashboard",
      subtitle: subtitle || null,
    };
  }, [subtitle, title]);

  return (
    <div className="h-16 bg-[#F3F3F3] flex items-center justify-between px-4 md:px-6 border-b border-[#E4E4E4] flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg transition-all duration-150 hover:bg-white/70 active:bg-white/90 active:scale-95"
          aria-label="Abrir menu"
        >
          <Menu size={20} className="text-[#4B4B4B]" />
        </button>

        <div className="min-w-0">
          <div className="text-lg md:text-xl font-bold text-black tracking-tight font-inter truncate">
            {heading.title}
          </div>
          {heading.subtitle ? (
            <div className="text-[12px] text-[#6B7280] font-inter truncate">
              {heading.subtitle}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-[#E5E5E5]">
          <Search size={16} className="text-[#6E6E6E]" />
          <input
            placeholder="Buscar (em breve)"
            className="w-[220px] text-sm font-inter outline-none"
            disabled
          />
        </div>

        <OrganizationPicker
          onChange={onOrgChange}
          lockedOrganizationId={lockedOrganizationId}
        />
      </div>
    </div>
  );
}

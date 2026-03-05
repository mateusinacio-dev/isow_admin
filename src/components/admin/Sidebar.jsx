import {
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Coins,
  Sparkles,
  FileText,
  LogOut,
  FolderKanban,
  Truck,
  MessageSquare,
} from "lucide-react";

export default function Sidebar({ onClose }) {
  const items = [
    { name: "Home", href: "/", icon: LayoutDashboard },
    { name: "Programas", href: "/programas", icon: Sparkles },
    { name: "Eventos", href: "/eventos", icon: CalendarDays },
    { name: "Projetos", href: "/projetos", icon: FolderKanban },
    { name: "Fornecedores", href: "/fornecedores", icon: Truck },
    { name: "Voluntariado", href: "/voluntariado", icon: Briefcase },
    { name: "Publicações", href: "/publicacoes", icon: MessageSquare },
    { name: "Financeiro", href: "/financeiro", icon: Coins },
    { name: "Documentos", href: "/associacao", icon: FileText },
    // antes era "/sair" (2 telas e 2 cliques). Agora vai direto pro logout.
    { name: "Sair", href: "/account/logout", icon: LogOut },
  ];

  return (
    <div className="w-60 bg-[#F3F3F3] border-r border-[#E4E4E4] flex-shrink-0 flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full border border-[#E4E4E4] flex items-center justify-center">
            <div className="w-6 h-6 bg-black rounded-full opacity-70" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#111827] font-inter truncate">
              ISOW Admin
            </div>
            <div className="text-[11px] text-[#6B7280] font-inter truncate">
              Painel da ONG
            </div>
          </div>
        </div>

        <button
          className="lg:hidden text-sm text-[#6B7280] hover:text-black"
          onClick={onClose}
        >
          Fechar
        </button>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (onClose) {
                    onClose();
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-black/70 hover:text-black hover:bg-white/60 active:bg-white/80 active:scale-[0.98]"
              >
                <Icon size={18} className="text-black/70" />
                <span className="font-medium text-sm font-inter">
                  {item.name}
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      <div className="p-4">
        <div className="text-[11px] text-[#6B7280] font-inter">
          Gestão da ONG
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import AdminShell from "../../components/admin/AdminShell";

export default function SairPage() {
  // Compatibilidade com links antigos: /sair agora faz logout automático.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.href = "/account/logout";
  }, []);

  return (
    <AdminShell title="Saindo" subtitle="Sessão">
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
        <div className="text-lg font-semibold font-inter text-[#111827]">
          Saindo…
        </div>
        <div className="text-sm text-[#6B7280] font-inter mt-2">
          Você será desconectado do painel.
        </div>

        <a
          href="/account/logout"
          className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 mt-4"
        >
          Se não redirecionar, clique aqui
        </a>
      </div>
    </AdminShell>
  );
}

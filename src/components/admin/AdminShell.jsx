import { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useUser from "@/utils/useUser";

export default function AdminShell({
  title,
  subtitle,
  children,
  onOrgChange,
  lockedOrganizationId,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: user, loading: userLoading } = useUser();

  const heading = useMemo(() => {
    return {
      title: title || "Dashboard",
      subtitle: subtitle || null,
    };
  }, [subtitle, title]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center p-4">
        <div className="text-sm font-inter text-[#6B7280]">Carregando…</div>
      </div>
    );
  }

  if (!user) {
    const callbackUrl =
      typeof window !== "undefined" ? window.location.pathname : "/";

    return (
      <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-[#E6E6E6] rounded-2xl p-6 md:p-8">
          <div className="text-xl font-bold font-inter text-[#111827]">
            Entrar
          </div>
          <div className="text-sm text-[#6B7280] font-inter mt-1">
            Para acessar o painel da ONG, você precisa entrar com uma conta.
          </div>

          <div className="mt-6 space-y-3">
            <a
              href={`/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="w-full h-11 rounded-lg bg-black text-white text-sm font-semibold font-inter hover:bg-black/90 inline-flex items-center justify-center"
            >
              Entrar
            </a>
            <a
              href={`/account/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="w-full h-11 rounded-lg border border-[#E6E6E6] text-[#111827] text-sm font-semibold font-inter hover:bg-[#F9FAFB] inline-flex items-center justify-center"
            >
              Criar conta
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F3F3] text-black">
      {sidebarOpen ? (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={heading.title}
          subtitle={heading.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
          onOrgChange={onOrgChange}
          lockedOrganizationId={lockedOrganizationId}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

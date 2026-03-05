import { useCallback, useEffect, useRef, useState } from "react";
import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasTriggeredRef = useRef(false);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Evita navegação extra/duplicada: faz o signOut via request e redireciona 1x.
      const result = await signOut({
        callbackUrl: "/account/signin",
        redirect: false,
      });

      const nextUrl = result?.url || "/account/signin";
      if (typeof window !== "undefined") {
        window.location.href = nextUrl;
      }
    } catch (e) {
      console.error(e);
      setError("Não foi possível sair. Tente novamente.");
      setLoading(false);
    }
  }, [signOut]);

  // Logout automático (1 clique no menu). Em dev/strict mode, useEffect pode rodar 2x.
  useEffect(() => {
    if (hasTriggeredRef.current) {
      return;
    }
    hasTriggeredRef.current = true;
    handleSignOut();
  }, [handleSignOut]);

  return (
    <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E6E6E6] rounded-2xl p-6 md:p-8">
        <div className="text-xl font-bold font-inter text-[#111827]">
          Saindo…
        </div>
        <div className="text-sm text-[#6B7280] font-inter mt-1">
          {error ? error : "Você será desconectado do painel."}
        </div>

        <div className="mt-6 w-full h-11 rounded-lg bg-black text-white text-sm font-semibold font-inter flex items-center justify-center opacity-80">
          {loading ? "Saindo…" : "Preparando"}
        </div>

        {error ? (
          <button
            onClick={handleSignOut}
            className="mt-3 w-full h-11 rounded-lg bg-black text-white text-sm font-semibold font-inter hover:bg-black/90"
          >
            Tentar novamente
          </button>
        ) : null}

        <a
          href="/"
          className="mt-3 inline-flex w-full h-11 items-center justify-center rounded-lg border border-[#E6E6E6] text-sm font-semibold font-inter text-[#111827] hover:bg-[#F9FAFB]"
        >
          Voltar
        </a>
      </div>
    </div>
  );
}

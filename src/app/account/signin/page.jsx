import { useCallback, useMemo, useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignInPage() {
  const { signInWithCredentials } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callbackUrl = useMemo(() => {
    // If a callbackUrl was explicitly provided (e.g. from a deep link or the mobile auth flow), respect it.
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      const cb = params.get("callbackUrl");
      if (cb && typeof cb === "string") {
        return cb;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  const canSubmit = useMemo(() => {
    return Boolean(email.trim()) && Boolean(password) && !loading;
  }, [email, loading, password]);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const result = await signInWithCredentials({
          email: email.trim(),
          password,
          // We'll redirect manually so we can decide where to send the user.
          redirect: false,
          callbackUrl: callbackUrl || "/",
        });

        if (!result || result.error) {
          throw new Error(result?.error || "CredentialsSignin");
        }

        // If a callbackUrl was provided, always respect it.
        if (callbackUrl) {
          window.location.assign(callbackUrl);
          return;
        }

        // No callbackUrl: if the user has no ONG linked yet, take them straight to the NGO registration.
        const response = await fetch("/api/admin/organizations");
        if (!response.ok) {
          console.error(
            `When fetching /api/admin/organizations, the response was [${response.status}] ${response.statusText}`,
          );
          // Fallback: we at least got the user signed in.
          window.location.assign("/");
          return;
        }
        const data = await response.json();
        const orgCount = Array.isArray(data?.organizations)
          ? data.organizations.length
          : 0;

        if (orgCount === 0) {
          window.location.assign("/associacao/nova");
          return;
        }

        window.location.assign("/");
      } catch (err) {
        console.error(err);
        setError("Não foi possível entrar. Verifique seu email e senha.");
        setLoading(false);
      }
    },
    [callbackUrl, email, password, signInWithCredentials],
  );

  return (
    <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center p-4">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white border border-[#E6E6E6] rounded-2xl p-6 md:p-8"
      >
        <div className="text-xl font-bold font-inter text-[#111827]">
          Entrar
        </div>
        <div className="text-sm text-[#6B7280] font-inter mt-1">
          Acesse o painel da ONG.
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <div className="text-xs text-[#6B7280] font-inter">Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-11 px-3 rounded-lg border border-[#E6E6E6] font-inter outline-none focus:border-black"
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <div className="text-xs text-[#6B7280] font-inter">Senha</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full h-11 px-3 rounded-lg border border-[#E6E6E6] font-inter outline-none focus:border-black"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-inter">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-11 rounded-lg bg-black text-white text-sm font-semibold font-inter hover:bg-black/90 disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <div className="text-sm font-inter text-[#6B7280] text-center">
            Não tem conta?{" "}
            <a
              href={`/account/signup${
                typeof window !== "undefined" ? window.location.search : ""
              }`}
              className="text-black underline"
            >
              Criar agora
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}

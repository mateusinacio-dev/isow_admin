import { useCallback, useMemo, useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignUpPage() {
  const { signUpWithCredentials } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callbackUrl = useMemo(() => {
    // After creating an account, we want to take the user straight to the NGO registration.
    // If a callbackUrl was explicitly provided (e.g. from a deep link), respect it.
    if (typeof window === "undefined") {
      return "/associacao/nova";
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
    return "/associacao/nova";
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
        await signUpWithCredentials({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
          callbackUrl,
          redirect: true,
        });
      } catch (err) {
        console.error(err);
        setError(
          "Não foi possível criar sua conta. Talvez esse email já esteja cadastrado.",
        );
        setLoading(false);
      }
    },
    [callbackUrl, email, name, password, signUpWithCredentials],
  );

  return (
    <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center p-4">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white border border-[#E6E6E6] rounded-2xl p-6 md:p-8"
      >
        <div className="text-xl font-bold font-inter text-[#111827]">
          Criar conta
        </div>
        <div className="text-sm text-[#6B7280] font-inter mt-1">
          Ao finalizar, você já vai para o cadastro da sua ONG.
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <div className="text-xs text-[#6B7280] font-inter">Nome</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full h-11 px-3 rounded-lg border border-[#E6E6E6] font-inter outline-none focus:border-black"
              placeholder="Seu nome"
              autoComplete="name"
            />
          </label>

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
              placeholder="Crie uma senha"
              autoComplete="new-password"
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
            {loading ? "Criando…" : "Criar conta"}
          </button>

          <div className="text-sm font-inter text-[#6B7280] text-center">
            Já tem conta?{" "}
            <a
              href={`/account/signin${
                typeof window !== "undefined" ? window.location.search : ""
              }`}
              className="text-black underline"
            >
              Entrar
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}

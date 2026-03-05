import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

async function createOrganization(payload) {
  const response = await fetch("/api/admin/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(
      `When posting /api/admin/organizations, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export default function NovaAssociacaoPage() {
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [error, setError] = useState(null);
  const [showValidation, setShowValidation] = useState(false);

  const cnpjDigits = useMemo(() => normalizeDigits(cnpj), [cnpj]);

  const fieldErrors = useMemo(() => {
    if (!showValidation) {
      return {};
    }

    const next = {};
    if (!legalName.trim()) next.legalName = "Obrigatório";
    if (!tradeName.trim()) next.tradeName = "Obrigatório";
    if (!cnpj.trim()) next.cnpj = "Obrigatório";
    if (cnpj.trim() && cnpjDigits.length !== 14) next.cnpj = "CNPJ inválido";

    return next;
  }, [cnpj, cnpjDigits.length, legalName, showValidation, tradeName]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(legalName.trim()) &&
      Boolean(tradeName.trim()) &&
      Boolean(cnpj.trim()) &&
      cnpjDigits.length === 14
    );
  }, [cnpj, cnpjDigits.length, legalName, tradeName]);

  const mutation = useMutation({
    mutationFn: (payload) => createOrganization(payload),
    onSuccess: (data) => {
      const organizationId = data?.organization?.organizationId;
      if (typeof window !== "undefined" && organizationId) {
        try {
          window.localStorage.setItem(
            "admin:selectedOrganizationId",
            organizationId,
          );
        } catch {
          // ignore
        }
        window.location.href = "/associacao";
      }
    },
    onError: (e) => {
      console.error(e);
      setError(
        "Não foi possível criar a ONG. Confira os dados e tente novamente.",
      );
    },
  });

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);
      setShowValidation(true);

      if (!canSubmit) {
        setError("Preencha os campos obrigatórios.");
        return;
      }

      mutation.mutate({
        legalName: legalName.trim(),
        tradeName: tradeName.trim(),
        legalIdNumber: cnpj.trim(),
      });
    },
    [canSubmit, cnpj, legalName, mutation, tradeName],
  );

  const baseInputClass = "mt-1 w-full h-10 px-3 rounded-lg border";

  const legalNameClass = `${baseInputClass} ${
    fieldErrors.legalName ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const tradeNameClass = `${baseInputClass} ${
    fieldErrors.tradeName ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const cnpjClass = `${baseInputClass} ${
    fieldErrors.cnpj ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const submitDisabled = mutation.isPending;
  const submitClassBase =
    "h-10 px-4 rounded-lg bg-black text-white text-sm font-semibold font-inter hover:bg-black/90 disabled:opacity-60";
  const submitClass = canSubmit
    ? submitClassBase
    : `${submitClassBase} opacity-60`;

  return (
    <AdminShell title="Cadastrar nova ONG" subtitle="Cadastro inicial">
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6 max-w-2xl">
        <div className="text-lg font-semibold font-inter text-[#111827]">
          Nova associação
        </div>
        <div className="text-xs text-[#6B7280] font-inter mt-1">
          Depois você completa documentos e certidões.
        </div>

        {error ? (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-inter">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-4">
          <label className="text-sm font-inter">
            <div className="text-xs text-[#6B7280]">Razão social *</div>
            <input
              className={legalNameClass}
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Nome completo"
              required
            />
            {fieldErrors.legalName ? (
              <div className="text-[11px] font-inter text-red-600 mt-1">
                {fieldErrors.legalName}
              </div>
            ) : null}
          </label>

          <label className="text-sm font-inter">
            <div className="text-xs text-[#6B7280]">Nome fantasia *</div>
            <input
              className={tradeNameClass}
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="Como as pessoas conhecem a ONG"
              required
            />
            {fieldErrors.tradeName ? (
              <div className="text-[11px] font-inter text-red-600 mt-1">
                {fieldErrors.tradeName}
              </div>
            ) : null}
          </label>

          <label className="text-sm font-inter">
            <div className="text-xs text-[#6B7280]">CNPJ *</div>
            <input
              className={cnpjClass}
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              required
            />
            {fieldErrors.cnpj ? (
              <div className="text-[11px] font-inter text-red-600 mt-1">
                {fieldErrors.cnpj}
              </div>
            ) : null}
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <a
              href="/"
              className="h-10 px-4 rounded-lg border border-[#E6E6E6] text-sm font-semibold font-inter text-[#111827] hover:bg-[#F9FAFB] inline-flex items-center"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={submitDisabled}
              className={submitClass}
            >
              {mutation.isPending ? "Criando…" : "Criar ONG"}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}

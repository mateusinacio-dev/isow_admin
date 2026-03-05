import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AdminShell from "../../../components/admin/AdminShell";
import { createOrLinkSupplier } from "../services/supplierApi";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

function normalizeDoc(v) {
  return String(v || "")
    .trim()
    .replace(/[^0-9]/g, "");
}

export default function NovoFornecedorPage() {
  const qc = useQueryClient();
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const [form, setForm] = useState({
    documentType: "",
    documentNumber: "",
    legalName: "",
    tradeName: "",
    email: "",
    phone: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const docDigits = useMemo(() => {
    return normalizeDoc(form.documentNumber);
  }, [form.documentNumber]);

  const inferredType = useMemo(() => {
    if (!docDigits) {
      return "";
    }
    return docDigits.length > 11 ? "CNPJ" : "CPF";
  }, [docDigits]);

  const mutation = useMutation({
    mutationFn: async () => {
      return createOrLinkSupplier(organizationId, {
        documentType: form.documentType || inferredType || undefined,
        documentNumber: form.documentNumber,
        legalName: form.legalName,
        tradeName: form.tradeName,
        email: form.email,
        phone: form.phone,
      });
    },
    onSuccess: async () => {
      setError(null);
      setSuccess(
        "Fornecedor salvo e vinculado à ONG. (Se já existia na base, apenas vinculamos.)",
      );
      await qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "suppliers"],
      });
      if (typeof window !== "undefined") {
        window.location.href = "/fornecedores";
      }
    },
    onError: (e) => {
      console.error(e);
      setSuccess(null);
      setError("Não foi possível salvar o fornecedor.");
    },
  });

  const canSave = Boolean(docDigits) && !mutation.isPending;

  return (
    <AdminShell
      title="Cadastrar fornecedor"
      subtitle="CPF/CNPJ"
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      <div className="space-y-6">
        <a
          href="/fornecedores"
          className="text-sm font-inter text-[#374151] hover:underline"
        >
          ← Voltar para Fornecedores
        </a>

        {error ? (
          <div className="bg-white border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-700 font-inter">{error}</div>
          </div>
        ) : null}

        {success ? (
          <div className="bg-white border border-emerald-200 rounded-xl p-4">
            <div className="text-sm text-emerald-800 font-inter">{success}</div>
          </div>
        ) : null}

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="text-lg font-semibold font-inter text-[#111827]">
            Dados do fornecedor
          </div>
          <div className="text-xs text-[#6B7280] font-inter mt-1">
            Se o CPF/CNPJ já existir na base iSOW, a gente só vincula à sua ONG.
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-inter">
              <div className="text-xs text-[#6B7280]">Tipo (opcional)</div>
              <select
                value={form.documentType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, documentType: e.target.value }))
                }
                className="mt-1 w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-inter outline-none"
              >
                <option value="">Auto ({inferredType || "–"})</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </label>

            <label className="text-sm font-inter">
              <div className="text-xs text-[#6B7280]">CPF/CNPJ *</div>
              <input
                value={form.documentNumber}
                onChange={(e) =>
                  setForm((p) => ({ ...p, documentNumber: e.target.value }))
                }
                placeholder="Digite apenas números (ou cole com máscara)"
                className="mt-1 w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-inter outline-none"
              />
              <div className="text-[11px] text-[#6B7280] font-inter mt-1">
                Detectado: {inferredType || "–"} • Dígitos: {docDigits || "–"}
              </div>
            </label>

            <label className="text-sm font-inter md:col-span-2">
              <div className="text-xs text-[#6B7280]">Nome / Razão social</div>
              <input
                value={form.legalName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, legalName: e.target.value }))
                }
                className="mt-1 w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-inter outline-none"
              />
            </label>

            <label className="text-sm font-inter md:col-span-2">
              <div className="text-xs text-[#6B7280]">
                Nome fantasia (opcional)
              </div>
              <input
                value={form.tradeName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tradeName: e.target.value }))
                }
                className="mt-1 w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-inter outline-none"
              />
            </label>

            <label className="text-sm font-inter">
              <div className="text-xs text-[#6B7280]">E-mail</div>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                className="mt-1 w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-inter outline-none"
              />
            </label>

            <label className="text-sm font-inter">
              <div className="text-xs text-[#6B7280]">Telefone</div>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="mt-1 w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-inter outline-none"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              className="h-10 px-4 rounded-xl border border-[#E5E7EB] text-sm font-inter"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/fornecedores";
                }
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canSave}
              className="h-10 px-4 rounded-xl bg-black text-white text-sm font-inter disabled:opacity-60"
              onClick={() => {
                setError(null);
                setSuccess(null);
                if (!docDigits) {
                  setError("Informe um CPF/CNPJ válido.");
                  return;
                }
                mutation.mutate();
              }}
            >
              {mutation.isPending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

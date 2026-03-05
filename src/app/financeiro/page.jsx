import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminShell from "../../components/admin/AdminShell";

async function fetchBankAccount(organizationId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/bank-account`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/bank-account, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

async function patchBankAccount({ organizationId, payload }) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/bank-account`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      `When patching /api/admin/organizations/${organizationId}/bank-account, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export default function FinanceiroPage() {
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || null);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "org", organizationId, "bankAccount"],
    queryFn: () => fetchBankAccount(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });

  const wallet = data?.wallet || null;

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!wallet) {
      setForm(null);
      return;
    }
    setForm({
      bankName: wallet.bankName || "",
      bankNumber: wallet.bankNumber || "",
      bankBranchNumber: wallet.bankBranchNumber || "",
      bankAccountNumber: wallet.bankAccountNumber || "",
      pixKey: wallet.pixKey ? JSON.stringify(wallet.pixKey, null, 2) : "",
    });
  }, [wallet]);

  const mutation = useMutation({
    mutationFn: (payload) => patchBankAccount({ organizationId, payload }),
    onSuccess: () => {
      setSuccess("Conta bancária atualizada.");
      setError(null);
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "bankAccount"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "dashboard"],
      });
    },
    onError: (e) => {
      console.error(e);
      setError("Não foi possível atualizar.");
      setSuccess(null);
    },
  });

  const subtitle = useMemo(() => {
    if (isLoading) {
      return "Carregando…";
    }
    return "Conta bancária principal";
  }, [isLoading]);

  return (
    <AdminShell
      title="Financeiro"
      subtitle={subtitle}
      onOrgChange={onOrgChange}
    >
      {!organizationId ? (
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="text-sm font-semibold font-inter text-[#111827]">
            Selecione uma ONG
          </div>
          <div className="text-sm font-inter text-[#6B7280] mt-1">
            Para ver a conta bancária, selecione uma ONG no topo.
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
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
            Conta bancária
          </div>
          <div className="text-xs text-[#6B7280] font-inter mt-1">
            Esses dados são usados como conta principal da associação.
          </div>

          {!wallet && isLoading ? (
            <div className="mt-4 text-sm font-inter text-[#6B7280]">
              Carregando…
            </div>
          ) : null}

          {wallet && form ? (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-inter">
                <div className="text-xs text-[#6B7280]">Banco (nome)</div>
                <input
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E6E6E6]"
                  value={form.bankName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bankName: e.target.value }))
                  }
                />
              </label>

              <label className="text-sm font-inter">
                <div className="text-xs text-[#6B7280]">Banco (número)</div>
                <input
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E6E6E6]"
                  value={form.bankNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bankNumber: e.target.value }))
                  }
                />
              </label>

              <label className="text-sm font-inter">
                <div className="text-xs text-[#6B7280]">Agência</div>
                <input
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E6E6E6]"
                  value={form.bankBranchNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bankBranchNumber: e.target.value }))
                  }
                />
              </label>

              <label className="text-sm font-inter">
                <div className="text-xs text-[#6B7280]">Conta</div>
                <input
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E6E6E6]"
                  value={form.bankAccountNumber}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      bankAccountNumber: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="text-sm font-inter md:col-span-2">
                <div className="text-xs text-[#6B7280]">Chave PIX (json)</div>
                <textarea
                  className="mt-1 w-full min-h-[110px] p-3 rounded-lg border border-[#E6E6E6]"
                  value={form.pixKey}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, pixKey: e.target.value }))
                  }
                />
              </label>

              <div className="md:col-span-2 flex items-center justify-end">
                <button
                  className="h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 disabled:opacity-60"
                  disabled={mutation.isPending}
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    let pixKey = null;
                    if (form.pixKey?.trim()) {
                      try {
                        pixKey = JSON.parse(form.pixKey);
                      } catch (e) {
                        console.error(e);
                        setError("PIX Key precisa ser um JSON válido.");
                        return;
                      }
                    }

                    mutation.mutate({
                      bankName: form.bankName,
                      bankNumber: form.bankNumber,
                      bankBranchNumber: form.bankBranchNumber,
                      bankAccountNumber: form.bankAccountNumber,
                      pixKey,
                    });
                  }}
                >
                  {mutation.isPending ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>
          ) : wallet && !form ? (
            <div className="mt-4 text-sm font-inter text-[#6B7280]">
              Carregando formulário…
            </div>
          ) : !isLoading ? (
            <div className="mt-4 text-sm font-inter text-[#6B7280]">
              Nenhuma conta encontrada.
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}

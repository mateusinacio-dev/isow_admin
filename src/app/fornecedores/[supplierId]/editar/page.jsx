import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminShell from "../../../../components/admin/AdminShell";
import {
  fetchSupplier,
  patchSupplier,
  unlinkSupplier,
} from "../../services/supplierApi";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

export default function EditarFornecedorPage({ params: { supplierId } }) {
  const qc = useQueryClient();
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const {
    data,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "supplier", supplierId],
    queryFn: () => fetchSupplier(organizationId, supplierId),
    enabled: Boolean(organizationId && supplierId),
    networkMode: "always",
  });

  const supplier = data?.supplier || null;

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!supplier) {
      setForm(null);
      return;
    }
    setForm({
      legalName: supplier.legalName || "",
      tradeName: supplier.tradeName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
    });
  }, [supplier]);

  const patchMutation = useMutation({
    mutationFn: async () => {
      return patchSupplier(organizationId, supplierId, form);
    },
    onSuccess: async () => {
      setError(null);
      setSuccess("Fornecedor atualizado.");
      await qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "supplier", supplierId],
      });
      await qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "suppliers"],
      });
    },
    onError: (e) => {
      console.error(e);
      setSuccess(null);
      setError("Não foi possível salvar alterações.");
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => unlinkSupplier(organizationId, supplierId),
    onSuccess: async () => {
      setError(null);
      setSuccess("Vínculo removido.");
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
      setError("Não foi possível remover o vínculo.");
    },
  });

  const subtitle = useMemo(() => {
    if (isLoading) {
      return "Carregando…";
    }
    if (!supplier) {
      return "Fornecedor";
    }
    const doc =
      `${supplier.documentType || ""} ${supplier.documentNumber || ""}`.trim();
    return doc || "Fornecedor";
  }, [isLoading, supplier]);

  const linked = Boolean(supplier?.linked);

  return (
    <AdminShell
      title="Editar fornecedor"
      subtitle={subtitle}
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

        {error || loadError ? (
          <div className="bg-white border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-700 font-inter">
              {error || "Não foi possível carregar fornecedor."}
            </div>
          </div>
        ) : null}

        {success ? (
          <div className="bg-white border border-emerald-200 rounded-xl p-4">
            <div className="text-sm text-emerald-800 font-inter">{success}</div>
          </div>
        ) : null}

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div className="text-lg font-semibold font-inter text-[#111827]">
                {supplier
                  ? supplier.tradeName || supplier.legalName || "Fornecedor"
                  : "Fornecedor"}
              </div>
              <div className="text-xs text-[#6B7280] font-inter mt-1">
                Documento: {subtitle}
              </div>
              <div className="text-xs text-[#6B7280] font-inter mt-1">
                Status:{" "}
                {linked
                  ? "Vinculado à ONG"
                  : "Apenas base iSOW (não vinculado)"}
              </div>
            </div>

            {linked ? (
              <button
                type="button"
                disabled={unlinkMutation.isPending}
                onClick={() => {
                  const ok = window.confirm(
                    "Remover vínculo deste fornecedor com a ONG?",
                  );
                  if (!ok) {
                    return;
                  }
                  setError(null);
                  setSuccess(null);
                  unlinkMutation.mutate();
                }}
                className="inline-flex items-center h-10 px-4 rounded-full border border-red-200 text-red-700 text-sm font-inter hover:bg-red-50 disabled:opacity-60"
              >
                Remover vínculo
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="mt-4 text-sm font-inter text-[#6B7280]">
              Carregando…
            </div>
          ) : null}

          {supplier && form ? (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-inter md:col-span-2">
                <div className="text-xs text-[#6B7280]">
                  Nome / Razão social
                </div>
                <input
                  value={form.legalName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, legalName: e.target.value }))
                  }
                  className="mt-1 w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-inter outline-none"
                />
              </label>

              <label className="text-sm font-inter md:col-span-2">
                <div className="text-xs text-[#6B7280]">Nome fantasia</div>
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

              <div className="md:col-span-2 flex items-center justify-end">
                <button
                  type="button"
                  disabled={patchMutation.isPending}
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    patchMutation.mutate();
                  }}
                  className="h-10 px-4 rounded-xl bg-black text-white text-sm font-inter disabled:opacity-60"
                >
                  {patchMutation.isPending ? "Salvando…" : "Salvar"}
                </button>
              </div>

              <div className="md:col-span-2 text-xs text-[#6B7280] font-inter">
                Observação: fornecedores podem ser reutilizados por outras ONGs.
                Ao editar, você pode estar atualizando o cadastro global.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}

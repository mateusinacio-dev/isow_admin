import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Plus } from "lucide-react";

async function fetchOrganizations() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("/api/admin/organizations", {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(
        `When fetching /api/admin/organizations, the response was [${response.status}] ${response.statusText}`,
      );
    }
    const json = await response.json();
    return json.organizations || [];
  } finally {
    clearTimeout(timeout);
  }
}

export default function OrganizationPicker({ onChange, lockedOrganizationId }) {
  const [selectedId, setSelectedId] = useState(lockedOrganizationId || null);

  const isClient = typeof window !== "undefined";

  const {
    data: organizations = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: fetchOrganizations,
    enabled: isClient,
    staleTime: 1000 * 60,
    networkMode: "always",
  });

  const loadError = error ? "Não foi possível carregar as ONGs" : null;

  // If locked, force selection + inform parent
  useEffect(() => {
    if (!lockedOrganizationId) {
      return;
    }
    setSelectedId(lockedOrganizationId);
    try {
      window.localStorage.setItem(
        "admin:selectedOrganizationId",
        lockedOrganizationId,
      );
    } catch {
      // ignore
    }
    if (onChange) {
      onChange(lockedOrganizationId);
    }
  }, [lockedOrganizationId, onChange]);

  // Load selection from localStorage (only if not locked)
  useEffect(() => {
    if (!isClient || lockedOrganizationId) {
      return;
    }
    try {
      const stored = window.localStorage.getItem(
        "admin:selectedOrganizationId",
      );
      if (stored) {
        setSelectedId(stored);
        if (onChange) {
          onChange(stored);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, lockedOrganizationId]);

  // If localStorage selection is not in the list, reset it.
  useEffect(() => {
    if (!isClient || lockedOrganizationId) {
      return;
    }
    if (!selectedId) {
      return;
    }

    const exists = organizations.some((o) => o.organizationId === selectedId);
    if (!exists && organizations.length) {
      setSelectedId(null);
      try {
        window.localStorage.removeItem("admin:selectedOrganizationId");
      } catch {
        // ignore
      }
      if (onChange) {
        onChange(null);
      }
    }
  }, [isClient, lockedOrganizationId, onChange, organizations, selectedId]);

  // Auto-select if only 1 org (only if not locked)
  useEffect(() => {
    if (!isClient || lockedOrganizationId) {
      return;
    }
    if (!selectedId && organizations.length === 1) {
      const only = organizations[0].organizationId;
      setSelectedId(only);
      try {
        window.localStorage.setItem("admin:selectedOrganizationId", only);
      } catch {
        // ignore
      }
      if (onChange) {
        onChange(only);
      }
    }
  }, [isClient, lockedOrganizationId, onChange, organizations, selectedId]);

  const selectedOrg = useMemo(() => {
    if (!selectedId) {
      return null;
    }
    return organizations.find((o) => o.organizationId === selectedId) || null;
  }, [organizations, selectedId]);

  const label = useMemo(() => {
    if (loading) {
      return "Carregando...";
    }
    if (loadError) {
      return "Erro ao carregar";
    }
    if (selectedOrg) {
      return selectedOrg.tradeName || selectedOrg.legalName || "Organização";
    }
    return lockedOrganizationId ? "ONG" : "Selecionar ONG";
  }, [loadError, loading, lockedOrganizationId, selectedOrg]);

  const isDisabled = Boolean(lockedOrganizationId);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <label className="sr-only" htmlFor="org-select">
          Organização
        </label>

        <select
          id="org-select"
          value={selectedId || ""}
          disabled={isDisabled}
          onChange={(e) => {
            if (isDisabled) {
              return;
            }
            const next = e.target.value || null;
            setSelectedId(next);
            try {
              if (next) {
                window.localStorage.setItem(
                  "admin:selectedOrganizationId",
                  next,
                );
              } else {
                window.localStorage.removeItem("admin:selectedOrganizationId");
              }
            } catch {
              // ignore
            }
            if (onChange) {
              onChange(next);
            }
          }}
          className={
            "h-10 pl-4 pr-10 rounded-full bg-white border border-[#E5E5E5] text-sm font-inter text-black outline-none hover:border-[#D0D0D0] " +
            (isDisabled ? "opacity-90 cursor-not-allowed" : "")
          }
          title={
            isDisabled
              ? "Organização travada para teste"
              : "Selecionar organização"
          }
        >
          <option value="" disabled>
            {label}
          </option>
          {organizations.map((org) => {
            const orgLabel =
              org.tradeName || org.legalName || org.organizationId;
            return (
              <option key={org.organizationId} value={org.organizationId}>
                {orgLabel}
              </option>
            );
          })}
        </select>

        <ChevronDown
          size={16}
          className={
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E6E] " +
            (isDisabled ? "opacity-40" : "")
          }
        />

        {loadError ? (
          <div className="absolute top-full right-0 mt-2 text-xs text-red-600 font-inter">
            {loadError}
          </div>
        ) : null}
      </div>

      {!isDisabled ? (
        <a
          href="/associacao/nova"
          className="h-10 w-10 rounded-full bg-white border border-[#E5E5E5] hover:border-[#D0D0D0] inline-flex items-center justify-center"
          title="Cadastrar nova ONG"
        >
          <Plus size={16} className="text-[#111827]" />
        </a>
      ) : null}
    </div>
  );
}

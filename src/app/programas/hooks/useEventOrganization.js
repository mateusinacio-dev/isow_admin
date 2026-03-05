import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches the event directly by eventId (no org required) so we can discover
 * which organizationId owns it.  Uses the existing GET endpoint with a
 * placeholder org — the summary/queries/eventQueries.js filters by orgId,
 * so instead we use a dedicated lightweight SQL fetch.
 */
async function lookupEventOrg(eventId) {
  // We use the generic events listing from each org. Instead, call a
  // lightweight custom endpoint that looks up by eventId alone.
  const response = await fetch(`/api/admin/events/${eventId}/lookup`);
  if (!response.ok) {
    throw new Error(
      `When looking up event ${eventId}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

/**
 * Given an eventId, resolves which organizationId owns it.
 * Returns the resolved orgId and a callback for the OrgPicker.
 */
export function useEventOrganization(eventId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "event-lookup", eventId],
    queryFn: () => lookupEventOrg(eventId),
    enabled: Boolean(eventId),
    staleTime: 1000 * 60 * 5,
    networkMode: "always",
  });

  const resolvedOrgId = data?.organizationId || null;
  const [manualOrgId, setManualOrgId] = useState(null);

  const organizationId = useMemo(() => {
    return manualOrgId || resolvedOrgId || null;
  }, [manualOrgId, resolvedOrgId]);

  const onOrgChange = useCallback((orgId) => {
    setManualOrgId(orgId || null);
  }, []);

  return {
    organizationId,
    resolvedOrgId,
    loading: isLoading,
    error,
    eventMeta: data || null,
    onOrgChange,
  };
}

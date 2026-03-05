import { useQuery } from "@tanstack/react-query";

async function fetchEventSummary(organizationId, eventId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}/summary`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/events/${eventId}/summary, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export function useProgramSummary(organizationId, eventId) {
  return useQuery({
    queryKey: ["admin", "programa", eventId, "summary", organizationId],
    queryFn: () => fetchEventSummary(organizationId, eventId),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });
}

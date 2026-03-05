export async function fetchOrgEvents(organizationId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/events, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export async function createEvent(organizationId, payload) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      `When posting /api/admin/organizations/${organizationId}/events, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export async function updateEvent(organizationId, eventId, payload) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      `When patching /api/admin/organizations/${organizationId}/events/${eventId}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export async function publishEvent(organizationId, eventId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}/publish`,
    { method: "POST" },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body?.error || response.statusText;
    throw new Error(
      `When posting /api/admin/organizations/${organizationId}/events/${eventId}/publish, the response was [${response.status}] ${msg}`,
    );
  }
  return response.json();
}

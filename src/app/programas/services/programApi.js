export async function createProgram({ organizationId, payload }) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  // NEW: backend enforces 1 program per ONG, return conflict payload instead of throwing
  if (response.status === 409) {
    let data = {};
    try {
      data = await response.json();
    } catch (e) {
      // ignore
    }
    return {
      conflict: true,
      ...data,
    };
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `When creating program, the response was [${response.status}] ${response.statusText}: ${text}`,
    );
  }

  return response.json();
}

export async function updateProgram({ organizationId, eventId, payload }) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `When updating program, the response was [${response.status}] ${response.statusText}: ${text}`,
    );
  }

  return response.json();
}

export async function publishProgram({ organizationId, eventId, payload }) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `When publishing program, the response was [${response.status}] ${response.statusText}: ${text}`,
    );
  }

  return response.json();
}

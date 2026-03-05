export async function fetchProfile(organizationId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/profile`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/profile, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export async function fetchComplianceSummary(organizationId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/compliance/summary`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/compliance/summary, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export async function createComplianceDocument({ organizationId, payload }) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/compliance/documents`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      `When posting /api/admin/organizations/${organizationId}/compliance/documents, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export async function deleteComplianceDocument({
  organizationId,
  organizationDocumentId,
}) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/compliance/documents/${organizationDocumentId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new Error(
      `When deleting /api/admin/organizations/${organizationId}/compliance/documents/${organizationDocumentId}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export async function patchProfile({ organizationId, payload }) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/profile`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      `When patching /api/admin/organizations/${organizationId}/profile, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export async function fetchOrgProjects(organizationId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/projects`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/projects, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export async function createProject(organizationId, payload) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/projects`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body?.error || response.statusText;
    throw new Error(
      `When posting /api/admin/organizations/${organizationId}/projects, the response was [${response.status}] ${msg}`,
    );
  }
  return response.json();
}

export async function fetchProject(organizationId, projectId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/projects/${projectId}`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/projects/${projectId}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export async function updateProject(organizationId, projectId, payload) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/projects/${projectId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body?.error || response.statusText;
    throw new Error(
      `When patching /api/admin/organizations/${organizationId}/projects/${projectId}, the response was [${response.status}] ${msg}`,
    );
  }
  return response.json();
}

export async function publishProject(organizationId, projectId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/projects/${projectId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "PUBLISHED",
        publishingDate: new Date().toISOString(),
      }),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body?.error || response.statusText;
    throw new Error(
      `When publishing /api/admin/organizations/${organizationId}/projects/${projectId}, the response was [${response.status}] ${msg}`,
    );
  }
  return response.json();
}

export async function deleteProject(organizationId, projectId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/projects/${projectId}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body?.error || response.statusText;
    throw new Error(
      `When deleting /api/admin/organizations/${organizationId}/projects/${projectId}, the response was [${response.status}] ${msg}`,
    );
  }
  return response.json();
}

export async function startProjectExecution(organizationId, projectId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/projects/${projectId}/start-execution`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body?.error || response.statusText;
    throw new Error(
      `When posting /api/admin/organizations/${organizationId}/projects/${projectId}/start-execution, the response was [${response.status}] ${msg}`,
    );
  }
  return response.json();
}

export async function fetchBrazilianStates() {
  const response = await fetch("/api/geo/brazil/states");
  if (!response.ok) {
    throw new Error(
      `When fetching /api/geo/brazil/states, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

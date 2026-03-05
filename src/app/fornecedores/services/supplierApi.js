async function checkOk(response, path) {
  if (!response.ok) {
    throw new Error(
      `When fetching ${path}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response;
}

export async function fetchOrgSuppliers(organizationId, { search } = {}) {
  const qs = new URLSearchParams();
  if (search) {
    qs.set("search", search);
  }
  const path = `/api/admin/organizations/${organizationId}/suppliers${qs.toString() ? `?${qs.toString()}` : ""}`;
  const response = await fetch(path);
  await checkOk(response, path);
  return response.json();
}

export async function fetchSupplier(organizationId, supplierId) {
  const path = `/api/admin/organizations/${organizationId}/suppliers/${supplierId}`;
  const response = await fetch(path);
  await checkOk(response, path);
  return response.json();
}

export async function createOrLinkSupplier(organizationId, payload) {
  const path = `/api/admin/organizations/${organizationId}/suppliers`;
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  await checkOk(response, path);
  return response.json();
}

export async function patchSupplier(organizationId, supplierId, payload) {
  const path = `/api/admin/organizations/${organizationId}/suppliers/${supplierId}`;
  const response = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  await checkOk(response, path);
  return response.json();
}

export async function unlinkSupplier(organizationId, supplierId) {
  const path = `/api/admin/organizations/${organizationId}/suppliers/${supplierId}`;
  const response = await fetch(path, { method: "DELETE" });
  await checkOk(response, path);
  return response.json();
}

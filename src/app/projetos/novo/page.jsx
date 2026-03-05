import { useCallback, useState } from "react";
import AdminShell from "../../../components/admin/AdminShell";
import ProjectForm from "../components/ProjectForm";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

export default function NovoProjetoPage() {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const handleCreated = useCallback((projectId) => {
    if (!projectId) {
      return;
    }
    window.location.href = `/projetos/${projectId}/editar`;
  }, []);

  return (
    <AdminShell
      title="Projetos"
      subtitle="Cadastrar novo projeto"
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      <div className="space-y-4">
        <a
          href="/projetos"
          className="text-sm font-inter text-[#374151] hover:underline"
        >
          ← Voltar para Projetos
        </a>

        <ProjectForm
          organizationId={organizationId}
          mode="create"
          onCreated={handleCreated}
        />
      </div>
    </AdminShell>
  );
}

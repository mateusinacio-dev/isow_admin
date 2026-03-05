import { useCallback, useMemo, useState } from "react";
import AdminShell from "../../../../components/admin/AdminShell";
import ProjectForm from "../../components/ProjectForm";
import useProject from "../../hooks/useProject";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

export default function EditarProjetoPage({ params: { projectId } }) {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const { data, isLoading, error } = useProject(organizationId, projectId);
  const project = data?.project || null;

  const title = project?.name || "Editar projeto";

  const subtitle = useMemo(() => {
    if (isLoading) {
      return "Carregando projeto…";
    }
    return "Editar dados do projeto";
  }, [isLoading]);

  const handleDeleted = useCallback(() => {
    window.location.href = "/projetos";
  }, []);

  return (
    <AdminShell
      title={title}
      subtitle={subtitle}
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      <div className="space-y-4">
        <a
          href={`/projetos/${projectId}`}
          className="text-sm font-inter text-[#374151] hover:underline"
        >
          ← Voltar para o projeto
        </a>

        {error ? (
          <div className="bg-white border border-red-200 rounded-xl p-6">
            <div className="text-sm text-red-600 font-inter">
              Não foi possível carregar o projeto.
            </div>
          </div>
        ) : null}

        {project ? (
          <ProjectForm
            organizationId={organizationId}
            mode="edit"
            projectId={projectId}
            initialProject={project}
            onSaved={() => {}}
            onDeleted={handleDeleted}
          />
        ) : null}

        {!project && isLoading ? (
          <div className="text-sm font-inter text-[#6B7280]">Carregando…</div>
        ) : null}
      </div>
    </AdminShell>
  );
}

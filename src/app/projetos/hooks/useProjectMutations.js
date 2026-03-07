import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  publishProject,
  startProjectExecution,
  updateProject,
} from "../services/projectApi";

export default function useProjectMutations({
  organizationId,
  mode, // create | edit
  projectId,
  payload,
  onCreated,
  onSaved,
  onDeleted,
  onPublished,
  setError,
  setSuccess,
}) {
  const queryClient = useQueryClient();

  const invalidateProjects = () =>
    queryClient.invalidateQueries({
      queryKey: ["admin", "org", organizationId, "projects"],
    });

  const invalidateProject = () =>
    queryClient.invalidateQueries({
      queryKey: ["admin", "org", organizationId, "project", projectId],
    });

  const createMutation = useMutation({
    mutationFn: async () => createProject(organizationId, payload()),
    onSuccess: (data) => {
      invalidateProjects();
      setSuccess?.("Projeto criado.");
      onCreated?.(data?.projectId);
    },
    onError: (error) => {
      console.error(error);
      setError?.("Não foi possível criar o projeto.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => updateProject(organizationId, projectId, payload()),
    onSuccess: () => {
      invalidateProjects();
      invalidateProject();
      setSuccess?.("Alterações salvas.");
      onSaved?.();
    },
    onError: (error) => {
      console.error(error);
      setError?.("Não foi possível salvar o projeto.");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => publishProject(organizationId, projectId),
    onSuccess: async () => {
      setError?.(null);
      await invalidateProjects();
      await invalidateProject();
      onPublished?.();
    },
    onError: (error) => {
      console.error(error);
      setError?.("Não foi possível publicar o projeto. Tente novamente.");
      setSuccess?.(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => deleteProject(organizationId, projectId),
    onSuccess: () => {
      invalidateProjects();
      setSuccess?.("Projeto excluído.");
      onDeleted?.();
    },
    onError: (error) => {
      console.error(error);
      setError?.("Não foi possível excluir o projeto.");
    },
  });

  const startExecutionMutation = useMutation({
    mutationFn: async () => startProjectExecution(organizationId, projectId),
    onSuccess: () => {
      invalidateProject();
      setSuccess?.("Execução iniciada.");
    },
    onError: (error) => {
      console.error(error);
      setError?.("Não foi possível iniciar a execução.");
    },
  });

  const saving =
    (mode === "create" ? createMutation.isPending : updateMutation.isPending) ||
    false;

  return {
    createMutation,
    updateMutation,
    publishMutation,
    deleteMutation,
    startExecutionMutation,
    saving,
    publishing: publishMutation.isPending,
  };
}

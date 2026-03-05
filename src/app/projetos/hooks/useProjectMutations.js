import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
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
  setError,
  setSuccess,
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      return createProject(organizationId, payload());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "projects"],
      });
      setSuccess?.("Projeto criado.");
      onCreated?.(data?.projectId);
    },
    onError: (error) => {
      console.error(error);
      setError?.("Não foi possível criar o projeto.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return updateProject(organizationId, projectId, payload());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "project", projectId],
      });
      setSuccess?.("Alterações salvas.");
      onSaved?.();
    },
    onError: (error) => {
      console.error(error);
      setError?.("Não foi possível salvar o projeto.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return deleteProject(organizationId, projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "projects"],
      });
      setSuccess?.("Projeto excluído.");
      onDeleted?.();
    },
    onError: (error) => {
      console.error(error);
      setError?.("Não foi possível excluir o projeto.");
    },
  });

  const startExecutionMutation = useMutation({
    mutationFn: async () => {
      return startProjectExecution(organizationId, projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "project", projectId],
      });
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
    deleteMutation,
    startExecutionMutation,
    saving,
  };
}

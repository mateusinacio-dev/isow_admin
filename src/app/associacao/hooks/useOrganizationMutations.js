import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  patchProfile,
  createComplianceDocument,
  deleteComplianceDocument,
} from "../services/organizationApi";

export function useOrganizationMutations(organizationId, setSuccess, setError) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (payload) => patchProfile({ organizationId, payload }),
    onSuccess: () => {
      setSuccess("Cadastro atualizado.");
      setError(null);
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "profile"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "dashboard"],
      });
    },
    onError: (e) => {
      console.error(e);
      setError("Não foi possível salvar o cadastro.");
      setSuccess(null);
    },
  });

  const docsMutation = useMutation({
    mutationFn: ({ payload }) =>
      createComplianceDocument({ organizationId, payload }),
    onSuccess: () => {
      setSuccess("Documento enviado.");
      setError(null);
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "compliance"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "dashboard"],
      });
    },
    onError: (e) => {
      console.error(e);
      setError("Não foi possível enviar o documento.");
      setSuccess(null);
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: ({ organizationDocumentId }) =>
      deleteComplianceDocument({ organizationId, organizationDocumentId }),
    onSuccess: () => {
      setSuccess("Documento removido.");
      setError(null);
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "compliance"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "dashboard"],
      });
    },
    onError: (e) => {
      console.error(e);
      setError("Não foi possível remover o documento.");
      setSuccess(null);
    },
  });

  return { saveMutation, docsMutation, deleteDocMutation };
}

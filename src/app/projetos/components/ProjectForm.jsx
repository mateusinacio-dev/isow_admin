import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ImageCropModal from "../../eventos/components/ImageCropModal";
import { FormMessages } from "../../eventos/components/FormMessages";
import useBrazilianStates from "../hooks/useBrazilianStates";
import useProjectMutations from "../hooks/useProjectMutations";
import { deriveInitialState } from "../utils/projectStateInitializer";
import { buildPayload } from "../utils/projectPayloadBuilder";
import { computeBudgetTotals } from "../utils/budgetCalculations";
import { toMoneyNumber } from "../utils/numberUtils";
import { validateProjectForm } from "../utils/projectValidation";
import { useProjectFormState } from "../hooks/useProjectFormState";
import { useImageUpload } from "../hooks/useImageUpload";
import { fetchOrgSuppliers } from "../../fornecedores/services/supplierApi";
import ProjectFormHeader from "./ProjectFormHeader";
import BasicInfoSection from "./BasicInfoSection";
import LogoImageSection from "./LogoImageSection";
import ContactsSection from "./ContactsSection";
import LocationSection from "./LocationSection";
import ProjectDetailsSection from "./ProjectDetailsSection";
import GoalsSection from "./GoalsSection";
import BudgetSection from "./BudgetSection";
import OdsSection from "./OdsSection";
import BankAccountSection from "./BankAccountSection";
import InvestmentSection from "./InvestmentSection";

const MAX_PROJECT_IMAGES = 4;

export default function ProjectForm({
  organizationId,
  mode, // create | edit
  projectId,
  initialProject,
  onCreated,
  onSaved,
  onDeleted,
  onPublished,
}) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load suppliers linked to this organization (for budget selection)
  const { data: suppliersData } = useQuery({
    queryKey: ["admin", "org", organizationId, "suppliers"],
    queryFn: () => fetchOrgSuppliers(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });
  const suppliers = suppliersData?.suppliers || [];

  const {
    state,
    setState,
    setContactField,
    addContactRow,
    setGoalField,
    addGoal,
    removeGoal,
    setStageField,
    addStage,
    removeStage,
    setProductField,
    addProduct,
    removeProduct,
    addBudgetItem,
    setBudgetItemField,
    removeBudgetItem,
  } = useProjectFormState(() => deriveInitialState(initialProject));

  const {
    uploading,
    cropOpen,
    cropFile,
    fileInputLogoRef,
    fileInputImagesRef,
    handlePickLogo,
    setCropOpen,
    setCropFile,
    onCropConfirm,
    handleAddImages,
    handleImagesPicked,
  } = useImageUpload(setState, setError);

  const { data: statesData } = useBrazilianStates();
  const brazilStates = statesData?.states || [];

  const budgetTotals = useMemo(() => {
    return computeBudgetTotals({
      ...state.budget,
      taxesPercent: Number(state.budget.taxesPercent || 0),
    });
  }, [state.budget]);

  const minimumViableValue = useMemo(() => {
    return toMoneyNumber(state.budget.minimumViable);
  }, [state.budget.minimumViable]);

  const capturedValue = useMemo(() => {
    return toMoneyNumber(state.capturedValue);
  }, [state.capturedValue]);

  const canStartExecution = useMemo(() => {
    if (minimumViableValue <= 0) {
      return false;
    }
    return capturedValue >= minimumViableValue;
  }, [capturedValue, minimumViableValue]);

  const payload = useCallback(() => {
    const p = buildPayload(state);
    // In edit mode, do not overwrite dates on every save.
    if (mode === "edit") {
      return { ...p, startDate: null, endDate: null };
    }
    return p;
  }, [mode, state]);

  const canPublish = useMemo(() => {
    const s = String(initialProject?.status || "").toUpperCase();
    return s === "DRAFT" || s === "";
  }, [initialProject?.status]);

  const {
    createMutation,
    updateMutation,
    publishMutation,
    deleteMutation,
    startExecutionMutation,
    saving,
    publishing,
  } = useProjectMutations({
    organizationId,
    mode,
    projectId,
    payload,
    onCreated,
    onSaved,
    onDeleted,
    onPublished,
    setError,
    setSuccess,
  });

  const handlePublish = useCallback(() => {
    setError(null);
    setSuccess(null);
    publishMutation.mutate();
  }, [publishMutation]);

  const handleSave = useCallback(() => {
    setError(null);
    setSuccess(null);

    const validationError = validateProjectForm(state);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (mode === "create") {
      createMutation.mutate();
    } else {
      updateMutation.mutate();
    }
  }, [createMutation, mode, state, updateMutation]);

  const handleDelete = useCallback(() => {
    setError(null);
    setSuccess(null);

    const ok = window.confirm(
      "Excluir este projeto? Isso não pode ser desfeito.",
    );
    if (!ok) {
      return;
    }
    deleteMutation.mutate();
  }, [deleteMutation]);

  const handleStartExecution = useCallback(() => {
    setError(null);
    setSuccess(null);

    if (!canStartExecution) {
      setError("O valor captado ainda não atingiu o mínimo viável.");
      return;
    }

    const total = budgetTotals.totalProject;
    const warning = capturedValue < total;

    const ok = window.confirm(
      warning
        ? "O valor captado é menor que o valor total. Iniciar execução mesmo assim?"
        : "Iniciar execução do projeto agora?",
    );

    if (!ok) {
      return;
    }

    startExecutionMutation.mutate();
  }, [
    budgetTotals.totalProject,
    canStartExecution,
    capturedValue,
    startExecutionMutation,
  ]);

  const submitting = saving || uploading;

  const remainingSummary = 700 - String(state.summary || "").length;

  const odsOptions = useMemo(() => {
    const list = [];
    for (let i = 1; i <= 17; i += 1) {
      list.push(String(i));
    }
    return list;
  }, []);

  return (
    <div className="space-y-6">
      <FormMessages error={error} success={success} />

      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
        <ProjectFormHeader
          mode={mode}
          submitting={submitting}
          canStartExecution={canStartExecution}
          canPublish={canPublish}
          onSave={handleSave}
          onDelete={handleDelete}
          onPublish={handlePublish}
          onStartExecution={handleStartExecution}
          startExecutionPending={startExecutionMutation.isPending}
          deletePending={deleteMutation.isPending}
          publishing={publishing}
        />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <BasicInfoSection
            state={state}
            setState={setState}
            remainingSummary={remainingSummary}
          />

          <LogoImageSection
            state={state}
            setState={setState}
            uploading={uploading}
            onPickLogo={handlePickLogo}
            onAddImages={handleAddImages}
            fileInputLogoRef={fileInputLogoRef}
            fileInputImagesRef={fileInputImagesRef}
            maxProjectImages={MAX_PROJECT_IMAGES}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ContactsSection
            contacts={state.contacts}
            setContactField={setContactField}
            addContactRow={addContactRow}
          />

          <div>
            <LocationSection
              location={state.location}
              setState={setState}
              brazilStates={brazilStates}
            />

            <div className="mt-6">
              <ProjectDetailsSection state={state} setState={setState} />
            </div>
          </div>
        </div>

        <GoalsSection
          goals={state.goals}
          setGoalField={setGoalField}
          addGoal={addGoal}
          removeGoal={removeGoal}
          setStageField={setStageField}
          addStage={addStage}
          removeStage={removeStage}
          setProductField={setProductField}
          addProduct={addProduct}
          removeProduct={removeProduct}
        />

        <BudgetSection
          budget={state.budget}
          budgetTotals={budgetTotals}
          minimumViableValue={minimumViableValue}
          capturedValue={state.capturedValue}
          setState={setState}
          addBudgetItem={addBudgetItem}
          setBudgetItemField={setBudgetItemField}
          removeBudgetItem={removeBudgetItem}
          suppliers={suppliers}
        />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <OdsSection
            ods={state.ods}
            setState={setState}
            odsOptions={odsOptions}
          />

          <BankAccountSection
            bankAccount={state.bankAccount}
            setState={setState}
          />
        </div>

        <InvestmentSection investment={state.investment} setState={setState} />
      </div>

      <ImageCropModal
        open={cropOpen}
        file={cropFile}
        onClose={() => setCropOpen(false)}
        onConfirm={onCropConfirm}
        title="Ajustar logo do projeto"
        outputSize={512}
      />

      <input
        ref={fileInputLogoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          if (f) {
            setCropFile(f);
            setCropOpen(true);
          }
        }}
      />

      <input
        ref={fileInputImagesRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleImagesPicked(e, state.images)}
      />
    </div>
  );
}

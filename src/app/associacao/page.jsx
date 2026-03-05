import { useCallback, useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";
import ImageCropModal from "@/app/eventos/components/ImageCropModal";
import { useOrganizationProfile } from "./hooks/useOrganizationProfile";
import { useComplianceSummary } from "./hooks/useComplianceSummary";
import { useOrganizationForm } from "./hooks/useOrganizationForm";
import { useOrganizationMutations } from "./hooks/useOrganizationMutations";
import { useLogoUpload } from "./hooks/useLogoUpload";
import { MessageBanner } from "./components/MessageBanner";
import { StatusPill } from "./components/StatusPill";
import { OrganizationProfileForm } from "./components/OrganizationProfileForm";
import { ComplianceSection } from "./components/ComplianceSection";
import { validateOrganizationProfileForm } from "./utils/validation";

export default function AssociacaoPage() {
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState(null);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showProfileValidation, setShowProfileValidation] = useState(false);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || null);
    setShowProfileValidation(false);
  }, []);

  const { data: profileData, isLoading: loadingProfile } =
    useOrganizationProfile(organizationId);

  const { data: complianceData, isLoading: loadingCompliance } =
    useComplianceSummary(organizationId);

  const organization = profileData?.organization || null;
  const adminConfig = organization?.adminConfig || {};

  const orgName =
    organization?.tradeName || organization?.legalName || "Associação";

  const subtitle = useMemo(() => {
    if (loadingProfile || loadingCompliance) {
      return "Carregando cadastro e documentos…";
    }
    return "Cadastro e certidões";
  }, [loadingCompliance, loadingProfile]);

  const [form, setForm] = useOrganizationForm(organization, adminConfig);

  useEffect(() => {
    setShowProfileValidation(false);
  }, [organizationId]);

  const { saveMutation, docsMutation, deleteDocMutation } =
    useOrganizationMutations(organizationId, setSuccess, setError);

  const logoUpload = useLogoUpload(setForm, setError);

  const complianceSummary = complianceData?.summary || null;
  const documents = complianceData?.documents || [];

  const docsPending = Boolean(complianceSummary?.pending);

  const profileValidation = useMemo(() => {
    return validateOrganizationProfileForm(form);
  }, [form]);

  const canSaveProfile =
    Boolean(form) &&
    profileValidation.isValid &&
    !saveMutation.isPending &&
    !logoUpload.uploading;

  const saveDisabledReason = profileValidation.isValid
    ? null
    : "Preencha os campos obrigatórios para salvar.";

  const handleSaveProfile = () => {
    setError(null);
    setSuccess(null);
    setShowProfileValidation(true);

    const validation = validateOrganizationProfileForm(form);
    if (!validation.isValid) {
      const msg = validation.issues.join(" ");
      setError(msg || "Preencha os campos obrigatórios.");
      return;
    }

    const nextAddress = {
      street: form.addressStreet || null,
      number: form.addressNumber || null,
      neighborhood: form.addressNeighborhood || null,
      postalCode: form.addressPostalCode || null,
      city: form.addressCity || null,
      state: form.addressState || null,
      compliment: form.addressCompliment || null,
      country: "BR",
    };

    const admins = String(form.adminsText || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((emailOrName) => ({ emailOrName }));

    saveMutation.mutate({
      legalName: form.legalName,
      tradeName: form.tradeName,
      legalIdNumber: form.legalIdNumber,
      address: nextAddress,
      logoImageUrl: form.logoImageUrl,
      phone: form.phone,
      email: form.email,
      websiteUrl: form.websiteUrl,
      social: {
        instagram: form.instagram,
        facebook: form.facebook,
        linkedin: form.linkedin,
      },
      representativeLegal: {
        name: form.repName,
        email: form.repEmail,
        phone: form.repPhone,
      },
      admins,
    });
  };

  const handleReloadProfile = () => {
    setError(null);
    setSuccess(null);
    queryClient.invalidateQueries({
      queryKey: ["admin", "org", organizationId, "profile"],
    });
  };

  const profilePlaceholderText = useMemo(() => {
    return loadingProfile ? "Carregando…" : "Selecione uma ONG.";
  }, [loadingProfile]);

  const compliancePlaceholderText = "Selecione uma ONG.";

  const profileContent = form ? (
    <OrganizationProfileForm
      form={form}
      setForm={setForm}
      logoUploadProps={{
        uploading: logoUpload.uploading,
        handlePickLogo: logoUpload.handlePickLogo,
        fileInputRef: logoUpload.fileInputRef,
        setCropFile: logoUpload.setCropFile,
        setCropOpen: logoUpload.setCropOpen,
      }}
      canSave={canSaveProfile}
      saveDisabledReason={saveDisabledReason}
      isPending={saveMutation.isPending}
      onReload={handleReloadProfile}
      onSave={handleSaveProfile}
      fieldErrors={profileValidation.fieldErrors}
      showValidation={showProfileValidation}
    />
  ) : (
    <div className="mt-4 text-sm font-inter text-[#6B7280]">
      {profilePlaceholderText}
    </div>
  );

  let complianceContent = (
    <div className="mt-4 text-sm font-inter text-[#6B7280]">
      {compliancePlaceholderText}
    </div>
  );
  if (loadingCompliance) {
    complianceContent = (
      <div className="mt-4 text-sm font-inter text-[#6B7280]">Carregando…</div>
    );
  } else if (complianceSummary) {
    complianceContent = (
      <ComplianceSection
        organizationId={organizationId}
        complianceSummary={complianceSummary}
        documents={documents}
        docsMutation={docsMutation}
        deleteDocMutation={deleteDocMutation}
        setError={setError}
        setSuccess={setSuccess}
      />
    );
  }

  return (
    <AdminShell title={orgName} subtitle={subtitle} onOrgChange={onOrgChange}>
      <div className="space-y-6">
        {!organizationId ? (
          <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
            <div className="text-sm font-semibold font-inter text-[#111827]">
              Selecione uma ONG
            </div>
            <div className="text-sm font-inter text-[#6B7280] mt-1">
              Se for sua primeira vez, cadastre uma nova ONG.
            </div>
            <a
              href="/associacao/nova"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 mt-4"
            >
              Cadastrar nova ONG
            </a>
          </div>
        ) : null}

        <MessageBanner error={error} success={success} />

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold font-inter text-[#111827]">
                Cadastro da associação
              </div>
              <div className="text-xs text-[#6B7280] font-inter mt-1">
                Preencha os dados básicos e mantenha as certidões em dia.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill pending={docsPending} />
            </div>
          </div>

          {profileContent}
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold font-inter text-[#111827]">
                Documentos e certidões
              </div>
              <div className="text-xs text-[#6B7280] font-inter mt-1">
                Envie os arquivos e informe as datas. O painel calcula
                vencimentos e pendências.
              </div>
            </div>
            <a
              href="/financeiro"
              className="text-sm font-inter text-[#111827] underline"
            >
              Conta bancária
            </a>
          </div>

          {complianceContent}
        </div>
      </div>

      <ImageCropModal
        open={logoUpload.cropOpen}
        file={logoUpload.cropFile}
        onClose={() => logoUpload.setCropOpen(false)}
        onConfirm={logoUpload.onCropConfirm}
        title="Ajustar logo da associação"
        outputSize={512}
      />
    </AdminShell>
  );
}

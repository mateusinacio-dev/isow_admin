import { LogoUploadSection } from "./LogoUploadSection";
import { BasicInfoFields } from "./BasicInfoFields";
import { AddressFields } from "./AddressFields";
import { SocialMediaFields } from "./SocialMediaFields";
import { RepresentativeFields } from "./RepresentativeFields";
import { ProfileFormActions } from "./ProfileFormActions";

export function OrganizationProfileForm({
  form,
  setForm,
  logoUploadProps,
  canSave,
  saveDisabledReason,
  isPending,
  onReload,
  onSave,
  fieldErrors,
  showValidation,
}) {
  return (
    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <LogoUploadSection
        logoImageUrl={form.logoImageUrl}
        {...logoUploadProps}
      />
      <BasicInfoFields
        form={form}
        setForm={setForm}
        fieldErrors={fieldErrors}
        showValidation={showValidation}
      />
      <AddressFields
        form={form}
        setForm={setForm}
        fieldErrors={fieldErrors}
        showValidation={showValidation}
      />
      <SocialMediaFields form={form} setForm={setForm} />
      <RepresentativeFields
        form={form}
        setForm={setForm}
        fieldErrors={fieldErrors}
        showValidation={showValidation}
      />
      <ProfileFormActions
        canSave={canSave}
        saveDisabledReason={saveDisabledReason}
        isPending={isPending}
        onReload={onReload}
        onSave={onSave}
      />
    </div>
  );
}

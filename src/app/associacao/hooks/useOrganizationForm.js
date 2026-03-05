import { useEffect, useState } from "react";

export function useOrganizationForm(organization, adminConfig) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!organization) {
      setForm(null);
      return;
    }

    const address = organization.address || {};
    const contact = adminConfig.contact || {};
    const social = adminConfig.social || {};

    setForm({
      legalName: organization.legalName || "",
      tradeName: organization.tradeName || "",
      legalIdNumber: organization.legalIdNumber || "",
      logoImageUrl: organization.logoImageUrl || "",
      addressStreet: address.street || "",
      addressNumber: address.number || "",
      addressNeighborhood: address.neighborhood || "",
      addressCity: address.city || "",
      addressState: address.state || "",
      addressPostalCode: address.postalCode || "",
      addressCompliment: address.compliment || "",
      phone: contact.phone || "",
      email: contact.email || "",
      websiteUrl: contact.websiteUrl || "",
      instagram: social.instagram || "",
      facebook: social.facebook || "",
      linkedin: social.linkedin || "",
      repName: adminConfig?.representativeLegal?.name || "",
      repEmail: adminConfig?.representativeLegal?.email || "",
      repPhone: adminConfig?.representativeLegal?.phone || "",
      adminsText: Array.isArray(adminConfig.admins)
        ? adminConfig.admins
            .map((a) => a?.email || a?.name || a?.emailOrName || "")
            .filter(Boolean)
            .join("\n")
        : "",
    });
  }, [adminConfig, organization]);

  return [form, setForm];
}

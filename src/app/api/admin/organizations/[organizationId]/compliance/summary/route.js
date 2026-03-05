import sql from "@/app/api/utils/sql";
import {
  computeComplianceSummary,
  fetchOrganizationComplianceDocuments,
} from "@/app/api/admin/organizations/utils/compliance";

export async function GET(request, { params: { organizationId } }) {
  try {
    const [org] = await sql`
      SELECT
        o."organizationId",
        o."legalIdNumber",
        o."legalName",
        o."tradeName",
        o."adminConfig"
      FROM public."Organization" o
      WHERE o."organizationId" = ${organizationId}
        AND o."deletedAt" IS NULL
      LIMIT 1
    `;

    if (!org) {
      return Response.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const documents =
      await fetchOrganizationComplianceDocuments(organizationId);

    const summary = computeComplianceSummary({
      organization: org,
      documents,
      now: new Date(),
    });

    return Response.json({ organization: org, summary, documents });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load compliance summary" },
      { status: 500 },
    );
  }
}

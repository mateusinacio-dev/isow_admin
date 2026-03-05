import sql from "@/app/api/utils/sql";
import {
  computeComplianceSummary,
  fetchOrganizationComplianceDocuments,
} from "@/app/api/admin/organizations/utils/compliance";
import { requireOrganizationAccess } from "@/app/api/admin/organizations/utils/authz";

function monthKeyFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return { year: String(year), month };
}

export async function GET(request, { params: { organizationId } }) {
  try {
    const { response } = await requireOrganizationAccess(organizationId);
    if (response) {
      return response;
    }

    const [org] = await sql`
      SELECT
        o."organizationId",
        o."tradeName",
        o."legalName",
        o.type,
        o.hashtag,
        o."shortDescription",
        o."logoImageUrl",
        o."coverImageUrl",
        o."legalIdNumber",
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

    const [wallet] = await sql`
      SELECT
        w."walletId",
        w."accountBalance",
        w."accountBlockedBalance",
        w."pointsBalance",
        w.status,
        w.virtual,
        w."walletShortId"
      FROM public."Wallet" w
      WHERE w."organizationId" = ${organizationId}
        AND w."deletedAt" IS NULL
      LIMIT 1
    `;

    const [projectsRow] = await sql`
      SELECT
        SUM(CASE WHEN p.status = 'ACTIVE' THEN 1 ELSE 0 END)::int AS "activeProjects",
        SUM(CASE WHEN p.status <> 'ACTIVE' THEN 1 ELSE 0 END)::int AS "closedProjects"
      FROM public."Project" p
      WHERE p."organizationId" = ${organizationId}
        AND p."deletedAt" IS NULL
    `;

    const [eventsRow] = await sql`
      SELECT COUNT(*)::int AS "activeEvents"
      FROM public."Event" e
      WHERE e."organizationId" = ${organizationId}
        AND e."deletedAt" IS NULL
        AND e.status IN ('PUBLISHED', 'STARTED')
    `;

    const [volRow] = await sql`
      SELECT
        SUM(
          CASE
            WHEN v.status IN ('FINISHED', 'CANCELED', 'CLOSED') THEN 0
            ELSE 1
          END
        )::int AS "activeVolunteerings",
        SUM(
          CASE
            WHEN v.status IN ('FINISHED', 'CANCELED', 'CLOSED') THEN 1
            ELSE 0
          END
        )::int AS "closedVolunteerings"
      FROM public."Vacancy" v
      WHERE v."organizationId" = ${organizationId}
        AND v."deletedAt" IS NULL
    `;

    const [approvedPostsRow] = await sql`
      SELECT COUNT(*)::int AS "approvedPosts"
      FROM public."Post" p
      WHERE p."organizationId" = ${organizationId}
        AND p."deletedAt" IS NULL
        AND p.status = 'APPROVED'
    `;

    const [pendingPostsRow] = await sql`
      SELECT COUNT(*)::int AS "pendingPosts"
      FROM public."Post" p
      WHERE p."organizationId" = ${organizationId}
        AND p."deletedAt" IS NULL
        AND p.status = 'AWAITING_APPROVAL'
    `;

    // Build last 12 months labels
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const { year, month } = monthKeyFromDate(d);
      months.push({ year, month, label: `${month}/${year.slice(-2)}` });
    }

    // Split investments by target: Projects vs Programs (org wallet)
    const investmentRows = await sql`
      SELECT
        to_char(d."acquirerTransactionDate", 'YYYY') AS year,
        to_char(d."acquirerTransactionDate", 'MM') AS month,
        COALESCE(
          SUM(
            CASE
              WHEN w."projectId" IS NOT NULL THEN COALESCE(d."donationTransactionNetValue", d."donationTransactionValue", 0)
              ELSE 0
            END
          ),
          0
        ) AS projetos,
        COALESCE(
          SUM(
            CASE
              WHEN w."projectId" IS NULL AND w."organizationId" = ${organizationId} THEN COALESCE(d."donationTransactionNetValue", d."donationTransactionValue", 0)
              ELSE 0
            END
          ),
          0
        ) AS programas
      FROM public."DonationTransaction" d
      JOIN public."Wallet" w
        ON w."walletId" = d."creditPartyWalletId"
      LEFT JOIN public."Project" pr
        ON pr."projectId" = w."projectId"
      WHERE d."deletedAt" IS NULL
        AND d.status = 'CONFIRMED'
        AND d."acquirerTransactionDate" >= (CURRENT_TIMESTAMP - INTERVAL '12 months')
        AND (
          w."organizationId" = ${organizationId}
          OR pr."organizationId" = ${organizationId}
        )
      GROUP BY year, month
    `;

    const invMap = new Map();
    for (const r of investmentRows || []) {
      invMap.set(`${r.year}-${r.month}`, {
        projetos: Number(r.projetos || 0),
        programas: Number(r.programas || 0),
      });
    }

    const investmentsLast12Months = months.map((m) => {
      const found = invMap.get(`${m.year}-${m.month}`) || {
        projetos: 0,
        programas: 0,
      };
      const total = Number(found.projetos || 0) + Number(found.programas || 0);
      return { ...m, ...found, total };
    });

    const donationsThisMonth =
      investmentsLast12Months[investmentsLast12Months.length - 1]?.total || 0;

    // Compliance
    const complianceDocs =
      await fetchOrganizationComplianceDocuments(organizationId);
    const compliance = computeComplianceSummary({
      organization: org,
      documents: complianceDocs,
      now: new Date(),
    });

    return Response.json({
      organization: org,
      wallet: wallet || null,
      compliance,
      stats: {
        activeProjects: projectsRow?.activeProjects ?? 0,
        closedProjects: projectsRow?.closedProjects ?? 0,
        activeEvents: eventsRow?.activeEvents ?? 0,
        activeVolunteerings: volRow?.activeVolunteerings ?? 0,
        closedVolunteerings: volRow?.closedVolunteerings ?? 0,
        approvedPosts: approvedPostsRow?.approvedPosts ?? 0,
        pendingPosts: pendingPostsRow?.pendingPosts ?? 0,
        donationsThisMonth: Number(donationsThisMonth || 0),
      },
      investmentsLast12Months,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load organization dashboard" },
      { status: 500 },
    );
  }
}

import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const rows = await sql`
      SELECT uf, name
      FROM public."BrazilianStates"
      ORDER BY name ASC
    `;

    return Response.json({ states: rows || [] });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load Brazilian states" },
      { status: 500 },
    );
  }
}

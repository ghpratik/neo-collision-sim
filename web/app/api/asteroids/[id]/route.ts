import { NextRequest, NextResponse } from "next/server";
import { getAsteroidDetail, getTimeJd } from "@/lib/asteroidStore";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const detail = getAsteroidDetail(id);

  if (!detail) {
    return NextResponse.json(
      { error: `Asteroid '${id}' not found` },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      ...detail,
      time_jd: getTimeJd(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    },
  );
}

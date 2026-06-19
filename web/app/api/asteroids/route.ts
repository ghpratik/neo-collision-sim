import { NextRequest, NextResponse } from "next/server";
import { listAsteroids } from "@/lib/asteroidStore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limitRaw = Number(searchParams.get("limit") ?? "25") || 25;
  const limit = Math.min(Math.max(limitRaw, 1), 100); // hard cap page size
  const search = searchParams.get("search")?.trim() || undefined;

  const result = listAsteroids({ page, limit, search });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

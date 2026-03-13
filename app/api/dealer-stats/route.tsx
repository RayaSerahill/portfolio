import { NextResponse } from "next/server";
import { loadDealerStats } from "@/lib/dealerStats";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const uploaderId = (url.searchParams.get("uploaderId") ?? "").trim();
  const days = Number(url.searchParams.get("days") ?? "20");

  if (!uploaderId) {
    return NextResponse.json({ ok: false, message: "Missing uploaderId" }, { status: 400 });
  }

  const data = await loadDealerStats(uploaderId, days);
  return NextResponse.json({ ok: true, uploaderId, ...data });
}

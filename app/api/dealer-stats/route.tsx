import { NextResponse } from "next/server";
import { loadDealerStats } from "@/lib/dealerStats";
import { requireUserRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const gate = await requireUserRequest(req);
  if (!gate.ok) return gate.res;

  const url = new URL(req.url);
  const requestedUploaderId = (url.searchParams.get("uploaderId") ?? "").trim();
  const days = Number(url.searchParams.get("days") ?? "20");
  const isAdmin = gate.auth.role === "owner" || gate.auth.role === "admin";
  const uploaderId = requestedUploaderId || gate.auth.id;

  if (!isAdmin && uploaderId !== gate.auth.id) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const data = await loadDealerStats(uploaderId, days);
  return NextResponse.json({ ok: true, uploaderId, ...data });
}

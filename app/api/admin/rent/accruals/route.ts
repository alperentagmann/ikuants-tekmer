import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { RentService } from "@/lib/services/rent-service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!auth.user.isSuperAdmin && !hasPermission(auth.user, "view", "rent")) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
    const status = searchParams.get("status") || undefined;
    const entrepreneurId = searchParams.get("entrepreneurId") || undefined;

    const accruals = await RentService.getRentAccruals({ month, year, status, entrepreneurId });
    return NextResponse.json({ success: true, items: accruals });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!auth.user.isSuperAdmin && !hasPermission(auth.user, "create", "rent")) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = await RentService.generateMonthlyAccruals(
      Number(body.year || new Date().getFullYear()),
      Number(body.month || (new Date().getMonth() + 1))
    );
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

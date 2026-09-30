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
    const entrepreneurId = searchParams.get("entrepreneurId") || undefined;
    const status = searchParams.get("status") || undefined;

    const contracts = await RentService.getRentContracts({ entrepreneurId, status });
    return NextResponse.json({ success: true, items: contracts });
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
    const contract = await RentService.createRentContract({
      entrepreneurId: body.entrepreneurId,
      spaceFacilityId: body.spaceFacilityId || body.facilityId,
      spaceName: body.spaceName,
      contractNo: body.contractNo,
      startDate: body.startDate || body.contractStart || new Date(),
      endDate: body.endDate || body.contractEnd || new Date(Date.now() + 365 * 24 * 3600 * 1000),
      monthlyRent: Number(body.monthlyRent),
      currency: body.currency || "TRY",
      vatRate: body.vatRate !== undefined ? Number(body.vatRate) : 20,
      dueDay: body.dueDay !== undefined ? Number(body.dueDay) : 5,
      depositAmount: body.depositAmount !== undefined ? Number(body.depositAmount) : 0,
      isWaived: Boolean(body.isWaived),
      freePeriodStart: body.freePeriodStart ? new Date(body.freePeriodStart) : null,
      freePeriodEnd: body.freePeriodEnd ? new Date(body.freePeriodEnd) : null,
      contractDocUrl: body.contractDocUrl || body.contractDocumentUrl,
      notes: body.notes,
    }, auth.user.id);

    return NextResponse.json({ success: true, contract }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

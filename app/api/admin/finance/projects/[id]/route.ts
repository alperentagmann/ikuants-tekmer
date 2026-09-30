import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { FinanceService } from "@/lib/services/finance-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!auth.user.isSuperAdmin && !hasPermission(auth.user, "view", "projects") && !hasPermission(auth.user, "view", "finance")) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { id: projectId } = await params;
  try {
    const data = await FinanceService.getProjectFinanceLedger(projectId);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

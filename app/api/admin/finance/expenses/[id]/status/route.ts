import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { FinanceService } from "@/lib/services/finance-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!auth.user.isSuperAdmin && !hasPermission(auth.user, "edit", "finance")) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { id: expenseId } = await params;
  try {
    const body = await req.json();
    const updated = await FinanceService.updateExpenseStatus(
      expenseId,
      body.paymentStatus || body.status || body.approvalStatus || "PAID",
      auth.user.id
    );

    return NextResponse.json({ success: true, expense: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

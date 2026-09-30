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

  if (!auth.user.isSuperAdmin && !hasPermission(auth.user, "edit", "projects") && !hasPermission(auth.user, "create", "finance")) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { id: projectId } = await params;
  try {
    const body = await req.json();
    const budgetLine = await FinanceService.createBudgetLine(
      projectId,
      {
        code: body.code || `BL-${Date.now().toString().slice(-4)}`,
        title: body.title || body.name || "Bütçe Kalemi",
        category: body.category || "OTHER",
        allocatedAmount: Number(body.allocatedAmount),
        currency: body.currency || "TRY",
        notes: body.notes || body.description || null,
      },
      auth.user.id
    );

    return NextResponse.json({ success: true, budgetLine }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

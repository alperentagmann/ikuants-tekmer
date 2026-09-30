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
    const net = Number(body.amount);
    const vat = body.vatAmount !== undefined ? Number(body.vatAmount) : (net * 0.2);
    const total = Number(body.totalAmount || (net + vat));

    const expense = await FinanceService.addProjectExpense(projectId, {
      fundingSourceId: body.fundingSourceId || null,
      budgetLineId: body.budgetLineId || null,
      expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
      category: body.category || "Hizmet Alımı",
      supplierVendor: body.supplierVendor || body.vendorName || body.vendor || "Tedarikçi",
      description: body.description || "Gider açıklaması",
      amount: net,
      vatAmount: vat,
      totalAmount: total,
      currency: body.currency || "TRY",
      paymentStatus: body.paymentStatus || "PAID",
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      paymentMethod: body.paymentMethod || "BANK_TRANSFER",
      invoiceNumber: body.invoiceNumber || body.invoiceNo || null,
      invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : null,
      invoiceDocUrl: body.invoiceDocumentUrl || body.invoiceDocUrl || null,
      receiptDocUrl: body.receiptUrl || body.receiptDocUrl || null,
      notes: body.notes || null,
    }, auth.user.id);

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

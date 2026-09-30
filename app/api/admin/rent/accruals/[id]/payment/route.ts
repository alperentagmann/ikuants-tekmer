import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { RentService } from "@/lib/services/rent-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!auth.user.isSuperAdmin && !hasPermission(auth.user, "edit", "rent")) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { id: accrualId } = await params;
  try {
    const body = await req.json();
    const payment = await RentService.recordRentPayment(
      accrualId,
      {
        amount: Number(body.amount),
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        paymentMethod: body.paymentMethod || "BANK_TRANSFER",
        bankReceiptNo: body.bankReceiptNo || body.bankReferenceNo,
        receiptDocUrl: body.receiptDocUrl || body.receiptUrl,
        description: body.description || body.notes,
      },
      auth.user.id
    );

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

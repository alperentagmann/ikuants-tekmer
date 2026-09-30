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

    if (body.fundingSourceId && body.action === "ADD_RECEIPT") {
      const receipt = await FinanceService.addFundingReceipt(body.fundingSourceId, {
        amount: Number(body.amount),
        currency: body.currency || "TRY",
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : new Date(),
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : new Date(),
        status: body.status || "RECEIVED",
        bankReferenceNo: body.bankReferenceNo,
        description: body.description,
        receiptDocUrl: body.receiptDocumentUrl || body.receiptDocUrl,
      }, auth.user.id);
      return NextResponse.json({ success: true, receipt }, { status: 201 });
    }

    const funding = await FinanceService.addFundingSource(projectId, {
      organizationName: body.organizationName || body.fundingSource || "Kurum",
      programGrantName: body.programGrantName || body.programName || "Destek Programı",
      awardedAmount: Number(body.awardedAmount),
      currency: body.currency || "TRY",
      agreementDate: body.agreementDate ? new Date(body.agreementDate) : new Date(),
      agreementNo: body.agreementNo,
      expectedStartDate: body.expectedStartDate ? new Date(body.expectedStartDate) : undefined,
      expectedEndDate: body.expectedEndDate ? new Date(body.expectedEndDate) : undefined,
      description: body.description,
      documentUrl: body.documentUrl,
    }, auth.user.id);

    return NextResponse.json({ success: true, funding }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

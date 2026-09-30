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
    const rules = await RentService.getRentReminderRules();
    return NextResponse.json({ success: true, items: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!auth.user.isSuperAdmin && !hasPermission(auth.user, "edit", "rent")) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const rule = await RentService.upsertRentReminderRule({
      id: body.id,
      ruleName: body.ruleName || body.ruleType || "Hatırlatma Kuralı",
      daysOffset: Number(body.daysOffset || 0),
      triggerType: body.triggerType || (Number(body.daysOffset || 0) < 0 ? "BEFORE_DUE" : Number(body.daysOffset || 0) === 0 ? "ON_DUE" : "OVERDUE"),
      emailSubject: body.emailSubject,
      emailTemplateBody: body.emailTemplateBody || body.emailBodyTemplate,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    }, auth.user.id);

    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

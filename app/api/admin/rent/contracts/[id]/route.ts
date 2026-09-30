import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, "view", "rent")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const contract = await prisma.rentContract.findUnique({
      where: { id },
      include: {
        entrepreneur: true,
        accruals: {
          include: { payments: true },
          orderBy: { dueDate: "desc" },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, "edit", "rent")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const updated = await prisma.rentContract.update({
      where: { id },
      data: {
        status: body.status,
        monthlyRent: body.monthlyRent !== undefined ? Number(body.monthlyRent) : undefined,
        endDate: body.endDate || body.contractEnd ? new Date(body.endDate || body.contractEnd) : undefined,
        notes: body.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

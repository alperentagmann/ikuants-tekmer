import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { ReceivableService } from '@/lib/services/receivable-service';
import { z } from 'zod';

const paymentSchema = z.object({
    paymentAmount: z.number().positive('Ödeme tutarı 0\'dan büyük olmalıdır'),
    paymentDate: z.string().optional(),
    paymentMethod: z.string().optional(),
    bankReceiptNo: z.string().optional(),
    notes: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'manage', 'finance') && !hasPermission(auth.user, 'update', 'finance')) {
            return NextResponse.json({ success: false, error: 'Tahsilat kaydetme yetkiniz bulunmuyor' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const parsed = paymentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const updated = await ReceivableService.recordPayment(id, parsed.data, auth.user.id);
        return NextResponse.json({ success: true, receivable: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Tahsilat kaydedilemedi' }, { status: 500 });
    }
}

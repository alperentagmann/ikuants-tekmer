import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';

export async function GET(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;

        const [items, total, stats] = await Promise.all([
            prisma.emailOutbox.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.emailOutbox.count({ where }),
            EmailOutboxService.getOutboxStats(),
        ]);

        return NextResponse.json({
            success: true,
            items,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            stats,
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
        }

        const body = await request.json();
        const { action, emailId } = body;

        if (action === 'PROCESS_QUEUE') {
            const results = await EmailOutboxService.processPendingEmails(20);
            return NextResponse.json({ success: true, ...results, message: 'Kuyruk işlendi.' });
        } else if (action === 'RETRY' && emailId) {
            const updated = await EmailOutboxService.retryEmail(emailId);
            return NextResponse.json({ success: true, item: updated, message: 'E-posta tekrar kuyruğa alındı.' });
        } else if (action === 'CANCEL' && emailId) {
            const updated = await EmailOutboxService.cancelEmail(emailId);
            return NextResponse.json({ success: true, item: updated, message: 'E-posta iptal edildi.' });
        } else if (action === 'SEND_NOW' && emailId) {
            const updated = await EmailOutboxService.sendEmailImmediately(emailId);
            return NextResponse.json({ success: true, item: updated, message: 'E-posta gönderildi.' });
        } else {
            return NextResponse.json({ success: false, message: 'Geçersiz aksiyon.' }, { status: 400 });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/application-service';
import { getCurrentAdminUser, logPiiAccess } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';
import { revealStoredTcNumber } from '@/lib/security/identity-security';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 });
        }

        // Strict RBAC check for PII
        if (!hasPermission(user, 'view_sensitive', 'applications')) {
            return NextResponse.json({
                success: false,
                message: 'Hassas kimlik bilgilerini (PII) görüntüleme yetkiniz bulunmamaktadır.'
            }, { status: 403 });
        }

        const app = await ApplicationService.getApplicationDetails(id);
        if (!app) return NextResponse.json({ success: false, message: 'Başvuru bulunamadı' }, { status: 404 });

        let body: any = {};
        try {
            body = await request.json();
        } catch {
            // body is optional
        }

        const reason = body?.reason || 'Yönetici PII görüntüleme talebi';
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        // Audit log PII access in both PII log and central Audit log
        await logPiiAccess(user.id, 'Application', app.id, 'tcNumber', ip, userAgent);
        await logAuditEvent({
            actorId: user.id,
            actorEmail: user.email,
            actorName: user.name,
            action: 'PII_ACCESS',
            entityType: 'Application',
            entityId: app.id,
            fieldName: 'tcNumber',
            diff: `PII Reveal: ${app.applicationNumber} (${app.applicantName}) - Gerekçe: ${reason}`,
            ipAddress: ip,
            userAgent,
            isPiiAccess: true,
        });

        return NextResponse.json({
            success: true,
            tcNumber: revealStoredTcNumber(app.tcNumberEncrypted) || app.tcNumberMasked,
            revealedAt: new Date().toISOString(),
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { DirectoryService } from '@/lib/services/directory-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'directory')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const organizations = await DirectoryService.getOrganizations();
        return NextResponse.json({ success: true, organizations });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'create', 'directory')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await req.json();
        if (!body.name) {
            return NextResponse.json({ success: false, message: 'Kurum adı zorunludur' }, { status: 400 });
        }

        const org = await DirectoryService.createOrganization(body, { id: user.id, name: user.name });
        return NextResponse.json({ success: true, organization: org }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { UserManagementService } from '@/lib/services/user-management-service';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'view', 'audit_logs') && !caller.isSuperAdmin && caller.id !== id)) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const activities = await UserManagementService.getUserActivity(id, limit);
        return NextResponse.json({ success: true, activities });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

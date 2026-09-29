import { NextRequest, NextResponse } from 'next/server';
import { EntrepreneurService } from '@/lib/services/entrepreneur-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'edit', 'entrepreneurs')) {
            return NextResponse.json(
                { success: false, message: 'Bu işlem için yetkiniz bulunmamaktadır.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const isPublished = Boolean(body.isPublished);

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || '';

        const updated = await EntrepreneurService.togglePublicVisibility(id, isPublished, {
            id: user.id,
            name: user.name,
            email: user.email,
            ip,
            userAgent,
        });

        // Revalidate public cache paths
        try {
            revalidatePath('/girisimciler');
            revalidatePath('/');
            revalidatePath('/api/public/entrepreneurs');
        } catch {
            // In static build or dev, ignore
        }

        return NextResponse.json({
            success: true,
            entrepreneur: updated,
            message: isPublished ? 'Girişimci yayına alındı.' : 'Girişimci yayından kaldırıldı (gizlendi).',
        });
    } catch (e: any) {
        return NextResponse.json(
            { success: false, message: e.message || 'Görünürlük güncellenemedi.' },
            { status: 500 }
        );
    }
}

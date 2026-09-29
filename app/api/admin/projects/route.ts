import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'projects')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const projectType = searchParams.get('projectType') || undefined;
        const status = searchParams.get('status') || undefined;
        const search = searchParams.get('search') || undefined;

        const projects = await ProjectService.getProjects({ projectType, status, search });
        return NextResponse.json({ success: true, projects });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'create', 'projects')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await req.json();
        if (!body.title || !body.startDate) {
            return NextResponse.json({ success: false, message: 'Proje başlığı ve başlangıç tarihi zorunludur' }, { status: 400 });
        }

        const project = await ProjectService.createProject(
            {
                ...body,
                createdById: user.id,
            },
            { id: user.id, name: user.name }
        );

        return NextResponse.json({ success: true, project }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

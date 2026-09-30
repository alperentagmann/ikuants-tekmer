import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { AboutService } from '@/lib/services/about-service';

export async function GET() {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const content = await AboutService.getAboutContent();
        return NextResponse.json({ success: true, content });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const body = await request.json();
        const content = await AboutService.updateAboutContent(body, auth);
        return NextResponse.json({ success: true, content });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

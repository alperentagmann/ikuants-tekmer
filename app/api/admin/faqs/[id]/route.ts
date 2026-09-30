import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { FaqService } from '@/lib/services/faq-service';

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const { id } = await props.params;
        const body = await request.json();
        const faq = await FaqService.updateFaq(id, body, auth);
        return NextResponse.json({ success: true, faq });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const { id } = await props.params;
        await FaqService.deleteFaq(id, auth);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

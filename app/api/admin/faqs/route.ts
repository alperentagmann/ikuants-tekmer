import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { FaqService } from '@/lib/services/faq-service';

export async function GET() {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const faqs = await FaqService.getAdminFaqs();
        return NextResponse.json({ success: true, faqs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const body = await request.json();
        if (!body.question || !body.answer) {
            return NextResponse.json({ success: false, error: 'Soru ve Cevap zorunludur.' }, { status: 400 });
        }

        const faq = await FaqService.createFaq(body, auth.user);
        return NextResponse.json({ success: true, faq });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

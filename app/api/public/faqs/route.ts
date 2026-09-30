import { NextResponse } from 'next/server';
import { FaqService } from '@/lib/services/faq-service';

export async function GET() {
    try {
        const faqs = await FaqService.getPublicFaqs();
        return NextResponse.json({ success: true, faqs });
    } catch (error: any) {
        return NextResponse.json({ success: false, faqs: [], error: error.message }, { status: 500 });
    }
}

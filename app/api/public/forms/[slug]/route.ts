import { NextRequest, NextResponse } from 'next/server';
import { FormService } from '@/lib/services/form-service';

export const dynamic = 'force-dynamic';

/** Returns the published version of a public form (questions, sections, consent texts). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        const form = await FormService.getPublishedFormBySlug(slug);
        if (!form) {
            return NextResponse.json({ success: false, message: 'Form bulunamadı veya yayında değil.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, form }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('Public form load failed:', error);
        return NextResponse.json({ success: false, message: 'Form şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.' }, { status: 503 });
    }
}

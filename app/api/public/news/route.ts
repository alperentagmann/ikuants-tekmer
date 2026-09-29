import { NextRequest, NextResponse } from 'next/server';
import { NewsService } from '@/lib/services/news-service';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') || undefined;
        const limitStr = searchParams.get('limit');
        const limit = limitStr ? parseInt(limitStr, 10) : 50;

        const news = await NewsService.getPublicNews({ category, limit });
        return NextResponse.json({ success: true, news });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message, news: [] }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { globalSearch, SEARCH_TYPES, type SearchType } from '@/lib/services/global-search-service';

export async function GET(request: NextRequest) {
    const user = await getCurrentAdminUser();
    if (!user) return NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 });
    try {
        const sp = request.nextUrl.searchParams;
        const q = (sp.get('q') || '').slice(0, 100);
        const types = (sp.get('types') || '').split(',').filter((t): t is SearchType => (SEARCH_TYPES as readonly string[]).includes(t));
        const results = await globalSearch(user, q, types, Number(sp.get('limit') || 5));
        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ success: false, message: 'Arama yapılamadı', results: [] }, { status: 500 });
    }
}

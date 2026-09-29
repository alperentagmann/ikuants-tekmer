import { NextResponse } from 'next/server';
import { EntrepreneurService } from '@/lib/services/entrepreneur-service';

export async function GET() {
    try {
        const entrepreneurs = await EntrepreneurService.getPublicEntrepreneurs();
        return NextResponse.json({ success: true, entrepreneurs });
    } catch (error: any) {
        return NextResponse.json({ success: false, entrepreneurs: [] }, { status: 500 });
    }
}

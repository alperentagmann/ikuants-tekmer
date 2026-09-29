import { NextResponse } from 'next/server';
import { ProgramService } from '@/lib/services/program-service';

export async function GET() {
    try {
        const programs = await ProgramService.getPublicPrograms();
        return NextResponse.json({ success: true, programs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message, programs: [] }, { status: 500 });
    }
}

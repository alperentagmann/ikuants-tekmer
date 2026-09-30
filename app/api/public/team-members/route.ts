import { NextResponse } from 'next/server';
import { TeamService } from '@/lib/services/team-service';

export async function GET() {
    try {
        const team = await TeamService.getPublicTeamMembers();
        return NextResponse.json({ success: true, team });
    } catch (error: any) {
        return NextResponse.json({ success: false, team: [], error: error.message }, { status: 500 });
    }
}

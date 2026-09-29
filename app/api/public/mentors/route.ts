import { NextResponse } from 'next/server';
import { MentorService } from '@/lib/services/mentor-service';

export async function GET() {
    try {
        const mentors = await MentorService.getPublicMentors();
        return NextResponse.json({ success: true, mentors });
    } catch (error: any) {
        return NextResponse.json({ success: false, mentors: [] }, { status: 500 });
    }
}

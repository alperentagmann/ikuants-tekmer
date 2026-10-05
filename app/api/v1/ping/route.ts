import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/public-api';

/** Connectivity check for external systems: GET /api/v1/ping with "Authorization: Bearer ik_…". */
export async function GET(request: NextRequest) {
    return withApiKey(request, null, async (key) => NextResponse.json({ success: true, key: key.name, time: new Date().toISOString() }));
}

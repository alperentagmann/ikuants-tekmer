import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/public-api';
import { PdksService } from '@/lib/services/pdks-service';

/**
 * Kart okuyucu / turnike yazılımından giriş-çıkış hareketi alma.
 * Authorization: Bearer ik_… (Entegrasyon Merkezi → API anahtarı, kapsam: pdks:write)
 * Gövde: { "deviceCode": "TURNIKE-1", "events": [{ "cardUid": "04A1B2C3", "direction": "IN", "occurredAt": "2026-10-27T09:01:00+03:00", "eventId": "123" }] }
 * Aynı eventId veya aynı kart + zaman + yön tekrar gönderilirse mükerrer sayılır (güvenle yeniden gönderilebilir).
 */
export async function POST(request: NextRequest) {
    return withApiKey(request, 'pdks:write', async (key) => {
        try {
            const result = await PdksService.ingestFromDevice(await request.json().catch(() => ({})), key.name);
            return NextResponse.json({ success: true, ...result });
        } catch (error) {
            const e = error as { name?: string; message?: string; status?: number };
            if (e.name === 'DomainError') return NextResponse.json({ success: false, error: e.message }, { status: e.status ?? 400 });
            throw error;
        }
    });
}

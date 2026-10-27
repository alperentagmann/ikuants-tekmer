import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

type P = { params: Promise<{ id: string }> };

/** Hatalı hareketi gerekçeyle geçersiz kılar (silmez). */
export const POST = pdksRoute<P>('manage', 'Hareket güncellenemedi', async (req, { params }, _u, actor) => { const b = (await req.json().catch(() => ({}))) as { reason?: string }; return PdksService.voidEvent((await params).id, String(b.reason ?? ''), actor); });

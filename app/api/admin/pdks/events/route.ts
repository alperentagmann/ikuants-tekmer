import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

/** PDKS Bilgileri: ?scope=<girişimId|STAFF|VISITOR|ALL>&year=&month= zorunlu. */
export const GET = pdksRoute('view', 'Hareketler alınamadı', (req, _c, _u, actor) => PdksService.listEvents(req.nextUrl.searchParams, actor));
export const POST = pdksRoute('manage', 'Hareket kaydedilemedi', async (req, _c, _u, actor) => ({ event: await PdksService.createManualEvent(await req.json().catch(() => ({})), actor) }));

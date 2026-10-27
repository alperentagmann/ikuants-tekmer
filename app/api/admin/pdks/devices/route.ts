import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

export const GET = pdksRoute('view', 'Cihazlar alınamadı', () => PdksService.devices());
export const POST = pdksRoute('manage', 'Cihaz kaydedilemedi', async (req, _c, _u, actor) => ({ device: await PdksService.saveDevice(null, await req.json().catch(() => ({})), actor) }));

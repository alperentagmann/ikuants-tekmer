import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

type P = { params: Promise<{ id: string }> };

/** Düzenleme veya { isActive } ile pasife al / etkinleştir. */
export const PATCH = pdksRoute<P>('manage', 'Cihaz güncellenemedi', async (req, { params }, _u, actor) => ({ device: await PdksService.saveDevice((await params).id, await req.json().catch(() => ({})), actor) }));

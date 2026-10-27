import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

type P = { params: Promise<{ id: string }> };

/** Düzenleme, yeniden atama veya durum (kayıp / bloke / iade). Kart silinmez. */
export const PATCH = pdksRoute<P>('manage', 'Kart güncellenemedi', async (req, { params }, _u, actor) => ({ card: await PdksService.updateCard((await params).id, await req.json().catch(() => ({})), actor) }));

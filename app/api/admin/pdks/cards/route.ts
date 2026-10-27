import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

export const GET = pdksRoute('view', 'Kartlar alınamadı', (req, _c, user, actor) => PdksService.listCards(req.nextUrl.searchParams, user, actor));
export const POST = pdksRoute('manage', 'Kart kaydedilemedi', async (req, _c, _u, actor) => ({ card: await PdksService.createCard(await req.json().catch(() => ({})), actor) }));

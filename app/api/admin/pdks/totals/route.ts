import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

export const GET = pdksRoute('view', 'Rapor alınamadı', (req, _c, _u, actor) => PdksService.totals(req.nextUrl.searchParams, actor));

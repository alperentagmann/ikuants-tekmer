import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

export const GET = pdksRoute('view', 'Oturumlar alınamadı', (req, _c, _u, actor) => PdksService.sessions(req.nextUrl.searchParams, actor));

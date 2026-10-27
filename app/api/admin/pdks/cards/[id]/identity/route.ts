import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

type P = { params: Promise<{ id: string }> };

/** KVKK: maskesiz kimlik no; ayrı izin (pdks:view_identity) ve denetim kaydı (PII_ACCESS). */
export const POST = pdksRoute<P>('view_identity', 'Kimlik bilgisi alınamadı', async (_req, { params }, user, actor) => PdksService.revealIdentity((await params).id, user, actor));

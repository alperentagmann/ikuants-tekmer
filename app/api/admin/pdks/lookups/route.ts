import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

export const GET = pdksRoute('view', 'Seçim listeleri alınamadı', async () => ({ lookups: await PdksService.lookups() }));

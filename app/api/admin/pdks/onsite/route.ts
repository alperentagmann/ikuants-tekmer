import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

export const GET = pdksRoute('view', 'Anlık durum alınamadı', async () => ({ onSite: await PdksService.onSiteNow(), daily: await PdksService.dailyEntries(14) }));

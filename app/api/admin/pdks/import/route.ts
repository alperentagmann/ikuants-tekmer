import { DomainError } from '@/lib/errors';
import { PdksService } from '@/lib/services/pdks-service';
import { pdksRoute } from '@/lib/pdks/route';

/** CSV içe aktarma: { csv: "kart_uid;yon;tarih_saat;..." } — idempotent, satır satır sonuç. */
export const POST = pdksRoute('manage', 'CSV içe aktarılamadı', async (req, _c, _u, actor) => {
    const b = (await req.json().catch(() => ({}))) as { csv?: unknown };
    if (typeof b.csv !== 'string' || !b.csv.trim()) throw new DomainError('CSV içeriği boş.', 400);
    if (b.csv.length > 2_000_000) throw new DomainError('Dosya 2 MB sınırını aşıyor.', 400);
    return { result: await PdksService.importCsv(b.csv, actor) };
});

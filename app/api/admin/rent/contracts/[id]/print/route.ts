import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { logAuditEvent } from '@/lib/audit';
import { RentContractFormService, fillTemplate } from '@/lib/services/rent-contract-form-service';

type P = { params: Promise<{ id: string }> };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

/**
 * Yazdırılabilir kira sözleşmesi. Kurum şablonu (Parametreler → Belge şablonları) tanımlıysa metin
 * {{alan}} yer tutucularıyla doldurulur; değilse bilgi formu basılır. Tarayıcıdan "PDF olarak kaydet".
 */
export async function GET(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'view', 'rent');
    if (auth.error) return auth.error;
    try {
        const { contract, fields, template } = await RentContractFormService.printFields((await params).id);
        await logAuditEvent({ actorId: auth.actor.id, actorName: auth.actor.name, actorEmail: auth.actor.email, action: 'EXPORT', entityType: 'RentContract', entityId: contract.id, newValues: { format: 'print', template: Boolean(template) } });
        const rows = Object.values(fields).filter((f) => f.value).map((f) => `<tr><th>${esc(f.label)}</th><td>${esc(f.value)}</td></tr>`).join('');
        const body = template
            ? `<div class="text">${esc(fillTemplate(template, fields)).replace(/\n/g, '<br>')}</div><h2>Sözleşme bilgileri</h2><table>${rows}</table>`
            : `<table>${rows}</table><p class="hint">Kurumunuzun sözleşme metnini Alan Yönetimi → Poliçeler → Ayarlar → Belge şablonları bölümüne eklerseniz bu sayfa tam metinle basılır.</p>`;
        const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Kira Sözleşmesi ${esc(contract.contractNo)}</title>
<style>
@page{size:A4;margin:18mm}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#111;font-size:12px;line-height:1.5;margin:24px}
h1{font-size:18px;margin:0 0 2px}h2{font-size:14px;margin:20px 0 6px}
.meta{color:#555;margin:0 0 16px}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ccc;padding:5px 8px;text-align:left;vertical-align:top}
th{background:#f4f4f4;width:34%;font-weight:600}
.text{white-space:normal}
.sign{display:flex;gap:40px;margin-top:48px}.sign div{flex:1;border-top:1px solid #333;padding-top:6px;text-align:center}
.hint{color:#777;margin-top:12px}
@media print{.hint,.bar{display:none}}
.bar{margin-bottom:16px}
</style></head><body>
<div class="bar"><button onclick="window.print()">Yazdır / PDF olarak kaydet</button></div>
<h1>Kira Sözleşmesi</h1>
<p class="meta">${esc(contract.contractNo)} · ${esc(fields.sozlesmeTarihi.value)} · ${esc(fields.durum.value)}</p>
${body}
<div class="sign"><div>Kiraya veren</div><div>Kiracı<br>${esc(fields.firmaUnvani.value || fields.girisim.value)}</div></div>
</body></html>`;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    } catch (error) {
        return errorResponse(error, 'Çıktı hazırlanamadı');
    }
}

import { prisma } from '@/lib/prisma';
import { ParameterService } from '@/lib/services/parameter-service';
import { FacilityUnitService } from '@/lib/services/facility-unit-service';

/**
 * Yenileme uyarıları: bitişine "kritik gün" (varsayılan 15) veya daha az kalan aktif kira sözleşmeleri ve poliçeler,
 * ayrıca süresi geçtiği hâlde aktif görünen sözleşmeler. Operasyon Kontrol Merkezi'nde kırmızı uyarı olur ve
 * tüm yöneticilere bildirim düşer (aynı kayıt + eşik için 30 günde bir kez).
 */
export type RenewalItem = { kind: 'RENT' | 'POLICY'; id: string; title: string; detail: string; endDate: Date; daysLeft: number; href: string };

const DAY = 86400000;
const daysLeft = (d: Date) => Math.ceil((+d - Date.now()) / DAY);

export class RenewalAlertService {
    static async scan(): Promise<{ criticalDays: number; warningDays: number; critical: RenewalItem[]; overdue: RenewalItem[] }> {
        const [crit, warn] = await Promise.all([ParameterService.getNumber('ALERTS', 'critical_days'), ParameterService.getNumber('ALERTS', 'expiry_warning_days')]);
        const until = new Date(Date.now() + crit.value * DAY);
        const [contracts, overdueContracts, policies] = await Promise.all([
            prisma.rentContract.findMany({ where: { status: 'ACTIVE', endDate: { gte: new Date(Date.now() - DAY), lte: until } }, orderBy: { endDate: 'asc' }, select: { id: true, contractNo: true, spaceName: true, endDate: true, autoRenew: true, entrepreneur: { select: { name: true } } } }),
            prisma.rentContract.findMany({ where: { status: 'ACTIVE', endDate: { lt: new Date(Date.now() - DAY) } }, orderBy: { endDate: 'asc' }, take: 50, select: { id: true, contractNo: true, spaceName: true, endDate: true, entrepreneur: { select: { name: true } } } }),
            FacilityUnitService.expiringPolicies(crit.value),
        ]);
        const rent = (c: { id: string; contractNo: string; spaceName: string; endDate: Date; entrepreneur: { name: string } }, extra = ''): RenewalItem => ({ kind: 'RENT', id: c.id, title: c.entrepreneur.name, detail: `${c.contractNo} · ${c.spaceName}${extra}`, endDate: c.endDate, daysLeft: daysLeft(c.endDate), href: `/admin/finans/kiralar?contract=${c.id}` });
        return {
            criticalDays: crit.value, warningDays: warn.value,
            critical: [
                ...contracts.map((c) => rent(c, c.autoRenew ? ' · otomatik yenileme işaretli' : '')),
                ...policies.map((p): RenewalItem => ({ kind: 'POLICY', id: p.id, title: p.targetLabel, detail: `${p.policyTypeLabel} · ${p.insurer} · ${p.policyNo}`, endDate: p.endDate, daysLeft: p.daysLeft, href: '/admin/alan-yonetimi/policeler' })),
            ].sort((a, b) => a.daysLeft - b.daysLeft),
            overdue: overdueContracts.map((c) => rent(c, ' · süresi doldu, durum hâlâ aktif')),
        };
    }

    /** Kritik ve süresi geçmiş kayıtlar için yönetici bildirimi üretir (idempotent). Oluşan bildirim sayısını döner. */
    static async notify(): Promise<number> {
        const { critical, overdue, criticalDays } = await this.scan();
        const since = new Date(Date.now() - 30 * DAY);
        let created = 0;
        for (const it of [...critical, ...overdue]) {
            const what = it.kind === 'RENT' ? 'Kira sözleşmesi' : 'Poliçe';
            const title = it.daysLeft < 0 ? `${what} süresi doldu: ${it.title}` : `${what} ${criticalDays} gün içinde bitiyor: ${it.title}`;
            const exists = await prisma.notification.findFirst({ where: { title, targetUrl: it.href, createdAt: { gte: since } }, select: { id: true } });
            if (exists) continue;
            await prisma.notification.create({
                data: { userId: null, title, message: `${it.detail} · bitiş ${it.endDate.toLocaleDateString('tr-TR', { timeZone: 'UTC' })}${it.daysLeft >= 0 ? ` (${it.daysLeft} gün)` : ''}. Yenileme işlemini başlatın.`, notificationType: 'SYSTEM_ALERT', targetUrl: it.href },
            });
            created++;
        }
        return created;
    }
}

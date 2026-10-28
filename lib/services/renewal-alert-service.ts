import { prisma } from '@/lib/prisma';
import { AdminAlertService } from '@/lib/services/admin-alert-service';
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
    static async notify(opts: { includeOverdueRent?: boolean } = {}): Promise<number> {
        const { critical, overdue, criticalDays } = await this.scan();
        const since = new Date(Date.now() - 30 * DAY);
        let created = 0;
        for (const it of [...critical, ...overdue]) {
            const what = it.kind === 'RENT' ? 'Kira sözleşmesi' : 'Poliçe';
            const title = it.daysLeft < 0 ? `${what} süresi doldu: ${it.title}` : `${what} ${criticalDays} gün içinde bitiyor: ${it.title}`;
            const exists = await prisma.notification.findFirst({ where: { title, targetUrl: it.href, createdAt: { gte: since } }, select: { id: true } });
            if (exists) continue;
            const endText = it.endDate.toLocaleDateString('tr-TR', { timeZone: 'UTC' });
            await prisma.notification.create({
                data: { userId: null, title, message: `${it.detail} · bitiş ${endText}${it.daysLeft >= 0 ? ` (${it.daysLeft} gün)` : ''}. Yenileme işlemini başlatın.`, notificationType: 'SYSTEM_ALERT', targetUrl: it.href },
            });
            // Önemli uyarı: e-posta da gider (alıcılar Ayarlar › Uyarılar; SMTP yoksa kuyrukta bekler)
            await AdminAlertService.notify(it.kind === 'RENT' ? 'CONTRACT_RENEWAL' : 'POLICY_RENEWAL', {
                subject: title, heading: title,
                rows: [[it.kind === 'RENT' ? 'Firma' : 'Yer', it.title], ['Ayrıntı', it.detail], ['Bitiş', endText], ['Kalan', it.daysLeft < 0 ? `${-it.daysLeft} gün geçti` : `${it.daysLeft} gün`]],
                link: it.href, entityType: it.kind === 'RENT' ? 'RentContract' : 'InsurancePolicy', entityId: it.id,
            }).catch((e) => console.error('renewal email', e));
            created++;
        }
        return created + (opts.includeOverdueRent === false ? 0 : await this.notifyOverdueRent());
    }

    /** Vadesi geçmiş kira: firma bazında tek bildirim + e-posta; aynı firma için 7 günde bir hatırlatılır. */
    static async notifyOverdueRent(): Promise<number> {
        const rows = await prisma.rentAccrual.findMany({
            where: { remainingAmount: { gt: 0 }, dueDate: { lt: new Date(Date.now() - DAY) }, status: { notIn: ['PAID', 'WAIVED', 'CANCELLED'] } },
            select: { remainingAmount: true, currency: true, dueDate: true, contractId: true, contract: { select: { id: true, contractNo: true, entrepreneur: { select: { id: true, name: true } } } } },
        });
        const byContract = new Map<string, typeof rows>();
        for (const r of rows) byContract.set(r.contractId, [...(byContract.get(r.contractId) ?? []), r]);
        const since = new Date(Date.now() - 7 * DAY);
        let created = 0;
        for (const list of byContract.values()) {
            const c = list[0].contract;
            const href = `/admin/finans/kiralar?contract=${c.id}`;
            const title = `Geciken kira: ${c.entrepreneur.name}`;
            if (await prisma.notification.findFirst({ where: { title, targetUrl: href, createdAt: { gte: since } }, select: { id: true } })) continue;
            const totals = Object.entries(list.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.currency]: (acc[r.currency] ?? 0) + r.remainingAmount }), {}))
                .map(([cur, amt]) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(amt)).join(' + ');
            const oldest = list.map((r) => r.dueDate).sort((a, b) => +a - +b)[0];
            const message = `${c.contractNo} · ${list.length} dönem · ${totals} · en eski vade ${oldest.toLocaleDateString('tr-TR', { timeZone: 'UTC' })}`;
            await prisma.notification.create({ data: { userId: null, title, message, notificationType: 'SYSTEM_ALERT', targetUrl: href } });
            await AdminAlertService.notify('RENT_OVERDUE', {
                subject: title, heading: title,
                rows: [['Sözleşme', c.contractNo], ['Geciken dönem', list.length], ['Toplam', totals], ['En eski vade', oldest.toLocaleDateString('tr-TR', { timeZone: 'UTC' })]],
                link: href, entityType: 'RentContract', entityId: c.id,
            }).catch((e) => console.error('rent overdue email', e));
            created++;
        }
        return created;
    }
}

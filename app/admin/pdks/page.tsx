"use client";
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, BarChart3, CreditCard, ListChecks, Plug, Settings2, Timer, UserCheck } from 'lucide-react';
import { PageHeader, Tabs } from '@/components/admin/ui';
import { useApi, useMe, useNotice, ErrorState } from '@/components/admin/ops-kit';
import { CardsTab, DevicesTab, EventsTab, LiveTab, SessionsTab, SettingsTab, TotalsTab, type PdksLookups } from '@/components/admin/pdks/PdksScreens';

type Tab = 'durum' | 'hareketler' | 'detay' | 'toplam' | 'kartlar' | 'cihazlar' | 'ayarlar';
const TABS: Tab[] = ['durum', 'hareketler', 'detay', 'toplam', 'kartlar', 'cihazlar', 'ayarlar'];

function PdksInner() {
    const { can } = useMe();
    const notice = useNotice();
    const router = useRouter();
    const sp = useSearchParams();
    const initial = sp.get('tab') as Tab | null;
    const [tab, setTabState] = useState<Tab>(initial && TABS.includes(initial) ? initial : 'durum');
    const setTab = (t: Tab) => { setTabState(t); router.replace(`/admin/pdks?tab=${t}`, { scroll: false }); };
    const lookups = useApi<{ lookups: PdksLookups }>('/api/admin/pdks/lookups');
    const l = lookups.data?.lookups;
    const manage = can('manage', 'pdks');

    if (lookups.error?.status === 403 || lookups.error?.status === 401) return <><PageHeader icon={Timer} title="PDKS & RFID Kartlar" /><ErrorState error={lookups.error} /></>;

    return (
        <div className="space-y-5">
            <PageHeader icon={Timer} title="PDKS & RFID Kartlar" description="Personel, girişim çalışanı ve ziyaretçi giriş-çıkışları. Kart tanımlama, manuel ve CSV kayıt, cihaz entegrasyonu, çalışma süresi raporları." />
            <Tabs<Tab> value={tab} onChange={setTab} tabs={[
                { value: 'durum', label: 'Anlık Durum', icon: UserCheck },
                { value: 'hareketler', label: 'PDKS Bilgileri', icon: ListChecks },
                { value: 'detay', label: 'PDKS Detay', icon: Activity },
                { value: 'toplam', label: 'Toplam Raporu', icon: BarChart3 },
                { value: 'kartlar', label: 'RFID Kartlar', icon: CreditCard },
                { value: 'cihazlar', label: 'Cihazlar & Entegrasyon', icon: Plug },
                ...(can('view', 'parameters') ? [{ value: 'ayarlar' as Tab, label: 'Ayarlar', icon: Settings2 }] : []),
            ]} />
            {tab === 'durum' && <LiveTab />}
            {tab === 'hareketler' && <EventsTab lookups={l} canManage={manage} canExport={can('view', 'pdks')} notify={notice} />}
            {tab === 'detay' && <SessionsTab lookups={l} canExport={can('view', 'pdks')} />}
            {tab === 'toplam' && <TotalsTab lookups={l} canExport={can('view', 'pdks')} />}
            {tab === 'kartlar' && <CardsTab lookups={l} canManage={manage} canExport={can('view', 'pdks')} canIdentity={can('view_identity', 'pdks')} notify={notice} onChanged={lookups.reload} />}
            {tab === 'cihazlar' && <DevicesTab lookups={l} canManage={manage} notify={notice} />}
            {tab === 'ayarlar' && <SettingsTab canManage={can('manage', 'parameters')} notify={notice} />}
            {notice.node}
        </div>
    );
}

export default function PdksPage() {
    return <Suspense><PdksInner /></Suspense>;
}

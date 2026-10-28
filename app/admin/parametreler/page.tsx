"use client";
import { SlidersHorizontal } from 'lucide-react';
import { Card, PageHeader } from '@/components/admin/ui';
import { useApi, useMe, useNotice, ErrorState, LoadingRows } from '@/components/admin/ops-kit';
import { ParameterManager } from '@/components/admin/parameters/ParameterManager';

type Categories = Record<string, { label: string; description: string }>;

/** Sistem parametreleri: seçenek listeleri, eşik değerleri, belge şablonları. Kurumdan teyit edilmemiş değerler koda gömülmez. */
export default function ParametersPage() {
    const { can } = useMe();
    const notice = useNotice();
    const q = useApi<{ categories: Categories }>('/api/admin/parameters?category=ALERTS');
    return (
        <div className="space-y-5">
            <PageHeader icon={SlidersHorizontal} title="Sistem Parametreleri" description="Poliçe türleri, uyarı süreleri, PDKS sınırları, mentörlük hedefi ve girişim sağlık eşikleri, belge şablonları. Kayıt silinmez; seçenekler pasife alınır." />
            {q.error ? <Card padded={false}><ErrorState error={q.error} onRetry={q.reload} /></Card> : !q.data ? <Card padded={false}><LoadingRows rows={4} /></Card> : (
                Object.entries(q.data.categories).map(([key, cat]) => (
                    <Card key={key}>
                        <h2 className="mb-3 text-sm font-semibold text-white">{cat.label}</h2>
                        <ParameterManager category={key} canManage={can('manage', 'parameters')} notify={notice} />
                    </Card>
                ))
            )}
            {notice.node}
        </div>
    );
}

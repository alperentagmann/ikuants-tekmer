"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wand2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui';
import { PlacementWizard } from '@/components/admin/facilities/PlacementWizard';

function Inner() {
    const entrepreneurId = useSearchParams().get('entrepreneurId') ?? undefined;
    return (
        <div className="space-y-5">
            <PageHeader icon={Wand2} title="Firma Yerleştir" description="Tek kayıt: firma ve şirket bilgisi, masa / ofis (masa no), tarihler, kira sözleşmesi ve ıslak imzalı tarama. Kaydedince hepsi birbirine bağlanır; sözleşmede sonradan yapılan değişiklikler tahsislere yansır." />
            <PlacementWizard defaultEntrepreneurId={entrepreneurId} />
        </div>
    );
}

export default function PlacementPage() {
    return <Suspense><Inner /></Suspense>;
}

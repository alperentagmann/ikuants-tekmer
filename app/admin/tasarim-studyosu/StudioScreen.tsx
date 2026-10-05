'use client';

import { PenTool } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui';
import { HomepageDesignStudio } from '@/components/admin/homepage/HomepageDesignStudio';
import type { PageKey } from '@/lib/homepage-layout';

export function StudioScreen({ initialPage }: { initialPage: PageKey }) {
    return (
        <div className="space-y-5">
            <PageHeader
                title="Tasarım Stüdyosu"
                description="Sayfa bölümlerini tuval üzerinde sürükleyerek sıralayın, metinleri ve tasarım dilini düzenleyin. Her değişiklik taslağa otomatik kaydedilir; ziyaretçiler yalnızca yayınladığınız sürümü görür."
                icon={PenTool}
            />
            <HomepageDesignStudio initialPage={initialPage} />
        </div>
    );
}

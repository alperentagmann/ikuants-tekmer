import Link from "next/link";
import { Compass, LayoutDashboard, Search } from "lucide-react";

/** Unknown admin route. */
export default function AdminNotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="glass-card max-w-lg rounded-2xl border border-white/10 p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"><Compass className="h-7 w-7" /></div>
                <h1 className="mb-2 text-xl font-semibold text-white">Ekran bulunamadı</h1>
                <p className="mb-6 text-sm text-gray-400">Aradığınız yönetim ekranı taşınmış veya kaldırılmış olabilir. Ctrl + K ile arayarak doğru ekrana ulaşabilirsiniz.</p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"><LayoutDashboard className="h-4 w-4" /> Panele dön</Link>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300"><Search className="h-4 w-4" /> Ctrl + K</span>
                </div>
            </div>
        </div>
    );
}

"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/components/admin/ui';

const ITEMS = [
    { href: '/admin/alan-yonetimi', label: 'Alan - Bina Detay', exact: true },
    { href: '/admin/alan-yonetimi/katlar', label: 'Bina Kat Bilgileri' },
    { href: '/admin/alan-yonetimi/bolumler', label: 'Bağımsız Bölüm Yönetimi' },
    { href: '/admin/alan-yonetimi/eslestirme', label: 'Firma - Bölüm Eşleştirme' },
    { href: '/admin/alan-yonetimi/kiralanan', label: 'Kiralanan Alan Bilgileri' },
    { href: '/admin/alan-yonetimi/policeler', label: 'Tüm Poliçeler' },
];

export default function FacilitiesLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    return (
        <div className="space-y-5">
            <nav aria-label="Alan yönetimi" className="-mx-1 overflow-x-auto">
                <ul className="flex min-w-max gap-1 border-b border-white/10 px-1">
                    {ITEMS.map((it) => {
                        const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`);
                        return (
                            <li key={it.href}>
                                <Link href={it.href} aria-current={active ? 'page' : undefined}
                                    className={cx('-mb-px block border-b-2 px-3 py-2.5 text-sm transition-colors', active ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-200')}>
                                    {it.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            {children}
        </div>
    );
}

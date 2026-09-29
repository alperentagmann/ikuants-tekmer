import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata = {
    title: 'Admin Paneli | İKÜANTS TEKMER',
    robots: 'noindex, nofollow',
};

export default function RootAdminLayout({ children }: { children: React.ReactNode }) {
    return <AdminLayout>{children}</AdminLayout>;
}

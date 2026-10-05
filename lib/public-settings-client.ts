'use client';
import { useEffect, useState } from 'react';
import type { PublicSettings } from '@/lib/site-settings';

export type ClientPublicSettings = Omit<PublicSettings, 'cookiePolicy'>;

let cached: Promise<ClientPublicSettings | null> | null = null;

/** One shared request for the public settings per page load (navbar, footer, cookie banner, effects). */
export function loadPublicSettings(): Promise<ClientPublicSettings | null> {
    if (!cached) {
        cached = fetch('/api/public/settings')
            .then((r) => r.json())
            .then((d) => (d?.settings ? (d.settings as ClientPublicSettings) : null))
            .catch(() => {
                cached = null;
                return null;
            });
    }
    return cached;
}

export function usePublicSettings(): ClientPublicSettings | null {
    const [settings, setSettings] = useState<ClientPublicSettings | null>(null);
    useEffect(() => {
        let alive = true;
        loadPublicSettings().then((s) => alive && setSettings(s));
        return () => {
            alive = false;
        };
    }, []);
    return settings;
}

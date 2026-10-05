'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global deep-link handler for create actions, e.g. /admin/girisimciler?action=create.
 * Pages mark their existing create buttons with data-intent="create" (or another
 * intent name). One mechanism serves every entity, so quick-create menus, dashboard
 * shortcuts and AI result cards reuse the page's own create dialog.
 */
export function ActionIntentListener() {
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const intent = params.get('action');
        if (!intent) return;

        let attempts = 0;
        const timer = window.setInterval(() => {
            attempts++;
            const target = document.querySelector<HTMLElement>(`[data-intent="${CSS.escape(intent)}"]`);
            if (target) {
                window.clearInterval(timer);
                target.click();
                params.delete('action');
                const rest = params.toString();
                window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`);
            } else if (attempts > 40) {
                window.clearInterval(timer);
            }
        }, 150);
        return () => window.clearInterval(timer);
    }, [pathname]);

    return null;
}

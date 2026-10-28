"use client";
import { useEffect } from 'react';

/**
 * Sayfanın (taslak önizleme dahil) tema değişkenlerini sitenin tamamını saran kapsayıcıya da uygular:
 * üst menü, alt bilgi ve butonlar sayfa bölümleriyle aynı renkte görünür. Sayfadan çıkınca eski değerler geri gelir.
 */
export function SiteThemeSync({ vars }: { vars: Record<string, string> }) {
    const key = JSON.stringify(vars);
    useEffect(() => {
        const root = document.getElementById('site-theme-root');
        if (!root) return;
        const parsed = JSON.parse(key) as Record<string, string>;
        const previous = Object.fromEntries(Object.keys(parsed).map((k) => [k, root.style.getPropertyValue(k)]));
        for (const [k, v] of Object.entries(parsed)) root.style.setProperty(k, v);
        return () => {
            for (const [k, v] of Object.entries(previous)) {
                if (v) root.style.setProperty(k, v);
                else root.style.removeProperty(k);
            }
        };
    }, [key]);
    return null;
}

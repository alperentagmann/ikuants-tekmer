"use client";
/**
 * Yatay kaydırma yardımı (tüm yönetim paneli): genişliği ekrana sığmayan bir tablo / kutu görünürken
 * kendi kaydırma çubuğu ekranın altında kalıyorsa, ekranın altına sabit bir kaydırma çubuğu ve
 * sağ / sol düğmeleri gösterilir. Kullanıcı en alta inmeden yana kaydırabilir.
 * Kapsayıcıya özel kod gerekmez: `main` içindeki yatay taşan her öğe otomatik algılanır.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Target = { el: HTMLElement; left: number; width: number };

function scrollableX(root: HTMLElement): HTMLElement[] {
    const out: HTMLElement[] = [];
    root.querySelectorAll<HTMLElement>('*').forEach((el) => {
        if (el.scrollWidth - el.clientWidth < 8 || el.clientWidth < 120) return;
        const ox = getComputedStyle(el).overflowX;
        if (ox === 'auto' || ox === 'scroll') out.push(el);
    });
    return out;
}

export function ScrollAssist() {
    const pathname = usePathname();
    const [target, setTarget] = useState<Target | null>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const syncing = useRef(false);
    const [edge, setEdge] = useState({ start: true, end: false });

    // Aday kapsayıcılar yalnız DOM / boyut değişince yeniden taranır; kaydırmada önbellek kullanılır
    const candidates = useRef<HTMLElement[]>([]);
    const rescan = useCallback(() => {
        const main = document.querySelector('main');
        candidates.current = main ? scrollableX(main) : [];
    }, []);

    const pick = useCallback(() => {
        const vh = window.innerHeight;
        const hit = candidates.current.find((el) => {
            if (!el.isConnected) return false;
            const r = el.getBoundingClientRect();
            return r.top < vh - 80 && r.bottom > vh && r.width > 0;
        });
        if (!hit) return setTarget(null);
        const r = hit.getBoundingClientRect();
        setTarget((t) => (t && t.el === hit && t.left === r.left && t.width === r.width ? t : { el: hit, left: r.left, width: r.width }));
    }, []);

    useEffect(() => {
        let raf = 0, timer: ReturnType<typeof setTimeout> | undefined;
        const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(pick); };
        const full = () => { clearTimeout(timer); timer = setTimeout(() => { rescan(); schedule(); }, 150); };
        full();
        window.addEventListener('scroll', schedule, { passive: true, capture: true });
        window.addEventListener('resize', full);
        const mo = new MutationObserver(full);
        const main = document.querySelector('main');
        if (main) mo.observe(main, { childList: true, subtree: true });
        return () => { cancelAnimationFrame(raf); clearTimeout(timer); window.removeEventListener('scroll', schedule, { capture: true }); window.removeEventListener('resize', full); mo.disconnect(); };
    }, [pick, rescan, pathname]);

    // Çubuk ↔ hedef senkronu
    useEffect(() => {
        const el = target?.el;
        const bar = barRef.current;
        if (!el || !bar || !innerRef.current) return;
        innerRef.current.style.width = `${el.scrollWidth}px`;
        bar.scrollLeft = el.scrollLeft;
        const update = () => setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
        update();
        const fromEl = () => { if (syncing.current) { syncing.current = false; return; } syncing.current = true; bar.scrollLeft = el.scrollLeft; update(); };
        const fromBar = () => { if (syncing.current) { syncing.current = false; return; } syncing.current = true; el.scrollLeft = bar.scrollLeft; update(); };
        el.addEventListener('scroll', fromEl, { passive: true });
        bar.addEventListener('scroll', fromBar, { passive: true });
        return () => { el.removeEventListener('scroll', fromEl); bar.removeEventListener('scroll', fromBar); };
    }, [target]);

    if (!target) return null;
    const step = (dir: 1 | -1) => target.el.scrollBy({ left: dir * Math.max(200, target.el.clientWidth * 0.7), behavior: 'smooth' });
    return (
        <div className="fixed bottom-0 z-40 flex items-center gap-1 rounded-t-lg border border-b-0 border-white/10 bg-[#0d0d17]/95 px-1 py-1 shadow-2xl backdrop-blur"
            style={{ left: Math.max(0, target.left), width: Math.min(target.width, window.innerWidth - Math.max(0, target.left)) }}
            role="group" aria-label="Tabloyu yana kaydır">
            <button type="button" onClick={() => step(-1)} disabled={edge.start} aria-label="Sola kaydır" className="rounded p-1 text-gray-300 hover:bg-white/10 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <div ref={barRef} className="h-3.5 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-color:rgba(255,255,255,0.35)_transparent]" tabIndex={-1}>
                <div ref={innerRef} className="h-px" />
            </div>
            <button type="button" onClick={() => step(1)} disabled={edge.end} aria-label="Sağa kaydır" className="rounded p-1 text-gray-300 hover:bg-white/10 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
    );
}

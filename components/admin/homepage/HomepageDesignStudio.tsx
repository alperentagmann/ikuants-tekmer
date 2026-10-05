'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Plus, Globe, RotateCcw, ExternalLink, Palette, LayoutTemplate, History, ImagePlus, X, GripVertical, Copy, Undo2, Redo2, Monitor, Tablet, Smartphone, Loader2, Check, CloudOff, MousePointerClick, SlidersHorizontal } from 'lucide-react';
import { api, Alert, Badge, Button, Card, Modal, Skeleton, Field, TextInput, TextArea, Select, formatDateTime } from '@/components/admin/ui';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { BLOCK_LIBRARY, DEFAULT_STYLE, PAGE_DEFS, PAGE_KEYS, PAGE_TEXTS, THEME_PRESETS, blockAllowed, type BlockType, type HomeBlock, type HomeLayout, type HomeTheme, type PageKey } from '@/lib/homepage-layout';

type HistoryRow = { index: number; publishedAt: string; publishedBy: string | null; blockCount: number; preset: string };
type EditorState = { published: HomeLayout; draft: HomeLayout; hasDraft: boolean; history: HistoryRow[]; forms: { slug: string; title: string }[]; canPublish: boolean };

/** Where the records of a built-in section are managed. */
const MANAGED_IN: Partial<Record<BlockType, string>> = {
    hero: 'Ana Sayfa & Banner › Hero Slider',
    entrepreneurs: 'Girişimciler',
    partners: 'Partner & Logolar',
    programsList: 'Programlar',
    supportsGrid: 'Destekler',
    supportsForms: 'Form Builder › Kullanıldığı yer',
    spacesList: 'Kullanım Alanları',
    spacesForms: 'Form Builder › Kullanıldığı yer',
};

const uid = (t: string) => `${t}-${Math.random().toString(36).slice(2, 8)}`;

function ImageInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <Field label={label}>
            <div className="flex items-center gap-2">
                {value ? <img src={value} alt="" className="h-12 w-16 rounded object-cover" /> : <div className="flex h-12 w-16 items-center justify-center rounded border border-dashed border-white/15 text-gray-500"><ImagePlus className="h-4 w-4" /></div>}
                <TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/... veya https://..." />
                <Button size="sm" onClick={() => setOpen(true)}>Seç</Button>
                {value && <Button size="sm" variant="ghost" onClick={() => onChange('')}>Kaldır</Button>}
            </div>
            <MediaPickerModal isOpen={open} onClose={() => setOpen(false)} onSelect={(url) => { onChange(url); setOpen(false); }} />
        </Field>
    );
}

function BlockConfigEditor({ block, onChange, forms }: { block: HomeBlock; onChange: (b: HomeBlock) => void; forms: { slug: string; title: string }[] }) {
    const c = block.config as Record<string, unknown>;
    const setC = (patch: Record<string, unknown>) => onChange({ ...block, config: { ...c, ...patch } });
    const s = block.style;
    const setS = (patch: Partial<HomeBlock['style']>) => onChange({ ...block, style: { ...s, ...patch } });
    const text = (key: string, label: string, multiline = false, hint?: string) => (
        <Field label={label} hint={hint} htmlFor={`cfg-${key}`}>
            {multiline ? <TextArea id={`cfg-${key}`} rows={4} value={String(c[key] ?? '')} onChange={(e) => setC({ [key]: e.target.value })} /> : <TextInput id={`cfg-${key}`} value={String(c[key] ?? '')} onChange={(e) => setC({ [key]: e.target.value })} />}
        </Field>
    );
    const builtIn = Boolean(BLOCK_LIBRARY[block.type].builtIn);
    const managedIn = MANAGED_IN[block.type];
    const pageTexts = PAGE_TEXTS[block.type];

    return (
        <div className="space-y-4">
            {builtIn && (
                <Alert tone="info">
                    {managedIn ? `Bu bölümün kayıtları "${managedIn}" ekranından yönetilir. ` : 'Bu bölüm sayfanın özgün tasarımıdır. '}
                    {pageTexts ? 'Metinlerini aşağıdan değiştirebilirsiniz; boş bıraktığınız alanda orijinal metin görünür.' : 'Burada sırası ve görünürlüğü ayarlanır.'}
                </Alert>
            )}
            {pageTexts?.map((f) => (
                <Field key={f.field} label={f.label} htmlFor={`cfg-${f.field}`} hint={f.link ? '/sayfa veya https://...' : undefined}>
                    {f.multiline ? (
                        <TextArea id={`cfg-${f.field}`} rows={3} value={String(c[f.field] ?? '')} placeholder={f.original} onChange={(e) => setC({ [f.field]: e.target.value })} />
                    ) : (
                        <TextInput id={`cfg-${f.field}`} value={String(c[f.field] ?? '')} placeholder={f.original} onChange={(e) => setC({ [f.field]: e.target.value })} />
                    )}
                </Field>
            ))}

            {(block.type === 'programs' || block.type === 'spaces' || block.type === 'supports' || block.type === 'news') && (
                <>
                    {text('title', 'Başlık')}
                    {text('subtitle', 'Alt başlık')}
                    <Field label="Gösterilecek kayıt sayısı"><TextInput type="number" min={1} max={12} value={Number(c.limit) || 3} onChange={(e) => setC({ limit: Number(e.target.value) })} /></Field>
                </>
            )}
            {block.type === 'banner' && (
                <>
                    {text('title', 'Başlık')}
                    {text('text', 'Metin', true)}
                    <ImageInput label="Görsel" value={String(c.imageUrl || '')} onChange={(v) => setC({ imageUrl: v })} />
                    <Field label="Yerleşim"><Select value={String(c.layout || 'image-right')} onChange={(e) => setC({ layout: e.target.value })} options={[{ value: 'image-right', label: 'Görsel sağda' }, { value: 'image-left', label: 'Görsel solda' }, { value: 'full', label: 'Tam genişlik görsel' }]} /></Field>
                    <div className="grid grid-cols-2 gap-3">{text('buttonText', 'Buton metni')}{text('buttonLink', 'Buton linki', false, '/programlar veya https://...')}</div>
                    <Field label="Buton rengi (boşsa tema rengi)"><div className="flex items-center gap-2"><input type="color" value={String(c.accent || '#7c3aed')} onChange={(e) => setC({ accent: e.target.value })} className="h-9 w-12 rounded" /><Button size="sm" variant="ghost" onClick={() => setC({ accent: '' })}>Tema rengi</Button></div></Field>
                </>
            )}
            {block.type === 'cta' && (
                <>
                    {text('title', 'Başlık')}
                    {text('text', 'Metin', true)}
                    <div className="grid grid-cols-2 gap-3">{text('primaryText', 'Ana buton')}{text('primaryLink', 'Ana buton linki')}{text('secondaryText', 'İkinci buton')}{text('secondaryLink', 'İkinci buton linki')}</div>
                </>
            )}
            {block.type === 'richText' && (<>{text('title', 'Başlık')}{text('body', 'Metin', true)}</>)}
            {block.type === 'stats' && (
                <>
                    {text('title', 'Başlık')}
                    <Field label="Sayılar" hint="Doğrulanmış değerleri girin; sistem değer üretmez.">
                        <div className="space-y-2">
                            {((c.items as { value: string; label: string }[]) || []).map((item, i, arr) => (
                                <div key={i} className="flex gap-2">
                                    <TextInput value={item.value} placeholder="Değer (ör. 120+)" onChange={(e) => setC({ items: arr.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)) })} />
                                    <TextInput value={item.label} placeholder="Etiket (ör. Girişim)" onChange={(e) => setC({ items: arr.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
                                    <Button size="sm" variant="ghost" icon={X} onClick={() => setC({ items: arr.filter((_, k) => k !== i) })} aria-label="Kaldır" />
                                </div>
                            ))}
                            <Button size="sm" icon={Plus} onClick={() => setC({ items: [...((c.items as unknown[]) || []), { value: '', label: '' }] })}>Sayı ekle</Button>
                        </div>
                    </Field>
                </>
            )}
            {block.type === 'form' && (
                <>
                    <Field label="Form" required><Select value={String(c.formSlug || '')} onChange={(e) => setC({ formSlug: e.target.value })} placeholder="Yayındaki bir form seçin" options={forms.map((f) => ({ value: f.slug, label: f.title }))} /></Field>
                    {text('title', 'Başlık')}
                    {text('description', 'Açıklama', true)}
                </>
            )}
            {block.type === 'gallery' && (
                <>
                    {text('title', 'Başlık')}
                    <GalleryInput images={(c.images as { url: string; caption: string }[]) || []} onChange={(images) => setC({ images })} />
                </>
            )}

            {!builtIn && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Bölüm görünümü</div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Arka plan"><Select value={s.background} onChange={(e) => setS({ background: e.target.value as HomeBlock['style']['background'] })} options={[{ value: 'default', label: 'Sayfa rengi' }, { value: 'muted', label: 'Açık kutu' }, { value: 'contrast', label: 'Koyu' }, { value: 'gradient', label: 'Tema renk geçişi' }, { value: 'image', label: 'Görsel' }]} /></Field>
                        <Field label="Dikey boşluk"><Select value={s.paddingY} onChange={(e) => setS({ paddingY: e.target.value as HomeBlock['style']['paddingY'] })} options={[{ value: 'none', label: 'Yok' }, { value: 'sm', label: 'Az' }, { value: 'md', label: 'Orta' }, { value: 'lg', label: 'Çok' }]} /></Field>
                        <Field label="Hizalama"><Select value={s.align} onChange={(e) => setS({ align: e.target.value as HomeBlock['style']['align'] })} options={[{ value: 'center', label: 'Ortalı' }, { value: 'left', label: 'Sola dayalı' }]} /></Field>
                    </div>
                    {s.background === 'image' && <ImageInput label="Arka plan görseli" value={s.backgroundImage || ''} onChange={(v) => setS({ backgroundImage: v })} />}
                </div>
            )}
        </div>
    );
}

function GalleryInput({ images, onChange }: { images: { url: string; caption: string }[]; onChange: (v: { url: string; caption: string }[]) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <Field label={`Görseller (${images.length})`}>
            <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                    <div key={img.url + i} className="relative overflow-hidden rounded border border-white/10">
                        <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                        <input value={img.caption} onChange={(e) => onChange(images.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)))} placeholder="Açıklama" className="w-full bg-black/60 px-1.5 py-1 text-[10px] text-white outline-none" />
                        <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} className="absolute right-1 top-1 rounded bg-black/70 p-0.5 text-white" aria-label="Kaldır"><X className="h-3 w-3" /></button>
                    </div>
                ))}
                <button type="button" onClick={() => setOpen(true)} className="flex aspect-square items-center justify-center rounded border border-dashed border-white/15 text-gray-500 hover:text-white"><ImagePlus className="h-5 w-5" /></button>
            </div>
            <MediaPickerModal isOpen={open} onClose={() => setOpen(false)} onSelect={(url) => { onChange([...images, { url, caption: '' }]); setOpen(false); }} />
        </Field>
    );
}


type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';
type Device = 'desktop' | 'tablet' | 'mobile';
type Panel = 'blocks' | 'theme' | 'versions';
type CanvasFrames = { src: [string, string]; active: number; pending: number | null };

const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 820, mobile: 390 };
const endpoint = (page: PageKey) => `/api/admin/homepage/layout?page=${page}`;
const canvasUrl = (page: PageKey, stamp?: number) => `${PAGE_DEFS[page].path}?onizleme=1&studio=1${stamp ? `&_r=${stamp}` : ''}`;

/** Moves a block one visible position up or down (hidden blocks are skipped, so the canvas always changes). */
function moveStep(l: HomeLayout, id: string, dir: -1 | 1): HomeLayout {
    const blocks = [...l.blocks];
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return l;
    let j = i + dir;
    while (j >= 0 && j < blocks.length && !blocks[j].visible) j += dir;
    if (j < 0 || j >= blocks.length) return l;
    const [b] = blocks.splice(i, 1);
    blocks.splice(j, 0, b);
    return { ...l, blocks };
}

/** Inserts the block before position `to` of the current list (to = length → end). */
function moveToIndex(l: HomeLayout, id: string, to: number): HomeLayout {
    const i = l.blocks.findIndex((b) => b.id === id);
    if (i < 0) return l;
    const k = to > i ? to - 1 : to;
    if (k === i) return l;
    const blocks = [...l.blocks];
    const [b] = blocks.splice(i, 1);
    blocks.splice(k, 0, b);
    return { ...l, blocks };
}

function moveRelative(l: HomeLayout, id: string, targetId: string, position: 'before' | 'after'): HomeLayout {
    const t = l.blocks.findIndex((b) => b.id === targetId);
    if (t < 0 || id === targetId) return l;
    return moveToIndex(l, id, position === 'before' ? t : t + 1);
}

function SaveIndicator({ state, savedAt, hasDraft, onRetry }: { state: SaveState; savedAt: string | null; hasDraft: boolean; onRetry: () => void }) {
    if (state === 'saving' || state === 'pending')
        return <span className="inline-flex items-center gap-1.5 text-xs text-amber-200"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {state === 'saving' ? 'Kaydediliyor…' : 'Değişiklik algılandı…'}</span>;
    if (state === 'error')
        return (
            <span className="inline-flex items-center gap-2 text-xs text-rose-300">
                <CloudOff className="h-3.5 w-3.5" /> Kaydedilemedi
                <button type="button" onClick={onRetry} className="rounded-md border border-rose-400/40 px-2 py-0.5 font-semibold hover:bg-rose-500/10">Tekrar dene</button>
            </span>
        );
    if (state === 'saved') return <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300"><Check className="h-3.5 w-3.5" /> Taslak kaydedildi{savedAt ? ` · ${formatDateTime(savedAt)}` : ''}</span>;
    return <span className="text-xs text-gray-400">{hasDraft ? 'Kayıtlı taslak var (yayınlanmadı)' : 'Yayındaki sürümle aynı'}</span>;
}

/**
 * Visual page designer: pick a page, drag sections in the list or directly on the live canvas,
 * edit content and theme. Every change is saved to the draft automatically; visitors see it only
 * after "Yayınla". Undo / redo with Ctrl+Z / Ctrl+Shift+Z.
 */
export function HomepageDesignStudio({ initialPage = 'home' }: { initialPage?: PageKey }) {
    const [page, setPage] = useState<PageKey>(initialPage);
    const [state, setState] = useState<EditorState | null>(null);
    const [layout, setLayout] = useState<HomeLayout | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [panel, setPanel] = useState<Panel>('blocks');
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger' | 'info' | 'warning'; text: string } | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [device, setDevice] = useState<Device>('desktop');
    const [undoCount, setUndoCount] = useState({ past: 0, future: 0 });
    const [drag, setDrag] = useState<{ id: string; over: number | null } | null>(null);
    const [frames, setFrames] = useState<CanvasFrames>({ src: ['', ''], active: 0, pending: null });
    const [stage, setStage] = useState({ w: 960, h: 720 });

    const layoutRef = useRef<HomeLayout | null>(null);
    const pageRef = useRef<PageKey>(initialPage);
    const pastRef = useRef<HomeLayout[]>([]);
    const futureRef = useRef<HomeLayout[]>([]);
    const coalesceRef = useRef<{ key: string; at: number } | null>(null);
    const versionRef = useRef(0);
    const savedVersionRef = useRef(0);
    const delayRef = useRef(900);
    const savingRef = useRef<Promise<boolean> | null>(null);
    const selectedRef = useRef<string | null>(null);
    const fromCanvasRef = useRef(false);
    const framesRef = useRef(frames);
    const frameA = useRef<HTMLIFrameElement>(null);
    const frameB = useRef<HTMLIFrameElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    const ready = Boolean(layout && state);
    const dirty = saveState === 'pending' || saveState === 'saving' || saveState === 'error';

    useEffect(() => {
        framesRef.current = frames;
    }, [frames]);

    const frameEl = (i: number) => (i === 0 ? frameA : frameB).current;

    const refreshCanvas = useCallback(() => {
        const stamp = Date.now();
        setFrames((f) => {
            const next = f.pending ?? 1 - f.active;
            const src: [string, string] = [...f.src];
            src[next] = canvasUrl(pageRef.current, stamp);
            return { ...f, src, pending: next };
        });
    }, []);

    const load = useCallback(async (p: PageKey) => {
        try {
            const d = await api<EditorState>(endpoint(p));
            layoutRef.current = d.draft;
            pastRef.current = [];
            futureRef.current = [];
            versionRef.current = 0;
            savedVersionRef.current = 0;
            setUndoCount({ past: 0, future: 0 });
            setState(d);
            setLayout(d.draft);
            setSaveState('idle');
            setFrames((f) => (f.src[f.active] && f.src[f.active].startsWith(canvasUrl(p)) ? f : { src: [canvasUrl(p), ''], active: 0, pending: 0 }));
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Tasarım yüklenemedi' });
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(pageRef.current), 0);
        return () => clearTimeout(t);
    }, [load]);

    /** Saves the newest layout; edits made while a save is running are saved right after it. */
    const saveNow = useCallback((): Promise<boolean> => {
        if (savingRef.current) return savingRef.current;
        if (!layoutRef.current || versionRef.current === savedVersionRef.current) return Promise.resolve(true);
        const run = (async () => {
            let ok = true;
            while (layoutRef.current && versionRef.current !== savedVersionRef.current) {
                const v = versionRef.current;
                setSaveState('saving');
                try {
                    await api(endpoint(pageRef.current), { method: 'PUT', json: { layout: layoutRef.current } });
                    savedVersionRef.current = v;
                } catch (e) {
                    ok = false;
                    setSaveState('error');
                    setNotice({ tone: 'danger', text: e instanceof Error ? `Taslak kaydedilemedi: ${e.message}` : 'Taslak kaydedilemedi' });
                    break;
                }
            }
            if (ok) {
                setSaveState('saved');
                setSavedAt(new Date().toISOString());
                setState((s) => (s ? { ...s, hasDraft: true } : s));
                refreshCanvas();
            }
            savingRef.current = null;
            return ok;
        })();
        savingRef.current = run;
        return run;
    }, [refreshCanvas]);

    // Autosave: a short pause after the last change (moves are saved almost immediately)
    useEffect(() => {
        if (saveState !== 'pending') return;
        const t = setTimeout(() => void saveNow(), delayRef.current);
        return () => clearTimeout(t);
    }, [saveState, layout, saveNow]);

    useEffect(() => {
        if (!dirty) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    const apply = useCallback((fn: (l: HomeLayout) => HomeLayout, opts: { coalesce?: string; immediate?: boolean } = {}) => {
        const cur = layoutRef.current;
        if (!cur) return;
        const next = fn(cur);
        if (next === cur) return;
        const now = Date.now();
        const last = coalesceRef.current;
        if (!(opts.coalesce && last && last.key === opts.coalesce && now - last.at < 1200)) {
            pastRef.current = [...pastRef.current.slice(-49), cur];
            futureRef.current = [];
        }
        coalesceRef.current = opts.coalesce ? { key: opts.coalesce, at: now } : null;
        layoutRef.current = next;
        versionRef.current += 1;
        delayRef.current = opts.immediate ? 150 : 900;
        setLayout(next);
        setSaveState('pending');
        setUndoCount({ past: pastRef.current.length, future: futureRef.current.length });
    }, []);

    const travel = useCallback((dir: 'undo' | 'redo') => {
        const from = dir === 'undo' ? pastRef : futureRef;
        const to = dir === 'undo' ? futureRef : pastRef;
        const target = from.current.pop();
        const cur = layoutRef.current;
        if (!target || !cur) return;
        to.current.push(cur);
        coalesceRef.current = null;
        layoutRef.current = target;
        versionRef.current += 1;
        delayRef.current = 300;
        setLayout(target);
        setSaveState('pending');
        setUndoCount({ past: pastRef.current.length, future: futureRef.current.length });
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (!(e.ctrlKey || e.metaKey)) return;
            const k = e.key.toLowerCase();
            if (k === 'z') {
                e.preventDefault();
                travel(e.shiftKey ? 'redo' : 'undo');
            } else if (k === 'y') {
                e.preventDefault();
                travel('redo');
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [travel]);

    // Messages from the canvas (select / drag-move / quick actions)
    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            if (e.origin !== window.location.origin) return;
            const d = e.data as { type?: string; id?: string; targetId?: string; position?: 'before' | 'after'; action?: string } | null;
            if (!d?.id) return;
            const id = d.id;
            if (d.type === 'studio-select') {
                fromCanvasRef.current = true;
                setSelected(id);
                setPanel('blocks');
            } else if (d.type === 'studio-move' && d.targetId) {
                const targetId = d.targetId;
                apply((l) => moveRelative(l, id, targetId, d.position === 'before' ? 'before' : 'after'), { immediate: true });
                setSelected(id);
            } else if (d.type === 'studio-action') {
                if (d.action === 'up' || d.action === 'down') apply((l) => moveStep(l, id, d.action === 'up' ? -1 : 1), { immediate: true });
                if (d.action === 'hide') {
                    apply((l) => ({ ...l, blocks: l.blocks.map((b) => (b.id === id ? { ...b, visible: false } : b)) }), { immediate: true });
                    setNotice({ tone: 'info', text: 'Bölüm gizlendi. Listeden göz simgesiyle tekrar gösterebilir veya Ctrl+Z ile geri alabilirsiniz.' });
                }
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [apply]);

    // Highlight the selected section on the canvas (scroll only when selected from the list)
    useEffect(() => {
        selectedRef.current = selected;
        const scroll = !fromCanvasRef.current;
        fromCanvasRef.current = false;
        const win = (frames.active === 0 ? frameA : frameB).current?.contentWindow;
        win?.postMessage({ type: 'studio-highlight', id: selected, scroll }, window.location.origin);
    }, [selected, frames.active]);

    useEffect(() => {
        const el = stageRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => setStage({ w: entry.contentRect.width, h: entry.contentRect.height }));
        ro.observe(el);
        return () => ro.disconnect();
    }, [ready]);

    const onFrameLoad = (i: number) => {
        const f = framesRef.current;
        if (f.pending !== i) return;
        const win = frameEl(i)?.contentWindow;
        try {
            const y = f.src[1 - i] ? frameEl(1 - i)?.contentWindow?.scrollY || 0 : 0;
            if (y) win?.scrollTo(0, y);
        } catch {
            /* cross-document access is same-origin; ignore if the frame navigated away */
        }
        if (selectedRef.current) win?.postMessage({ type: 'studio-highlight', id: selectedRef.current, scroll: false }, window.location.origin);
        setFrames((x) => ({ ...x, active: i, pending: null }));
    };

    if (!layout || !state) return <Skeleton rows={8} />;

    const switchPage = async (p: PageKey) => {
        if (p === page || busy) return;
        if (!(await saveNow())) return;
        pageRef.current = p;
        setPage(p);
        setSelected(null);
        setDrag(null);
        setState(null);
        setLayout(null);
        setSavedAt(null);
        const url = new URL(window.location.href);
        url.searchParams.set('page', p);
        window.history.replaceState(null, '', url);
        await load(p);
    };

    const setTheme = (patch: Partial<HomeTheme>) => apply((l) => ({ ...l, theme: { ...l.theme, ...patch } }), { coalesce: 'theme' });
    const setBlock = (b: HomeBlock) => apply((l) => ({ ...l, blocks: l.blocks.map((x) => (x.id === b.id ? b : x)) }), { coalesce: `block-${b.id}` });
    const toggleVisible = (id: string) => apply((l) => ({ ...l, blocks: l.blocks.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x)) }), { immediate: true });
    const removeBlock = (id: string) => {
        apply((l) => ({ ...l, blocks: l.blocks.filter((x) => x.id !== id) }), { immediate: true });
        if (selected === id) setSelected(null);
        setNotice({ tone: 'info', text: 'Bölüm kaldırıldı. Geri almak için "Geri al" düğmesine veya Ctrl+Z\'ye basın.' });
    };
    const duplicateBlock = (b: HomeBlock) => {
        const copy: HomeBlock = { ...b, id: uid(b.type), config: structuredClone(b.config), style: { ...b.style } };
        apply((l) => {
            const i = l.blocks.findIndex((x) => x.id === b.id);
            const blocks = [...l.blocks];
            blocks.splice(i + 1, 0, copy);
            return { ...l, blocks };
        }, { immediate: true });
        setSelected(copy.id);
    };
    const addBlock = (type: BlockType) => {
        const b: HomeBlock = { id: uid(type), type, visible: true, config: structuredClone(BLOCK_LIBRARY[type].defaults), style: { ...DEFAULT_STYLE } };
        apply((l) => {
            const i = selected ? l.blocks.findIndex((x) => x.id === selected) : -1;
            const blocks = [...l.blocks];
            blocks.splice(i >= 0 ? i + 1 : blocks.length, 0, b);
            return { ...l, blocks };
        }, { immediate: true });
        setSelected(b.id);
        setAddOpen(false);
    };

    const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
        setBusy(key);
        try {
            await fn();
            setNotice({ tone: 'success', text: success });
            await load(pageRef.current);
            refreshCanvas();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'İşlem başarısız' });
        } finally {
            setBusy(null);
        }
    };
    /** Drops unsaved edits so a pending autosave cannot recreate a discarded / replaced draft. */
    const cancelPendingSave = () => {
        savedVersionRef.current = versionRef.current;
        setSaveState('idle');
    };
    const preview = async () => {
        await saveNow();
        window.open(`${PAGE_DEFS[page].path}?onizleme=1`, '_blank', 'noopener');
    };
    const publish = () =>
        run('publish', async () => {
            if (!(await saveNow())) throw new Error('Taslak kaydedilemediği için yayınlanmadı.');
            await api(endpoint(page), { method: 'POST', json: { action: 'publish' } });
        }, `${PAGE_DEFS[page].label} yayınlandı. Ziyaretçiler yeni düzeni görüyor.`);
    const discard = () => {
        if (!window.confirm('Yayınlanmamış tüm değişiklikler silinecek ve yayındaki sürüme dönülecek. Devam edilsin mi?')) return;
        cancelPendingSave();
        void run('discard', () => api(endpoint(page), { method: 'POST', json: { action: 'discard' } }), 'Taslak silindi; yayındaki sürüme dönüldü.');
    };
    const restore = (source: 'original' | number, label: string) => {
        cancelPendingSave();
        void run('restore', () => api(endpoint(page), { method: 'POST', json: { action: 'restore', source } }), `${label} taslağa yüklendi. Kontrol edip yayınlayabilirsiniz.`);
    };

    const selectedBlock = layout.blocks.find((b) => b.id === selected) || null;
    const presetTheme = THEME_PRESETS[layout.theme.preset]?.theme || {};
    const scale = Math.min(1, stage.w / DEVICE_WIDTH[device]);
    const originalLabel = PAGE_DEFS[page].defaults.map((t) => BLOCK_LIBRARY[t].label).join(' + ');
    const addable = (Object.keys(BLOCK_LIBRARY) as BlockType[]).filter((t) => blockAllowed(t, page));
    const iconButton = 'rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent';

    return (
        <div className="space-y-4">
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}

            {/* Toolbar */}
            <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0b18]/80 p-3 shadow-xl shadow-black/30 backdrop-blur-xl">
                <div role="tablist" aria-label="Düzenlenecek sayfa" className="flex flex-wrap rounded-xl border border-white/10 bg-black/40 p-1">
                    {PAGE_KEYS.map((p) => (
                        <button
                            key={p}
                            type="button"
                            role="tab"
                            aria-selected={page === p}
                            onClick={() => void switchPage(p)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${page === p ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-white'}`}
                        >
                            {PAGE_DEFS[p].label}
                        </button>
                    ))}
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                    <SaveIndicator state={saveState} savedAt={savedAt} hasDraft={state.hasDraft} onRetry={() => void saveNow()} />
                    {state.published.updatedAt && <span className="text-[11px] text-gray-500">Son yayın: {formatDateTime(state.published.updatedAt)}{state.published.updatedBy ? ` · ${state.published.updatedBy}` : ''}</span>}
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-0.5">
                        <button type="button" className={iconButton} disabled={undoCount.past === 0} onClick={() => travel('undo')} title="Geri al (Ctrl+Z)" aria-label="Geri al"><Undo2 className="h-4 w-4" /></button>
                        <button type="button" className={iconButton} disabled={undoCount.future === 0} onClick={() => travel('redo')} title="Yinele (Ctrl+Shift+Z)" aria-label="Yinele"><Redo2 className="h-4 w-4" /></button>
                    </div>
                    <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-0.5" role="group" aria-label="Cihaz">
                        {([['desktop', Monitor, 'Masaüstü'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Mobil']] as const).map(([d, Icon, label]) => (
                            <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} title={label} aria-label={label} className={`rounded-lg p-2 transition-colors ${device === d ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'}`}><Icon className="h-4 w-4" /></button>
                        ))}
                    </div>
                    <Button icon={ExternalLink} onClick={() => void preview()}>Önizle</Button>
                    {(state.hasDraft || dirty) && <Button variant="ghost" icon={RotateCcw} loading={busy === 'discard'} onClick={discard}>Taslağı sil</Button>}
                    {state.canPublish ? (
                        <Button variant="primary" icon={Globe} loading={busy === 'publish'} disabled={!state.hasDraft && !dirty} onClick={() => void publish()}>Yayınla</Button>
                    ) : (
                        <Badge tone="neutral">Yayınlama yetkisi: cms:publish</Badge>
                    )}
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
                {/* Left: sections, theme, versions + inspector */}
                <aside className="space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7.5rem)] xl:self-start xl:overflow-y-auto xl:pr-1">
                    <Card>
                        <div className="mb-4 flex rounded-xl border border-white/10 bg-black/30 p-1 text-xs font-semibold" role="tablist" aria-label="Stüdyo paneli">
                            {([['blocks', LayoutTemplate, 'Bölümler'], ['theme', Palette, 'Tasarım dili'], ['versions', History, 'Sürümler']] as const).map(([key, Icon, label]) => (
                                <button key={key} type="button" role="tab" aria-selected={panel === key} onClick={() => setPanel(key)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors ${panel === key ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                                    <Icon className="h-3.5 w-3.5" /> {label}
                                </button>
                            ))}
                        </div>

                        {panel === 'blocks' && (
                            <>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="text-[11px] leading-snug text-gray-400">Tutup sürükleyin veya tuvalde bölümün <GripVertical className="inline h-3 w-3" /> tutamacını kullanın. Değişiklikler otomatik kaydedilir.</p>
                                    <Button size="sm" variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>Ekle</Button>
                                </div>
                                <ol className="space-y-1.5" aria-label="Sayfa bölümleri (yukarıdan aşağı)">
                                    {layout.blocks.map((b, i) => {
                                        const meta = BLOCK_LIBRARY[b.type];
                                        const title = String((b.config as { title?: string }).title || '');
                                        const last = i === layout.blocks.length - 1;
                                        return (
                                            <li
                                                key={b.id}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.effectAllowed = 'move';
                                                    e.dataTransfer.setData('text/plain', b.id);
                                                    setDrag({ id: b.id, over: null });
                                                }}
                                                onDragOver={(e) => {
                                                    if (!drag) return;
                                                    e.preventDefault();
                                                    const r = e.currentTarget.getBoundingClientRect();
                                                    const over = e.clientY < r.top + r.height / 2 ? i : i + 1;
                                                    if (drag.over !== over) setDrag({ ...drag, over });
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    if (drag && drag.over !== null) {
                                                        const { id, over } = drag;
                                                        apply((l) => moveToIndex(l, id, over), { immediate: true });
                                                    }
                                                    setDrag(null);
                                                }}
                                                onDragEnd={() => setDrag(null)}
                                                className={`relative ${drag?.id === b.id ? 'opacity-40' : ''}`}
                                            >
                                                {drag && drag.over === i && <span className="pointer-events-none absolute -top-1 left-2 right-2 h-0.5 rounded bg-primary shadow-[0_0_10px_var(--primary)]" />}
                                                {drag && last && drag.over === i + 1 && <span className="pointer-events-none absolute -bottom-1 left-2 right-2 h-0.5 rounded bg-primary shadow-[0_0_10px_var(--primary)]" />}
                                                <div className={`flex items-center gap-1.5 rounded-xl border px-2 py-2 transition-colors ${selected === b.id ? 'border-primary/70 bg-primary/10 shadow-[0_0_0_1px_var(--primary)]' : 'border-white/10 bg-white/[0.03] hover:border-white/25'} ${b.visible ? '' : 'opacity-50'}`}>
                                                    <span className="cursor-grab text-gray-500 active:cursor-grabbing" aria-hidden><GripVertical className="h-4 w-4" /></span>
                                                    <button type="button" onClick={() => setSelected(b.id)} className="min-w-0 flex-1 text-left">
                                                        <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                                                            <span className="text-[11px] text-gray-500">{i + 1}</span> {meta.label}
                                                            {!b.visible && <Badge tone="neutral">Gizli</Badge>}
                                                        </div>
                                                        {title && <div className="truncate text-[11px] text-gray-400">{title}</div>}
                                                    </button>
                                                    <button type="button" onClick={() => apply((l) => moveToIndex(l, b.id, i - 1), { immediate: true })} disabled={i === 0} className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30" aria-label="Yukarı"><ArrowUp className="h-3.5 w-3.5" /></button>
                                                    <button type="button" onClick={() => apply((l) => moveToIndex(l, b.id, i + 2), { immediate: true })} disabled={last} className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30" aria-label="Aşağı"><ArrowDown className="h-3.5 w-3.5" /></button>
                                                    <button type="button" onClick={() => toggleVisible(b.id)} className="rounded p-1 text-gray-400 hover:text-white" aria-label={b.visible ? 'Gizle' : 'Göster'}>{b.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button>
                                                    {!meta.single && <button type="button" onClick={() => duplicateBlock(b)} className="rounded p-1 text-gray-400 hover:text-white" aria-label="Çoğalt"><Copy className="h-3.5 w-3.5" /></button>}
                                                    <button type="button" onClick={() => removeBlock(b.id)} className="rounded p-1 text-gray-400 hover:text-rose-300" aria-label="Kaldır"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                                {layout.blocks.length === 0 && <p className="py-6 text-center text-xs text-gray-500">Bu sayfada bölüm yok. &quot;Ekle&quot; ile başlayın veya Sürümler sekmesinden orijinal düzeni yükleyin.</p>}
                            </>
                        )}

                        {panel === 'theme' && (
                            <div className="space-y-4">
                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
                                    {(Object.keys(THEME_PRESETS) as HomeTheme['preset'][]).map((key) => {
                                        const p = THEME_PRESETS[key];
                                        const active = layout.theme.preset === key;
                                        return (
                                            <button key={key} type="button" onClick={() => setTheme({ preset: key, ...(key === 'custom' ? {} : { primary: null, secondary: null, ...p.theme }) })} className={`rounded-xl border p-3 text-left transition-colors ${active ? 'border-primary bg-primary/10' : 'border-white/10 bg-black/30 hover:border-white/30'}`}>
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="h-4 w-8 rounded" style={{ backgroundImage: `linear-gradient(90deg, ${(p.theme.primary as string) || '#2563eb'}, ${(p.theme.secondary as string) || '#64748b'})` }} />
                                                    <span className="text-sm font-semibold text-white">{p.label}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-400">{p.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                                {layout.theme.preset !== 'original' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['primary', 'secondary'] as const).map((k) => (
                                            <Field key={k} label={k === 'primary' ? 'Ana renk' : 'İkinci renk'}>
                                                <input type="color" value={layout.theme[k] || (presetTheme[k] as string) || '#2563eb'} onChange={(e) => setTheme({ preset: 'custom', [k]: e.target.value })} className="h-9 w-full rounded" />
                                            </Field>
                                        ))}
                                        <Field label="Başlık yazısı"><Select value={layout.theme.fontStyle} onChange={(e) => setTheme({ fontStyle: e.target.value as HomeTheme['fontStyle'] })} options={[{ value: 'futuristic', label: 'Fütüristik' }, { value: 'modern', label: 'Modern' }, { value: 'classic', label: 'Klasik' }]} /></Field>
                                        <Field label="Köşeler"><Select value={layout.theme.radius} onChange={(e) => setTheme({ radius: e.target.value as HomeTheme['radius'] })} options={[{ value: 'sharp', label: 'Keskin' }, { value: 'rounded', label: 'Yuvarlak' }, { value: 'pill', label: 'Çok yuvarlak' }]} /></Field>
                                        <Field label="Boşluklar"><Select value={layout.theme.density} onChange={(e) => setTheme({ density: e.target.value as HomeTheme['density'] })} options={[{ value: 'compact', label: 'Sık' }, { value: 'comfortable', label: 'Normal' }, { value: 'spacious', label: 'Ferah' }]} /></Field>
                                    </div>
                                )}
                                <p className="text-[11px] text-gray-500">Tasarım dili yalnızca {PAGE_DEFS[page].label} sayfasına uygulanır.</p>
                            </div>
                        )}

                        {panel === 'versions' && (
                            <ul className="space-y-2 text-xs">
                                <li className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-gray-300">
                                    <span>Orijinal düzen <span className="text-gray-500">({originalLabel})</span></span>
                                    <Button size="sm" variant="ghost" loading={busy === 'restore'} onClick={() => restore('original', 'Orijinal düzen')}>Taslağa yükle</Button>
                                </li>
                                {state.history.map((h) => (
                                    <li key={h.index} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-gray-300">
                                        <span>{formatDateTime(h.publishedAt)} · {h.publishedBy || '—'}<br /><span className="text-gray-500">{h.blockCount} bölüm · {THEME_PRESETS[h.preset as HomeTheme['preset']]?.label || h.preset}</span></span>
                                        <Button size="sm" variant="ghost" onClick={() => restore(h.index, 'Seçilen sürüm')}>Taslağa yükle</Button>
                                    </li>
                                ))}
                                {state.history.length === 0 && <li className="text-gray-500">Henüz yayın geçmişi yok. Her yayın burada saklanır (son 20).</li>}
                            </ul>
                        )}
                    </Card>

                    {panel === 'blocks' && (
                        <Card>
                            {selectedBlock ? (
                                <>
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-white"><SlidersHorizontal className="h-4 w-4 text-primary" /> {BLOCK_LIBRARY[selectedBlock.type].label}</div>
                                        <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-white" aria-label="Kapat"><X className="h-4 w-4" /></button>
                                    </div>
                                    <BlockConfigEditor block={selectedBlock} onChange={setBlock} forms={state.forms} />
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-gray-500">
                                    <MousePointerClick className="h-6 w-6 text-gray-600" />
                                    Düzenlemek için listeden veya tuvalden bir bölüm seçin.
                                </div>
                            )}
                        </Card>
                    )}
                </aside>

                {/* Live canvas */}
                <section aria-label="Canlı tuval" className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Canlı tuval · {PAGE_DEFS[page].path} (taslak)</span>
                        {(state.hasDraft || dirty) ? <Badge tone="warning">Yayınlanmamış değişiklik var</Badge> : <Badge tone="success">Yayındakiyle aynı</Badge>}
                    </div>
                    <div ref={stageRef} className="relative h-[calc(100vh-12rem)] min-h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.12),transparent_60%)] bg-black/40">
                        <div className="relative mx-auto h-full" style={{ width: DEVICE_WIDTH[device] * scale }}>
                            {[0, 1].map((i) => (
                                <iframe
                                    key={i}
                                    ref={i === 0 ? frameA : frameB}
                                    src={frames.src[i] || undefined}
                                    title={`${PAGE_DEFS[page].label} tasarım tuvali`}
                                    onLoad={() => onFrameLoad(i)}
                                    data-active={frames.active === i}
                                    aria-hidden={frames.active !== i}
                                    tabIndex={frames.active === i ? 0 : -1}
                                    className="absolute left-0 top-0 origin-top-left rounded-xl bg-white transition-opacity duration-300 dark:bg-[#050510]"
                                    style={{ width: DEVICE_WIDTH[device], height: stage.h / scale, transform: `scale(${scale})`, opacity: frames.active === i ? 1 : 0, pointerEvents: frames.active === i ? 'auto' : 'none', zIndex: frames.active === i ? 1 : 0 }}
                                />
                            ))}
                        </div>
                        {frames.pending !== null && (
                            <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white backdrop-blur"><Loader2 className="h-3 w-3 animate-spin" /> Tuval güncelleniyor</div>
                        )}
                    </div>
                </section>
            </div>

            <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Bölüm ekle · ${PAGE_DEFS[page].label}`} size="lg">
                <p className="mb-3 text-xs text-gray-400">{selectedBlock ? `Yeni bölüm "${BLOCK_LIBRARY[selectedBlock.type].label}" bölümünün altına eklenir.` : 'Yeni bölüm sayfanın sonuna eklenir; sonra sürükleyerek yerini değiştirebilirsiniz.'}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                    {addable.map((t) => {
                        const meta = BLOCK_LIBRARY[t];
                        const used = meta.single && layout.blocks.some((b) => b.type === t);
                        return (
                            <button key={t} type="button" disabled={used} onClick={() => addBlock(t)} className="rounded-xl border border-white/10 bg-black/30 p-3 text-left transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-40">
                                <div className="text-sm font-semibold text-white">{meta.label}</div>
                                <div className="text-[11px] text-gray-400">{used ? 'Sayfada zaten var' : meta.description}</div>
                            </button>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
}

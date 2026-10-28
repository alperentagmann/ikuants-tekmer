"use client";
/**
 * Durum panosu: kartı sürükleyip başka sütuna bırakarak süreci ilerletme ("Devam ediyor" → "Tamamlandı").
 * - Fare / dokunmatik olmayan cihazlarda HTML5 sürükle-bırak; her kartta ayrıca "Aşamaya taşı" menüsü
 *   (dokunmatik ekran ve klavye kullanıcıları için).
 * - Taşıma anında görünür (iyimser güncelleme); sunucu reddederse kart eski yerine döner ve neden gösterilir.
 * Kural ve yetki denetimi sunucudadır; pano yalnız isteği gönderir.
 */
import { useState } from 'react';
import { Badge, Alert } from '@/components/admin/ui';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
export type BoardColumn = { key: string; label: string; tone?: Tone; hint?: string };

export function StatusBoard<T extends { id: string }>({
    columns, items, getStatus, renderCard, onMove, canMove = true, label, emptyText = 'Kayıt yok',
}: {
    columns: BoardColumn[];
    items: T[];
    getStatus: (item: T) => string;
    renderCard: (item: T) => React.ReactNode;
    /** Taşıma isteği; hata fırlatırsa kart geri döner. */
    onMove: (item: T, toStatus: string) => Promise<void>;
    canMove?: boolean | ((item: T) => boolean);
    label: string;
    emptyText?: string;
}) {
    // İyimser durumlar; sunucudan yeni liste gelince (anahtar değişince) kendiliğinden sıfırlanır
    const itemsKey = items.map((i) => `${i.id}:${getStatus(i)}`).join('|');
    const [optimistic, setOptimistic] = useState<{ key: string; map: Record<string, string> }>({ key: itemsKey, map: {} });
    const local = optimistic.key === itemsKey ? optimistic.map : {};
    const setLocal = (fn: (m: Record<string, string>) => Record<string, string>) => setOptimistic((prev) => ({ key: itemsKey, map: fn(prev.key === itemsKey ? prev.map : {}) }));
    const [dragId, setDragId] = useState<string | null>(null);
    const [over, setOver] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ tone: 'danger' | 'success'; text: string } | null>(null);

    const statusOf = (i: T) => local[i.id] ?? getStatus(i);
    const movable = (i: T) => (typeof canMove === 'function' ? canMove(i) : canMove);
    const move = async (item: T, to: string) => {
        const from = statusOf(item);
        if (from === to || busy) return;
        setLocal((l) => ({ ...l, [item.id]: to }));
        setBusy(item.id);
        setMsg(null);
        try {
            await onMove(item, to);
            setMsg({ tone: 'success', text: `“${columns.find((c) => c.key === to)?.label ?? to}” aşamasına taşındı.` });
        } catch (e) {
            setLocal((l) => ({ ...l, [item.id]: from }));
            setMsg({ tone: 'danger', text: (e as Error).message || 'Taşınamadı.' });
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="space-y-2">
            {msg && <Alert tone={msg.tone} onClose={() => setMsg(null)}>{msg.text}</Alert>}
            <p className="text-[11px] text-gray-500">Kartı başka sütuna sürükleyin veya kart üzerindeki “Aşamaya taşı” menüsünü kullanın.</p>
            <div className="flex gap-3 overflow-x-auto pb-3" role="list" aria-label={label}>
                {columns.map((col) => {
                    const list = items.filter((i) => statusOf(i) === col.key);
                    const isOver = over === col.key && dragId !== null;
                    return (
                        <section key={col.key} role="listitem" aria-label={`${col.label} (${list.length})`}
                            onDragOver={(e) => { if (dragId) { e.preventDefault(); setOver(col.key); } }}
                            onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
                            onDrop={(e) => { e.preventDefault(); const it = items.find((x) => x.id === dragId); setOver(null); setDragId(null); if (it) void move(it, col.key); }}
                            className={`flex w-72 shrink-0 flex-col rounded-xl border bg-white/[0.02] transition-colors ${isOver ? 'border-primary bg-primary/10' : 'border-white/10'}`}>
                            <header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                                <span className="text-xs font-semibold text-gray-200" title={col.hint}>{col.label}</span>
                                <Badge tone={col.tone ?? 'neutral'}>{list.length}</Badge>
                            </header>
                            <ul className="max-h-[65vh] min-h-24 space-y-2 overflow-y-auto p-2">
                                {list.length === 0 && <li className={`rounded-lg border border-dashed p-3 text-center text-[11px] ${isOver ? 'border-primary text-primary' : 'border-white/10 text-gray-600'}`}>{isOver ? 'Buraya bırakın' : emptyText}</li>}
                                {list.map((item) => {
                                    const can = movable(item);
                                    return (
                                        <li key={item.id} draggable={can && busy !== item.id}
                                            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id); setDragId(item.id); }}
                                            onDragEnd={() => { setDragId(null); setOver(null); }}
                                            className={`rounded-lg border border-white/10 bg-black/20 p-2.5 transition-opacity ${can ? 'cursor-grab active:cursor-grabbing' : ''} ${dragId === item.id ? 'opacity-40' : ''} ${busy === item.id ? 'animate-pulse' : ''}`}>
                                            {renderCard(item)}
                                            {can && (
                                                <label className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500">
                                                    Aşamaya taşı
                                                    <select aria-label="Aşamaya taşı" value={statusOf(item)} disabled={busy === item.id} onChange={(e) => void move(item, e.target.value)}
                                                        className="min-w-0 flex-1 rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[11px] text-gray-200 [&>option]:bg-[#0f0f1a]">
                                                        {columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                                                    </select>
                                                </label>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

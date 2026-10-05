'use client';

import React, { useState } from 'react';
import { ImagePlus, Trash2, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';

export type GalleryImage = { url: string; caption: string | null };

/** Cover image + ordered gallery with captions. Images come from the media library (upload included). */
export function ImageGalleryEditor({ cover, gallery, onChange, coverLabel = 'Kapak fotoğrafı' }: { cover: string | null; gallery: GalleryImage[]; onChange: (next: { cover: string | null; gallery: GalleryImage[] }) => void; coverLabel?: string }) {
    const [picker, setPicker] = useState<'cover' | 'gallery' | null>(null);
    const move = (i: number, dir: -1 | 1) => {
        const next = [...gallery];
        const j = i + dir;
        if (j < 0 || j >= next.length) return;
        [next[i], next[j]] = [next[j], next[i]];
        onChange({ cover, gallery: next });
    };

    return (
        <div className="space-y-5">
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{coverLabel}</span>
                    {cover && <button type="button" onClick={() => onChange({ cover: null, gallery })} className="text-xs text-gray-400 hover:text-rose-300">Kaldır</button>}
                </div>
                <button type="button" onClick={() => setPicker('cover')} className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/40">
                    {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="flex flex-col items-center gap-1 text-xs text-gray-500"><ImagePlus className="h-7 w-7" />Kapak fotoğrafı seç veya yükle</span>
                    )}
                    {cover && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">Değiştir</span>}
                </button>
                <p className="mt-1 text-[11px] text-gray-500">Public sayfada kartın üst görseli. Gerçek alan fotoğrafı kullanın (öneri 1600×900).</p>
            </div>

            <div>
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Galeri <span className="font-normal text-gray-500">({gallery.length})</span></span>
                    <button type="button" onClick={() => setPicker('gallery')} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white hover:border-primary/50"><ImagePlus className="h-3.5 w-3.5" /> Fotoğraf ekle</button>
                </div>
                {gallery.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-gray-500">Farklı açılardan fotoğraflar ekleyin; ziyaretçiler alanı büyük görünümde inceleyebilir.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {gallery.map((g, i) => (
                            <div key={g.url + i} className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
                                <img src={g.url} alt="" className="aspect-video w-full object-cover" />
                                <div className="space-y-1.5 p-2">
                                    <input value={g.caption || ''} onChange={(e) => onChange({ cover, gallery: gallery.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)) })} placeholder="Açıklama (ör. Reji odası)" className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white outline-none focus:border-primary" />
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => move(i, -1)} className="rounded p-1 text-gray-400 hover:text-white" aria-label="Öne al"><ArrowLeft className="h-3.5 w-3.5" /></button>
                                            <button type="button" onClick={() => move(i, 1)} className="rounded p-1 text-gray-400 hover:text-white" aria-label="Geri al"><ArrowRight className="h-3.5 w-3.5" /></button>
                                            <button type="button" onClick={() => onChange({ cover: g.url, gallery })} className="rounded p-1 text-gray-400 hover:text-amber-300" aria-label="Kapak yap" title="Kapak yap"><Star className="h-3.5 w-3.5" /></button>
                                        </div>
                                        <button type="button" onClick={() => onChange({ cover, gallery: gallery.filter((_, k) => k !== i) })} className="rounded p-1 text-gray-400 hover:text-rose-300" aria-label="Kaldır"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <MediaPickerModal
                isOpen={picker !== null}
                onClose={() => setPicker(null)}
                title={picker === 'cover' ? 'Kapak fotoğrafı' : 'Galeriye fotoğraf ekle'}
                onSelect={(url) => {
                    if (picker === 'cover') onChange({ cover: url, gallery });
                    else onChange({ cover, gallery: [...gallery, { url, caption: null }] });
                    setPicker(null);
                }}
            />
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { ImagePlus, Trash2, Palette, Image as ImageIcon, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { ProgramCard, type PublicProgram } from '@/components/programs/ProgramCard';
import { PROGRAM_THEME_PRESETS, resolveProgramTheme, type ProgramTheme } from '@/lib/program-theme';

type Editable = Record<string, unknown> & { theme?: ProgramTheme; gallery?: string[] };

/** One image slot with preview, media-library picker / upload and manual URL. */
function ImageSlot({ label, hint, value, onChange, aspect }: { label: string; hint: string; value: string; onChange: (url: string) => void; aspect: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="mb-2 flex items-center justify-between">
                <div>
                    <div className="text-xs font-semibold text-white">{label}</div>
                    <div className="text-[11px] text-gray-500">{hint}</div>
                </div>
                {value && (
                    <button type="button" onClick={() => onChange('')} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-rose-300" aria-label={`${label} kaldır`}>
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
            <button type="button" onClick={() => setOpen(true)} className={`group relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/15 bg-black/40 ${aspect}`}>
                {value ? (
                    <img src={value} alt="" className="h-full w-full object-cover" />
                ) : (
                    <span className="flex flex-col items-center gap-1 text-xs text-gray-500"><ImagePlus className="h-6 w-6" />Görsel seç veya yükle</span>
                )}
                {value && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">Değiştir</span>}
            </button>
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="veya görsel URL'si" className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-white outline-none focus:border-primary" />
            <MediaPickerModal isOpen={open} onClose={() => setOpen(false)} onSelect={(url) => { onChange(url); setOpen(false); }} title={`${label} seç`} />
        </div>
    );
}

export function ProgramAppearanceEditor({ value, onChange }: { value: Editable; onChange: (next: Editable) => void }) {
    const theme = value.theme || resolveProgramTheme(value as { themeJson?: string; colorCode?: string; slug?: string });
    const gallery = Array.isArray(value.gallery) ? value.gallery.filter((g) => typeof g === 'string') : [];
    const [galleryPicker, setGalleryPicker] = useState(false);

    const set = (patch: Editable) => onChange({ ...value, ...patch });
    const setTheme = (patch: Partial<ProgramTheme>) => {
        const next = { ...theme, ...patch };
        set({ theme: next, themeJson: next });
    };
    const moveGallery = (i: number, dir: -1 | 1) => {
        const next = [...gallery];
        const j = i + dir;
        if (j < 0 || j >= next.length) return;
        [next[i], next[j]] = [next[j], next[i]];
        set({ gallery: next });
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-6">
                <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><ImageIcon className="h-4 w-4 text-primary" /> Görseller</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <ImageSlot label="Afiş" hint="Dikey program afişi (ör. 1080×1350). Detay sayfasında ve kartta gösterilir." value={String(value.posterUrl || '')} onChange={(url) => set({ posterUrl: url })} aspect="aspect-[4/5]" />
                        <div className="space-y-4">
                            <ImageSlot label="Banner (masaüstü)" hint="Yatay geniş görsel (ör. 1920×800). Detay sayfası üst alanı." value={String(value.heroUrl || '')} onChange={(url) => set({ heroUrl: url, coverUrl: url })} aspect="aspect-[16/7]" />
                            <ImageSlot label="Banner (mobil)" hint="Opsiyonel; mobilde kullanılır." value={String(value.mobileHeroUrl || '')} onChange={(url) => set({ mobileHeroUrl: url })} aspect="aspect-[16/9]" />
                            <ImageSlot label="Program logosu" hint="Kare veya şeffaf PNG." value={String(value.logoUrl || '')} onChange={(url) => set({ logoUrl: url })} aspect="aspect-[3/1]" />
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Galeri <span className="text-xs font-normal text-gray-500">({gallery.length})</span></h3>
                        <button type="button" onClick={() => setGalleryPicker(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:border-primary/50"><ImagePlus className="h-3.5 w-3.5" /> Görsel ekle</button>
                    </div>
                    {gallery.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-gray-500">Galeri boş. Etkinlik, demo day veya program fotoğrafları ekleyebilirsiniz.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {gallery.map((g, i) => (
                                <div key={g + i} className="group relative overflow-hidden rounded-lg border border-white/10">
                                    <img src={g} alt="" className="aspect-square w-full object-cover" />
                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <GripVertical className="h-3.5 w-3.5 text-gray-400" />
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => moveGallery(i, -1)} className="p-1 text-gray-300 hover:text-white" aria-label="Sola taşı"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>
                                            <button type="button" onClick={() => moveGallery(i, 1)} className="p-1 text-gray-300 hover:text-white" aria-label="Sağa taşı"><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button>
                                            <button type="button" onClick={() => set({ gallery: gallery.filter((_, x) => x !== i) })} className="p-1 text-gray-300 hover:text-rose-300" aria-label="Kaldır"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <MediaPickerModal isOpen={galleryPicker} onClose={() => setGalleryPicker(false)} onSelect={(url) => { set({ gallery: [...gallery, url] }); setGalleryPicker(false); }} title="Galeriye görsel ekle" />
                </section>

                <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Palette className="h-4 w-4 text-primary" /> Renk teması</h3>
                    <div className="mb-4 flex flex-wrap gap-2">
                        {PROGRAM_THEME_PRESETS.map((p) => (
                            <button key={p.name} type="button" onClick={() => setTheme(p.theme)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-gray-200 hover:border-white/30">
                                <span className="h-4 w-8 rounded" style={{ backgroundImage: `linear-gradient(90deg, ${p.theme.primary}, ${p.theme.secondary})` }} />
                                {p.name}
                            </button>
                        ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {([['primary', 'Ana renk'], ['secondary', 'İkinci renk'], ['accent', 'Vurgu rengi']] as const).map(([key, label]) => (
                            <label key={key} className="block">
                                <span className="mb-1 block text-xs text-gray-400">{label}</span>
                                <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-1.5">
                                    <input type="color" value={theme[key]} onChange={(e) => setTheme({ [key]: e.target.value })} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" aria-label={label} />
                                    <input type="text" value={theme[key]} onChange={(e) => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && setTheme({ [key]: e.target.value })} className="w-full bg-transparent font-mono text-xs text-white outline-none" />
                                </span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1 block text-xs text-gray-400">Başvur butonu stili</span>
                            <select value={theme.buttonStyle} onChange={(e) => setTheme({ buttonStyle: e.target.value as ProgramTheme['buttonStyle'] })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white">
                                <option value="gradient">Renk geçişli</option>
                                <option value="solid">Düz renk</option>
                                <option value="outline">Çerçeveli</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-xs text-gray-400">Köşe yumuşaklığı</span>
                            <select value={theme.radius} onChange={(e) => setTheme({ radius: e.target.value as ProgramTheme['radius'] })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white">
                                <option value="md">Az</option>
                                <option value="xl">Orta</option>
                                <option value="full">Tam yuvarlak</option>
                            </select>
                        </label>
                    </div>
                </section>
            </div>

            <aside className="xl:sticky xl:top-4 xl:self-start">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Canlı önizleme (program kartı)</div>
                <div className="rounded-2xl bg-gray-50 p-4">
                    <ProgramCard program={{ ...(value as unknown as PublicProgram), theme, applyOpen: Boolean((value as { applyOpen?: boolean }).applyOpen), detailUrl: '#' }} />
                </div>
                <p className="mt-2 text-[11px] text-gray-500">Başvur butonu programın açık başvuru kampanyasına bağlanır; kampanya yoksa “Başvurular yakında” görünür.</p>
            </aside>
        </div>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Upload, Plus, Trash2, ArrowUp, ArrowDown, Eye, Save } from 'lucide-react';
import { Button, Field, TextInput, TextArea, Select, Toggle, Alert, Skeleton, Card, api } from '@/components/admin/ui';

const FacilityViewer = dynamic(() => import('@/components/three/FacilityViewer').then((m) => m.FacilityViewer), { ssr: false });

interface Hotspot { id?: string; title: string; description: string; hotspotType: string; position: string; linkUrl: string; isActive: boolean }
interface Experience {
    isEnabled: boolean;
    isPublic: boolean;
    mode: 'MODEL' | 'PANORAMA';
    modelUrl: string;
    modelMediaId: string | null;
    panoramaUrl: string;
    panoramaMediaId: string | null;
    posterUrl: string;
    posterMediaId: string | null;
    altText: string;
    description: string;
    cameraOrbit: string;
    cameraTarget: string;
    autoRotate: boolean;
    hotspots: Hotspot[];
}

const EMPTY: Experience = { isEnabled: false, isPublic: false, mode: 'MODEL', modelUrl: '', modelMediaId: null, panoramaUrl: '', panoramaMediaId: null, posterUrl: '', posterMediaId: null, altText: '', description: '', cameraOrbit: '', cameraTarget: '', autoRotate: false, hotspots: [] };

async function uploadAsset(file: File, category: 'model3d' | 'panorama' | 'image'): Promise<{ url: string; id: string }> {
    const data = new FormData();
    data.append('file', file);
    data.append('folder', 'facility-3d');
    data.append('category', category);
    data.append('altText', file.name);
    const res = await fetch('/api/admin/media', { method: 'POST', body: data });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Yükleme başarısız');
    return { url: json.publicUrl || json.media?.publicUrl, id: json.media?.id };
}

/** Admin manager for the optional 3D / 360° experience of a facility. */
export function ExperienceEditor({ facilityId, facilityName, onSaved }: { facilityId: string; facilityName: string; onSaved?: () => void }) {
    const [exp, setExp] = useState<Experience>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [preview, setPreview] = useState(false);

    useEffect(() => {
        setLoading(true);
        api<{ experience: (Experience & { hotspots: Hotspot[] }) | null }>(`/api/admin/spaces/${facilityId}/experience`)
            .then((d) => {
                const e = d.experience;
                setExp(e ? {
                    ...EMPTY,
                    ...Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v === null && typeof (EMPTY as unknown as Record<string, unknown>)[k] === 'string' ? '' : v])),
                    hotspots: (e.hotspots || []).map((h) => ({ ...h, description: h.description || '', linkUrl: h.linkUrl || '' })),
                } as Experience : EMPTY);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [facilityId]);

    const upload = async (file: File | undefined, kind: 'model' | 'panorama' | 'poster') => {
        if (!file) return;
        setUploading(kind);
        setError(null);
        try {
            const result = await uploadAsset(file, kind === 'model' ? 'model3d' : kind === 'panorama' ? 'panorama' : 'image');
            if (kind === 'model') setExp((e) => ({ ...e, modelUrl: result.url, modelMediaId: result.id, mode: 'MODEL' }));
            if (kind === 'panorama') setExp((e) => ({ ...e, panoramaUrl: result.url, panoramaMediaId: result.id, mode: 'PANORAMA' }));
            if (kind === 'poster') setExp((e) => ({ ...e, posterUrl: result.url, posterMediaId: result.id }));
            setNotice(`${file.name} yüklendi. Kaydetmeyi unutmayın.`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Yükleme başarısız');
        } finally {
            setUploading(null);
        }
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            await api(`/api/admin/spaces/${facilityId}/experience`, { method: 'PUT', json: exp });
            setNotice('3D / 360° ayarları kaydedildi.');
            onSaved?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Kaydedilemedi');
        } finally {
            setSaving(false);
        }
    };

    const updateHotspot = (i: number, patch: Partial<Hotspot>) => setExp((e) => ({ ...e, hotspots: e.hotspots.map((h, j) => (j === i ? { ...h, ...patch } : h)) }));
    const moveHotspot = (i: number, dir: -1 | 1) => setExp((e) => {
        const list = [...e.hotspots];
        const t = i + dir;
        if (t < 0 || t >= list.length) return e;
        [list[i], list[t]] = [list[t], list[i]];
        return { ...e, hotspots: list };
    });

    if (loading) return <Skeleton rows={5} />;
    const hasAsset = exp.mode === 'PANORAMA' ? Boolean(exp.panoramaUrl) : Boolean(exp.modelUrl);

    return (
        <div className="space-y-5">
            <Alert tone="info">Yalnız gerçek, firmaya ait 3D model (GLB/glTF) veya 360° panorama görselleri yükleyin. Varlık yoksa public sayfada 3D butonu görünmez.</Alert>
            {notice && <Alert tone="success" onClose={() => setNotice(null)}>{notice}</Alert>}
            {error && <Alert tone="danger" onClose={() => setError(null)}>{error}</Alert>}

            <div className="flex flex-wrap gap-5">
                <Toggle id="x-enabled" checked={exp.isEnabled} onChange={(v) => setExp({ ...exp, isEnabled: v })} label="3D / 360° etkin" disabled={!hasAsset} />
                <Toggle id="x-public" checked={exp.isPublic} onChange={(v) => setExp({ ...exp, isPublic: v })} label="Public sayfada göster" disabled={!hasAsset} />
                <Toggle id="x-rotate" checked={exp.autoRotate} onChange={(v) => setExp({ ...exp, autoRotate: v })} label="Otomatik döndür" />
            </div>

            <Field label="Görünüm türü" htmlFor="x-mode">
                <Select id="x-mode" value={exp.mode} onChange={(e) => setExp({ ...exp, mode: e.target.value as 'MODEL' | 'PANORAMA' })} options={[{ value: 'MODEL', label: '3D model (GLB / glTF)' }, { value: 'PANORAMA', label: '360° panorama görseli' }]} />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                    <p className="mb-2 text-xs font-semibold text-gray-300">3D model</p>
                    <p className="mb-2 truncate text-[11px] text-gray-500">{exp.modelUrl || 'Yüklenmedi'}</p>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10">
                        <Upload className="h-3.5 w-3.5" />{uploading === 'model' ? 'Yükleniyor...' : exp.modelUrl ? 'Modeli Değiştir' : 'Model Yükle'}
                        <input type="file" accept=".glb,.gltf" className="sr-only" onChange={(e) => upload(e.target.files?.[0], 'model')} />
                    </label>
                    {exp.modelUrl && <button type="button" onClick={() => setExp({ ...exp, modelUrl: '', modelMediaId: null, isEnabled: exp.mode === 'MODEL' ? false : exp.isEnabled })} className="ml-2 text-[11px] text-rose-300">Kaldır</button>}
                </Card>
                <Card>
                    <p className="mb-2 text-xs font-semibold text-gray-300">360° panorama</p>
                    <p className="mb-2 truncate text-[11px] text-gray-500">{exp.panoramaUrl || 'Yüklenmedi'}</p>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10">
                        <Upload className="h-3.5 w-3.5" />{uploading === 'panorama' ? 'Yükleniyor...' : exp.panoramaUrl ? 'Görseli Değiştir' : 'Panorama Yükle'}
                        <input type="file" accept=".jpg,.jpeg,.png,.webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0], 'panorama')} />
                    </label>
                    {exp.panoramaUrl && <button type="button" onClick={() => setExp({ ...exp, panoramaUrl: '', panoramaMediaId: null, isEnabled: exp.mode === 'PANORAMA' ? false : exp.isEnabled })} className="ml-2 text-[11px] text-rose-300">Kaldır</button>}
                </Card>
                <Card>
                    <p className="mb-2 text-xs font-semibold text-gray-300">Kapak görseli (poster)</p>
                    <p className="mb-2 truncate text-[11px] text-gray-500">{exp.posterUrl || 'Yüklenmedi'}</p>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10">
                        <Upload className="h-3.5 w-3.5" />{uploading === 'poster' ? 'Yükleniyor...' : 'Kapak Yükle'}
                        <input type="file" accept=".jpg,.jpeg,.png,.webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0], 'poster')} />
                    </label>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Alt metin (erişilebilirlik)" htmlFor="x-alt" required hint="Görme engelli ziyaretçiler için kısa tanım. Public yayında zorunlu."><TextInput id="x-alt" value={exp.altText} onChange={(e) => setExp({ ...exp, altText: e.target.value })} placeholder={`${facilityName} 3D görünümü`} /></Field>
                <Field label="Varsayılan kamera açısı" htmlFor="x-orbit" hint='model-viewer camera-orbit, örn. "0deg 75deg 105%". Boş: otomatik.'><TextInput id="x-orbit" value={exp.cameraOrbit} onChange={(e) => setExp({ ...exp, cameraOrbit: e.target.value })} /></Field>
                <Field label="Açıklama" htmlFor="x-desc" className="md:col-span-2"><TextArea id="x-desc" value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} /></Field>
            </div>

            <div>
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-300">İşaret noktaları (hotspot)</p>
                    <Button size="sm" icon={Plus} onClick={() => setExp({ ...exp, hotspots: [...exp.hotspots, { title: '', description: '', hotspotType: 'INFO', position: '0m 1m 0m', linkUrl: '', isActive: true }] })}>İşaret Ekle</Button>
                </div>
                <p className="mb-2 text-[11px] text-gray-500">Yalnız alanda gerçekten bulunan donanım veya bilgileri işaretleyin. Konum &quot;x y z&quot; (metre) biçimindedir.</p>
                <div className="space-y-2">
                    {exp.hotspots.map((h, i) => (
                        <Card key={h.id || i} className="space-y-2">
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_160px]">
                                <TextInput aria-label="Başlık" placeholder="Başlık" value={h.title} onChange={(e) => updateHotspot(i, { title: e.target.value })} />
                                <Select aria-label="Tür" value={h.hotspotType} onChange={(e) => updateHotspot(i, { hotspotType: e.target.value })} options={[{ value: 'INFO', label: 'Bilgi' }, { value: 'EQUIPMENT', label: 'Ekipman' }, { value: 'LINK', label: 'Bağlantı' }, { value: 'RESERVATION', label: 'Rezervasyon' }]} />
                                <TextInput aria-label="Konum" className="font-mono" value={h.position} onChange={(e) => updateHotspot(i, { position: e.target.value })} />
                            </div>
                            <TextInput aria-label="Açıklama" placeholder="Açıklama" value={h.description} onChange={(e) => updateHotspot(i, { description: e.target.value })} />
                            <div className="flex flex-wrap items-center gap-2">
                                <TextInput aria-label="Bağlantı" placeholder="Bağlantı (isteğe bağlı)" value={h.linkUrl} onChange={(e) => updateHotspot(i, { linkUrl: e.target.value })} className="flex-1" />
                                <Toggle id={`h-act-${i}`} checked={h.isActive} onChange={(v) => updateHotspot(i, { isActive: v })} label="Aktif" />
                                <button type="button" onClick={() => moveHotspot(i, -1)} className="rounded p-1 text-gray-400 hover:bg-white/5" aria-label="Yukarı"><ArrowUp className="h-4 w-4" /></button>
                                <button type="button" onClick={() => moveHotspot(i, 1)} className="rounded p-1 text-gray-400 hover:bg-white/5" aria-label="Aşağı"><ArrowDown className="h-4 w-4" /></button>
                                <button type="button" onClick={() => setExp({ ...exp, hotspots: exp.hotspots.filter((_, j) => j !== i) })} className="rounded p-1 text-rose-400 hover:bg-rose-500/10" aria-label="Kaldır"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button icon={Eye} disabled={!hasAsset} onClick={() => setPreview((p) => !p)}>{preview ? 'Önizlemeyi Kapat' : 'Önizle'}</Button>
                <Button variant="primary" icon={Save} loading={saving} onClick={save}>Kaydet</Button>
            </div>
            {preview && hasAsset && (
                <FacilityViewer
                    title={facilityName}
                    experience={{ mode: exp.mode, modelUrl: exp.modelUrl || null, panoramaUrl: exp.panoramaUrl || null, posterUrl: exp.posterUrl || null, altText: exp.altText || null, description: exp.description, cameraOrbit: exp.cameraOrbit || null, cameraTarget: exp.cameraTarget || null, autoRotate: exp.autoRotate, hotspots: exp.hotspots.filter((h) => h.isActive && h.title).map((h) => ({ title: h.title, description: h.description || null, hotspotType: h.hotspotType, position: h.position, normal: null, linkUrl: h.linkUrl || null })) }}
                    className="h-[50vh] min-h-[280px]"
                />
            )}
        </div>
    );
}

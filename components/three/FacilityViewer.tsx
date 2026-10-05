'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, RotateCcw, Loader2, AlertTriangle, Info } from 'lucide-react';

export interface ViewerExperience {
    mode: 'MODEL' | 'PANORAMA' | string;
    modelUrl: string | null;
    panoramaUrl: string | null;
    posterUrl: string | null;
    altText: string | null;
    description?: string | null;
    cameraOrbit: string | null;
    cameraTarget: string | null;
    autoRotate: boolean;
    hotspots: { id?: string; title: string; description: string | null; hotspotType: string; position: string; normal: string | null; linkUrl: string | null }[];
}

/** Empty glTF scene; a 360° panorama is shown as the environment (skybox) around it. */
const EMPTY_SCENE = 'data:model/gltf+json;charset=utf-8,' + encodeURIComponent('{"asset":{"version":"2.0"},"scenes":[{"nodes":[]}],"scene":0}');

type ModelViewerElement = HTMLElement & { jumpCameraToGoal?: () => void; cameraOrbit?: string; cameraTarget?: string };

/**
 * Interactive 3D (GLB/glTF) or 360° panorama viewer. The viewer library is loaded
 * only when this component mounts, so pages without a 3D asset stay light.
 */
export function FacilityViewer({ experience, title, className }: { experience: ViewerExperience; title: string; className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<ModelViewerElement | null>(null);
    const [libReady, setLibReady] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        import('@google/model-viewer')
            .then(() => !cancelled && setLibReady(true))
            .catch(() => !cancelled && setError('3D görüntüleyici yüklenemedi.'));
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const el = viewerRef.current;
        if (!el || !libReady) return;
        const onProgress = (e: Event) => setProgress(Math.round(((e as CustomEvent<{ totalProgress: number }>).detail?.totalProgress || 0) * 100));
        const onLoad = () => setLoaded(true);
        const onError = () => setError('3D içerik yüklenemedi. Dosya bozuk veya erişilemiyor olabilir.');
        el.addEventListener('progress', onProgress);
        el.addEventListener('load', onLoad);
        el.addEventListener('error', onError);
        return () => {
            el.removeEventListener('progress', onProgress);
            el.removeEventListener('load', onLoad);
            el.removeEventListener('error', onError);
        };
    }, [libReady]);

    const isPanorama = experience.mode === 'PANORAMA';
    const src = isPanorama ? EMPTY_SCENE : experience.modelUrl || '';

    const reset = () => {
        const el = viewerRef.current;
        if (!el) return;
        el.setAttribute('camera-orbit', experience.cameraOrbit || (isPanorama ? '0deg 90deg 1m' : 'auto auto auto'));
        el.setAttribute('camera-target', experience.cameraTarget || 'auto auto auto');
        el.setAttribute('field-of-view', 'auto');
        el.jumpCameraToGoal?.();
    };

    const fullscreen = () => {
        const c = containerRef.current;
        if (!c) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else c.requestFullscreen?.();
    };

    const viewerProps: Record<string, unknown> = {
        ref: viewerRef,
        src,
        alt: experience.altText || `${title} 3D görünümü`,
        poster: experience.posterUrl || undefined,
        'camera-controls': true,
        'touch-action': 'pan-y',
        'interaction-prompt': reducedMotion ? 'none' : 'auto',
        'auto-rotate': experience.autoRotate && !reducedMotion ? true : undefined,
        'camera-orbit': experience.cameraOrbit || (isPanorama ? '0deg 90deg 1m' : undefined),
        'camera-target': experience.cameraTarget || undefined,
        'skybox-image': isPanorama ? experience.panoramaUrl : undefined,
        'environment-image': isPanorama ? experience.panoramaUrl : 'neutral',
        'shadow-intensity': isPanorama ? undefined : '1',
        'min-field-of-view': isPanorama ? '20deg' : undefined,
        'max-field-of-view': isPanorama ? '100deg' : undefined,
        loading: 'eager',
        reveal: 'auto',
        style: { width: '100%', height: '100%', backgroundColor: '#0b0b14', '--poster-color': '#0b0b14' },
    };

    return (
        <div ref={containerRef} className={`relative overflow-hidden rounded-2xl bg-[#0b0b14] ${className || 'h-[60vh] min-h-[320px]'}`}>
            {error ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-gray-300">
                    {experience.posterUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={experience.posterUrl} alt={experience.altText || title} className="max-h-[50%] rounded-lg object-contain" />
                    )}
                    <AlertTriangle className="h-6 w-6 text-amber-400" aria-hidden="true" />
                    <p>{error}</p>
                </div>
            ) : !libReady ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400" aria-busy="true">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 3D görüntüleyici hazırlanıyor...
                </div>
            ) : (
                React.createElement(
                    'model-viewer',
                    viewerProps,
                    ...experience.hotspots.map((h, i) =>
                        React.createElement(
                            'button',
                            {
                                key: h.id || i,
                                slot: `hotspot-${i}`,
                                'data-position': h.position,
                                'data-normal': h.normal || undefined,
                                type: 'button',
                                onClick: () => setActiveHotspot(activeHotspot === i ? null : i),
                                'aria-label': h.title,
                                className: 'h-6 w-6 rounded-full border-2 border-white bg-primary text-[10px] font-bold text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
                            },
                            String(i + 1)
                        )
                    )
                )
            )}

            {libReady && !loaded && !error && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Yükleniyor">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
            )}

            <div className="absolute right-3 top-3 flex gap-2">
                <button type="button" onClick={reset} className="rounded-lg bg-black/60 p-2 text-white hover:bg-black/80" aria-label="Görünümü sıfırla"><RotateCcw className="h-4 w-4" /></button>
                <button type="button" onClick={fullscreen} className="rounded-lg bg-black/60 p-2 text-white hover:bg-black/80" aria-label="Tam ekran"><Maximize2 className="h-4 w-4" /></button>
            </div>

            {activeHotspot !== null && experience.hotspots[activeHotspot] && (
                <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/10 bg-black/80 p-3 text-sm text-gray-200 sm:right-auto sm:max-w-sm" role="dialog" aria-label={experience.hotspots[activeHotspot].title}>
                    <div className="mb-1 flex items-center gap-2 font-semibold text-white"><Info className="h-4 w-4 text-primary" />{experience.hotspots[activeHotspot].title}</div>
                    {experience.hotspots[activeHotspot].description && <p className="text-xs text-gray-300">{experience.hotspots[activeHotspot].description}</p>}
                    {experience.hotspots[activeHotspot].linkUrl && (
                        <a href={experience.hotspots[activeHotspot].linkUrl!} className="mt-2 inline-block text-xs text-primary underline" target={experience.hotspots[activeHotspot].linkUrl!.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">Detay</a>
                    )}
                </div>
            )}

            <p className="sr-only">Fare veya dokunmatik ile döndürün, yakınlaştırın ve kaydırın. Klavyede görüntüleyiciye odaklanıp ok tuşlarıyla döndürebilirsiniz.</p>
        </div>
    );
}

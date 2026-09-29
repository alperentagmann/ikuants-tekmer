"use client";
import React, { useState, useEffect } from 'react';
import { Image, Upload, Check, X, Search, Filter, AlertCircle } from 'lucide-react';

interface MediaPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string, media?: any) => void;
    title?: string;
    allowedTypes?: 'image' | 'video' | 'document' | 'all';
    aspectRatioPreset?: '1:1' | '16:9' | '4:3' | 'free';
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    title = 'Medya Seç veya Yükle',
    allowedTypes = 'image',
    aspectRatioPreset = 'free',
}) => {
    const [mediaList, setMediaList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/media');
            const data = await res.json();
            if (data.media) {
                setMediaList(data.media);
            }
        } catch (e) {
            console.error('Failed to load media:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMedia();
            setSelectedUrl(null);
            setUploadError(null);
        }
    }, [isOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('Dosya boyutu 10MB sınırını aşamaz.');
            return;
        }

        setUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'admin_uploads');

        try {
            const res = await fetch('/api/admin/media', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.media && data.media.publicUrl) {
                await fetchMedia();
                setSelectedUrl(data.media.publicUrl);
            } else {
                setUploadError(data.error || 'Yükleme başarısız.');
            }
        } catch (err: any) {
            setUploadError(err.message || 'Dosya yüklenirken hata oluştu.');
        } finally {
            setUploading(false);
        }
    };

    const handleConfirm = () => {
        if (selectedUrl) {
            const mediaItem = mediaList.find((m) => m.publicUrl === selectedUrl);
            onSelect(selectedUrl, mediaItem);
            onClose();
        }
    };

    if (!isOpen) return null;

    const filteredMedia = mediaList.filter((item) =>
        item.originalName?.toLowerCase().includes(search.toLowerCase()) ||
        item.altText?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
            <div className="w-full max-w-4xl bg-[#0e0e18] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Image className="w-5 h-5 text-cyan-400" />
                        <h2 className="font-semibold text-white text-base">{title}</h2>
                        {aspectRatioPreset !== 'free' && (
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                Önerilen Oran: {aspectRatioPreset}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Medyalarda ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>

                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-black font-semibold text-xs cursor-pointer transition-all shadow-lg shadow-cyan-500/20">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploading ? 'Yükleniyor...' : 'Yeni Medya Yükle'}</span>
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            accept="image/*,video/*,application/pdf"
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>

                {uploadError && (
                    <div className="mx-6 mt-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{uploadError}</span>
                    </div>
                )}

                {/* Media Grid */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {loading ? (
                        <div className="col-span-full py-16 text-center text-gray-500 text-xs font-mono animate-pulse">
                            Medya kütüphanesi yükleniyor...
                        </div>
                    ) : filteredMedia.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-gray-500 text-xs">
                            Kayıtlı medya bulunamadı. Yukarıdan yeni bir görsel yükleyebilirsiniz.
                        </div>
                    ) : (
                        filteredMedia.map((item) => {
                            const isSelected = selectedUrl === item.publicUrl;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSelectedUrl(item.publicUrl)}
                                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 text-left transition-all bg-black/40 ${
                                        isSelected
                                            ? 'border-cyan-400 ring-2 ring-cyan-400/30'
                                            : 'border-white/10 hover:border-white/30'
                                    }`}
                                >
                                    <img
                                        src={item.publicUrl}
                                        alt={item.altText || item.originalName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center text-black shadow-lg">
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                                        <p className="text-[10px] text-white truncate font-mono">
                                            {item.originalName}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
                    <div className="text-xs text-gray-400 font-mono truncate max-w-md">
                        {selectedUrl ? (
                            <span className="text-cyan-400">Seçildi: {selectedUrl.split('/').pop()}</span>
                        ) : (
                            'Bir medya seçin veya yeni yükleyin'
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="button"
                            disabled={!selectedUrl}
                            onClick={handleConfirm}
                            className="px-5 py-2 text-xs font-semibold rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg shadow-cyan-500/20"
                        >
                            Medyayı Kullan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

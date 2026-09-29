"use client";
import React, { useState, useEffect } from 'react';
import { Folder, Upload, Trash2, Copy, Check, Image as ImageIcon, FileText, Search, ExternalLink } from 'lucide-react';

export default function AdminMedyaPage() {
    const [mediaItems, setMediaItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const url = selectedFolder === 'all' ? '/api/admin/media' : `/api/admin/media?folder=${selectedFolder}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setMediaItems(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, [selectedFolder]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', selectedFolder === 'all' ? 'general' : selectedFolder);

            const res = await fetch('/api/admin/media', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                await fetchMedia();
            } else {
                alert(data.message || 'Yükleme başarısız');
            }
        } catch {
            alert('Hata oluştu');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu medya dosyasını silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/media?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                await fetchMedia();
            }
        } catch {
            alert('Silinemedi');
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Medya Kütüphanesi</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        Görseller, logolar, pitch deck evrakları ve doküman yönetimi
                    </p>
                </div>

                {/* Upload Button */}
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Yükleniyor...' : 'Yeni Dosya Yükle'}</span>
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Folder Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {['all', 'general', 'news', 'mentors', 'entrepreneurs', 'documents'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setSelectedFolder(f)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition-colors ${
                            selectedFolder === f ? 'bg-primary text-white' : 'bg-[#0e0e18] text-gray-400 hover:text-white border border-white/5'
                        }`}
                    >
                        {f === 'all' ? 'Tüm Dosyalar' : f}
                    </button>
                ))}
            </div>

            {/* Media Grid */}
            {loading ? (
                <div className="p-12 text-center text-gray-500 font-mono text-xs animate-pulse">
                    Medya yükleniyor...
                </div>
            ) : mediaItems.length === 0 ? (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-12 text-center text-gray-500 text-xs font-mono">
                    Bu klasörde henüz dosya yok.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {mediaItems.map((item) => {
                        const isImage = item.mimeType?.startsWith('image/');
                        return (
                            <div
                                key={item.id}
                                className="bg-[#0e0e18] border border-white/10 rounded-2xl overflow-hidden group hover:border-primary/40 transition-all flex flex-col"
                            >
                                <div className="aspect-square bg-black/40 relative overflow-hidden flex items-center justify-center">
                                    {isImage ? (
                                        <img
                                            src={item.publicUrl}
                                            alt={item.altText || item.fileName}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <FileText className="w-10 h-10 text-gray-500" />
                                    )}

                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => copyToClipboard(item.publicUrl, item.id)}
                                            className="p-2 bg-black/60 rounded-lg text-white hover:bg-primary transition-colors"
                                            title="URL Kopyala"
                                        >
                                            {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 bg-black/60 rounded-lg text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-2.5 text-[11px] font-mono">
                                    <div className="text-white truncate font-medium">{item.originalName || item.fileName}</div>
                                    <div className="text-gray-500 text-[10px]">
                                        {(item.fileSize / 1024).toFixed(0)} KB • {item.folder}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

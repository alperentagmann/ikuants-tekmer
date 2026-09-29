"use client";
import React, { useState } from 'react';
import {
    Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon,
    Type, Heading as HeadingIcon, Video, Quote, AlertCircle, Paperclip
} from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';

export interface ContentBlock {
    id: string;
    type: 'HEADING' | 'PARAGRAPH' | 'IMAGE' | 'VIDEO' | 'QUOTE' | 'CALLOUT' | 'FILE';
    data: {
        text?: string;
        level?: 'h2' | 'h3';
        imageUrl?: string;
        caption?: string;
        altText?: string;
        videoUrl?: string;
        quoteAuthor?: string;
        calloutType?: 'info' | 'warning' | 'success';
        fileUrl?: string;
        fileName?: string;
        fileSize?: string;
    };
}

interface RichBlockEditorProps {
    blocks: ContentBlock[];
    onChange: (blocks: ContentBlock[]) => void;
}

export const RichBlockEditor: React.FC<RichBlockEditorProps> = ({ blocks, onChange }) => {
    const [activeImagePickerBlockId, setActiveImagePickerBlockId] = useState<string | null>(null);

    const addBlock = (type: ContentBlock['type']) => {
        const newBlock: ContentBlock = {
            id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type,
            data: {
                text: '',
                level: 'h2',
                calloutType: 'info',
            },
        };
        onChange([...blocks, newBlock]);
    };

    const updateBlockData = (id: string, partialData: Partial<ContentBlock['data']>) => {
        onChange(
            blocks.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...partialData } } : b))
        );
    };

    const removeBlock = (id: string) => {
        onChange(blocks.filter((b) => b.id !== id));
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= blocks.length) return;

        const newBlocks = [...blocks];
        const [moved] = newBlocks.splice(index, 1);
        newBlocks.splice(targetIndex, 0, moved);
        onChange(newBlocks);
    };

    return (
        <div className="space-y-4">
            {/* Blocks Container */}
            <div className="space-y-3">
                {blocks.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                        <p className="text-gray-400 text-xs mb-3">Henüz içerik bloğu eklenmedi.</p>
                        <p className="text-gray-500 text-[11px]">Aşağıdaki butonları kullanarak başlık, metin, görsel veya video ekleyebilirsiniz.</p>
                    </div>
                ) : (
                    blocks.map((block, index) => (
                        <div
                            key={block.id}
                            className="group relative p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-all shadow-sm"
                        >
                            {/* Block Action Header */}
                            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2 text-xs text-gray-400 font-mono">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[10px] text-cyan-400 font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="font-semibold text-white/80">{block.type}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => moveBlock(index, 'up')}
                                        className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-gray-400 hover:text-white transition-colors"
                                        title="Yukarı Taşı"
                                    >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={index === blocks.length - 1}
                                        onClick={() => moveBlock(index, 'down')}
                                        className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-gray-400 hover:text-white transition-colors"
                                        title="Aşağı Taşı"
                                    >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeBlock(block.id)}
                                        className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-colors ml-2"
                                        title="Bloğu Sil"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Block Body per Type */}
                            {block.type === 'HEADING' && (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <select
                                            value={block.data.level || 'h2'}
                                            onChange={(e) => updateBlockData(block.id, { level: e.target.value as any })}
                                            className="px-2 py-1 bg-black/50 border border-white/10 rounded text-xs text-cyan-400 font-mono"
                                        >
                                            <option value="h2">H2 (Alt Başlık)</option>
                                            <option value="h3">H3 (Küçük Başlık)</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Başlık metnini girin..."
                                            value={block.data.text || ''}
                                            onChange={(e) => updateBlockData(block.id, { text: e.target.value })}
                                            className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white font-semibold text-sm focus:outline-none focus:border-cyan-500/50"
                                        />
                                    </div>
                                </div>
                            )}

                            {block.type === 'PARAGRAPH' && (
                                <textarea
                                    rows={4}
                                    placeholder="Paragraf metnini girin (Markdown formatı desteklenir)..."
                                    value={block.data.text || ''}
                                    onChange={(e) => updateBlockData(block.id, { text: e.target.value })}
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-500/50"
                                />
                            )}

                            {block.type === 'IMAGE' && (
                                <div className="space-y-3">
                                    {block.data.imageUrl ? (
                                        <div className="relative aspect-video max-h-48 rounded-lg overflow-hidden border border-white/10 bg-black">
                                            <img
                                                src={block.data.imageUrl}
                                                alt={block.data.altText || 'Görsel'}
                                                className="w-full h-full object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setActiveImagePickerBlockId(block.id)}
                                                className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-black/70 border border-white/20 text-xs text-white hover:bg-black font-mono"
                                            >
                                                Görseli Değiştir
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setActiveImagePickerBlockId(block.id)}
                                            className="w-full py-8 border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white hover:border-cyan-500/50 transition-colors"
                                        >
                                            <ImageIcon className="w-6 h-6 text-cyan-400" />
                                            <span className="text-xs font-mono">Medya Kütüphanesinden Görsel Seç</span>
                                        </button>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Görsel alt yazısı (Caption)..."
                                            value={block.data.caption || ''}
                                            onChange={(e) => updateBlockData(block.id, { caption: e.target.value })}
                                            className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Alt text (SEO açıklaması)..."
                                            value={block.data.altText || ''}
                                            onChange={(e) => updateBlockData(block.id, { altText: e.target.value })}
                                            className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            {block.type === 'VIDEO' && (
                                <div className="space-y-2">
                                    <input
                                        type="url"
                                        placeholder="YouTube veya Vimeo video bağlantısı (Örn: https://www.youtube.com/watch?v=...)"
                                        value={block.data.videoUrl || ''}
                                        onChange={(e) => updateBlockData(block.id, { videoUrl: e.target.value })}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs font-mono"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Video başlığı / açıklaması..."
                                        value={block.data.caption || ''}
                                        onChange={(e) => updateBlockData(block.id, { caption: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white text-xs"
                                    />
                                </div>
                            )}

                            {block.type === 'QUOTE' && (
                                <div className="space-y-2 pl-3 border-l-2 border-cyan-400">
                                    <textarea
                                        rows={2}
                                        placeholder="Alıntı metnini girin..."
                                        value={block.data.text || ''}
                                        onChange={(e) => updateBlockData(block.id, { text: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white italic text-xs"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Alıntı sahibi / kurum (Örn: Dr. Ahmet Yılmaz, İKÜ)"
                                        value={block.data.quoteAuthor || ''}
                                        onChange={(e) => updateBlockData(block.id, { quoteAuthor: e.target.value })}
                                        className="w-full px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-gray-300 text-xs font-mono"
                                    />
                                </div>
                            )}

                            {block.type === 'CALLOUT' && (
                                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 space-y-2">
                                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Öne Çıkan Bilgi / Duyuru Kutusu</span>
                                    </div>
                                    <textarea
                                        rows={2}
                                        placeholder="Vurgulanacak mesajı girin..."
                                        value={block.data.text || ''}
                                        onChange={(e) => updateBlockData(block.id, { text: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Block Add Toolbar */}
            <div className="p-3 rounded-xl bg-[#0e0e18] border border-white/10 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400 font-mono mr-2 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-cyan-400" /> Blok Ekle:
                </span>
                <button
                    type="button"
                    onClick={() => addBlock('HEADING')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors"
                >
                    <HeadingIcon className="w-3.5 h-3.5 text-cyan-400" /> Başlık
                </button>
                <button
                    type="button"
                    onClick={() => addBlock('PARAGRAPH')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors"
                >
                    <Type className="w-3.5 h-3.5 text-purple-400" /> Paragraf
                </button>
                <button
                    type="button"
                    onClick={() => addBlock('IMAGE')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors"
                >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Görsel
                </button>
                <button
                    type="button"
                    onClick={() => addBlock('VIDEO')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors"
                >
                    <Video className="w-3.5 h-3.5 text-rose-400" /> Video
                </button>
                <button
                    type="button"
                    onClick={() => addBlock('QUOTE')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors"
                >
                    <Quote className="w-3.5 h-3.5 text-amber-400" /> Alıntı
                </button>
                <button
                    type="button"
                    onClick={() => addBlock('CALLOUT')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors"
                >
                    <AlertCircle className="w-3.5 h-3.5 text-cyan-400" /> Vurgu Kutusu
                </button>
            </div>

            {/* Reusable Image Picker Modal */}
            <MediaPickerModal
                isOpen={!!activeImagePickerBlockId}
                onClose={() => setActiveImagePickerBlockId(null)}
                onSelect={(url) => {
                    if (activeImagePickerBlockId) {
                        updateBlockData(activeImagePickerBlockId, { imageUrl: url });
                    }
                }}
            />
        </div>
    );
};

"use client";
import React, { useState, useRef } from 'react';
import { Sparkles, Send, Paperclip, X, RotateCcw, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

interface AiMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    attachmentUrl?: string;
    attachmentName?: string;
    requiresConfirmation?: boolean;
    confirmationPayload?: any;
    changeSetId?: string;
    isExecuted?: boolean;
    isRolledBack?: boolean;
    error?: string;
}

interface AiAssistantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentRoute?: string;
    isSuperAdmin?: boolean;
    currentUser?: any;
}

export function AiAssistantDrawer({ isOpen, onClose, currentRoute, isSuperAdmin, currentUser }: AiAssistantDrawerProps) {
    const isSuper = Boolean(isSuperAdmin || currentUser?.isSuperAdmin);
    const [messages, setMessages] = useState<AiMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Merhaba! Ben **İKÜANTS AI Operasyon Asistanı**.\n\n${isSuperAdmin ? '⚡ **Super Admin Komuta Modu Aktif**: Sitede banner yayınlayabilir, kullanıcı davet edebilir, program atayabilir veya kurumsal raporlar üretebilirsiniz.' : '📋 **Yönetici Asistanı Aktif**: Bugünkü çalışmalarınızı kaydedebilir, günlük/aylık rapor derleyebilir veya görüşme ve görevler oluşturabilirsiniz.'}\n\nSize bugün nasıl yardımcı olabilirim?`,
        },
    ]);
    const [input, setInput] = useState('');
    const [attachment, setAttachment] = useState<{ file: File; url: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleSendMessage = async (textToSend?: string) => {
        const text = textToSend || input;
        if (!text.trim() && !attachment) return;

        const userMsg: AiMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            attachmentUrl: attachment?.url,
            attachmentName: attachment?.file.name,
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        const currentAttachment = attachment;
        setAttachment(null);
        setLoading(true);

        try {
            const res = await fetch('/api/admin/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: text,
                    context: {
                        currentRoute,
                        attachmentUrl: currentAttachment?.url,
                        attachmentType: currentAttachment?.file.type,
                    },
                }),
            });

            const data = await res.json();
            if (data.success && data.message) {
                setMessages(prev => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: data.message.content,
                        requiresConfirmation: data.message.requiresConfirmation,
                        confirmationPayload: data.message.confirmationPayload,
                    },
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: data.message || 'Üzgünüm, isteğinizi işlerken bir sorun oluştu.',
                    },
                ]);
            }
        } catch (err: any) {
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `Bağlantı hatası: ${err.message}`,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (msgId: string, payload: any) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                setMessages(prev =>
                    prev.map(m =>
                        m.id === msgId
                            ? {
                                  ...m,
                                  requiresConfirmation: false,
                                  isExecuted: true,
                                  changeSetId: data.changeSetId,
                                  content: `${m.content}\n\n✅ **Tamamlandı:** ${data.message}`,
                              }
                            : m
                    )
                );
            } else {
                alert(data.message || 'İşlem başarısız');
            }
        } catch {
            alert('İşlem çalıştırılırken sunucu hatası oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleUndo = async (msgId: string, changeSetId: string) => {
        if (!confirm('Bu AI işlemini geri almak ve yapılan değişiklikleri kaldırmak istiyor musunuz?')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai/undo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ changeSetId }),
            });

            const data = await res.json();
            if (data.success) {
                setMessages(prev =>
                    prev.map(m =>
                        m.id === msgId
                            ? {
                                  ...m,
                                  isRolledBack: true,
                                  content: `${m.content}\n\n↩️ **Geri Alındı:** ${data.message}`,
                              }
                            : m
                    )
                );
            } else {
                alert(data.message || 'Geri alma başarısız');
            }
        } catch {
            alert('Geri alma işleminde hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create object URL for preview / attachment
        const url = URL.createObjectURL(file);
        setAttachment({ file, url });
    };

    const chips = isSuperAdmin
        ? [
              'Ana sayfaya yeni banner ekle',
              'Yeni kullanıcı davet et',
              'Program atanmamış girişimcileri listele',
              'Kira tahakkuklarını ve borçları kontrol et',
              'Bu ayın kurumsal raporunu hazırla',
          ]
        : [
              'Bugünkü çalışmalarımı kaydet',
              'Bugünkü faaliyet raporumu hazırla',
              'Girişimci ile görüşme kaydı oluştur',
              'Yarın için takip görevi ekle',
              'Açık görevlerimi göster',
          ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg h-full bg-[#0d0d18] border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-tr from-primary to-purple-600 text-white shadow-lg shadow-primary/25">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="ai-drawer-title" className="font-orbitron font-bold text-sm text-white flex items-center gap-1.5">
                                İKÜANTS AI Asistanı
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-mono">COPILOT</span>
                            </h2>
                            <p className="text-[11px] text-gray-400 font-mono">
                                {isSuperAdmin ? 'Komuta Merkezi & Doğal Dil Operasyonları' : 'Yönetici Çalışma & Raporlama Asistanı'}
                            </p>
                        </div>
                    </div>
                    <button
                        id="close-ai-drawer-btn"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        title="Kapat"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <div
                                className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                                    m.role === 'user'
                                        ? 'bg-primary text-white font-medium rounded-tr-none'
                                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                }`}
                            >
                                <div className="whitespace-pre-line">{m.content}</div>

                                {m.attachmentUrl && (
                                    <div className="mt-2.5 p-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2">
                                        <Paperclip className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[11px] font-mono text-gray-300 truncate">
                                            {m.attachmentName || 'Ekli Dosya'}
                                        </span>
                                    </div>
                                )}

                                {/* Confirmation Card */}
                                {m.requiresConfirmation && !m.isExecuted && !m.isRolledBack && (
                                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                                        <button
                                            onClick={() => handleConfirm(m.id, m.confirmationPayload)}
                                            disabled={loading}
                                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Onayla ve Uygula
                                        </button>
                                        <button
                                            onClick={() => {
                                                setMessages(prev =>
                                                    prev.map(item =>
                                                        item.id === m.id
                                                            ? { ...item, requiresConfirmation: false, content: `${item.content}\n\n❌ *İşlem iptal edildi.*` }
                                                            : item
                                                    )
                                                );
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[11px] transition-colors"
                                        >
                                            Vazgeç
                                        </button>
                                    </div>
                                )}

                                {/* Undo Action Card */}
                                {m.isExecuted && m.changeSetId && !m.isRolledBack && (
                                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> İşlem Kaydedildi
                                        </span>
                                        <button
                                            onClick={() => handleUndo(m.id, m.changeSetId!)}
                                            disabled={loading}
                                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] font-mono flex items-center gap-1 transition-colors"
                                        >
                                            <RotateCcw className="w-3 h-3" /> Geri Al
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 p-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span>İKÜANTS AI işliyor...</span>
                        </div>
                    )}
                </div>

                {/* Suggestion Chips */}
                <div className="p-3 border-t border-white/5 bg-black/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {chips.map((chip, i) => (
                        <button
                            key={i}
                            onClick={() => handleSendMessage(chip)}
                            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary text-[10px] font-mono text-gray-400 border border-white/5 transition-all"
                        >
                            + {chip}
                        </button>
                    ))}
                </div>

                {/* Attachment Preview */}
                {attachment && (
                    <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-primary" />
                            <span className="text-xs text-gray-300 truncate max-w-xs font-mono">
                                {attachment.file.name}
                            </span>
                        </div>
                        <button
                            onClick={() => setAttachment(null)}
                            className="p-1 text-gray-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Input Bar */}
                <div className="p-4 border-t border-white/10 bg-black/40">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*,.pdf,.docx,.xlsx"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 rounded-xl border border-white/10 hover:border-primary/50 text-gray-400 hover:text-primary hover:bg-white/5 transition-colors"
                            title="Dosya veya Görsel Ekle"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ne yapmak istiyorsunuz? (Örn: 'Ana sayfaya banner ekle')"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-primary outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loading || (!input.trim() && !attachment)}
                            className="p-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white disabled:opacity-40 shadow-lg shadow-primary/25 transition-all"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

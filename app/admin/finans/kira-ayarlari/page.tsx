'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Settings,
    Mail,
    Send,
    Plus,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Clock,
    X,
    Save
} from 'lucide-react';

interface ReminderRule {
    id: string;
    ruleType: string;
    daysOffset: number;
    emailSubject: string;
    emailBodyTemplate: string;
    isActive: boolean;
}

export default function RentSettingsPage() {
    const [rules, setRules] = useState<ReminderRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [editingRule, setEditingRule] = useState<Partial<ReminderRule> | null>(null);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/rent/rules');
            const data = await res.json();
            if (Array.isArray(data)) {
                setRules(data);
            }
        } catch {
            setFeedback({ type: 'error', message: 'Kira ayarları yüklenemedi.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRule) return;

        try {
            const res = await fetch('/api/admin/rent/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingRule)
            });

            if (!res.ok) throw new Error('Kural kaydedilemedi');

            setFeedback({ type: 'success', message: 'Hatırlatma kuralı ve e-posta şablonu güncellendi.' });
            setEditingRule(null);
            fetchRules();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link
                        href="/admin/finans/kiralar"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kira Yönetimine Dön
                    </Link>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Kira Hatırlatma & Şablon Ayarları</h1>
                    <p className="text-slate-400 text-xs mt-1">
                        Otomatik kira vade öncesi, vade günü ve gecikme e-posta kurallarının ve dinamik değişkenlerinin yönetimi.
                    </p>
                </div>

                <button
                    onClick={() => setEditingRule({
                        ruleType: 'CUSTOM_REMINDER',
                        daysOffset: 1,
                        emailSubject: 'Kira Ödeme Bildirimi',
                        emailBodyTemplate: 'Sayın {{contactName}},\n\n{{companyName}} firmasının {{month}} dönemi {{amount}} TL tutarındaki kira ödemesi hk.',
                        isActive: true
                    })}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 cursor-pointer"
                >
                    <Plus className="w-3.5 h-3.5" /> + Yeni Kural Ekle
                </button>
            </div>

            {feedback && (
                <div className={`p-4 rounded-xl border text-sm flex items-center justify-between gap-2 ${feedback.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Variable CheatSheet */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider block mb-2">Kullanılabilir Dinamik Değişkenler</span>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">{"{{companyName}}"}</span>
                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">{"{{contactName}}"}</span>
                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">{"{{month}}"}</span>
                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">{"{{amount}}"}</span>
                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">{"{{paidAmount}}"}</span>
                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">{"{{remainingAmount}}"}</span>
                    <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">{"{{dueDate}}"}</span>
                </div>
            </div>

            {/* Rules List */}
            <div className="space-y-4">
                {rules.map((rule) => (
                    <div key={rule.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                <span className="font-bold text-white text-sm">{rule.ruleType}</span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                                    {rule.daysOffset < 0 ? `Vadeden ${Math.abs(rule.daysOffset)} gün önce` : rule.daysOffset === 0 ? 'Vade Günü' : `Vadeden ${rule.daysOffset} gün sonra (Gecikme)`}
                                </span>
                            </div>

                            <button
                                onClick={() => setEditingRule(rule)}
                                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
                            >
                                Düzenle
                            </button>
                        </div>

                        <div className="text-xs text-slate-300 font-semibold">
                            E-Posta Konusu: <span className="text-white font-normal">{rule.emailSubject}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                            {rule.emailBodyTemplate}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit / Create Modal */}
            {editingRule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Hatırlatma Kuralı & Şablonu Düzenle</h3>
                        <form onSubmit={handleSaveRule} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Kural Türü</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingRule.ruleType || ''}
                                        onChange={(e) => setEditingRule({ ...editingRule, ruleType: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Gün Offset (-3, 0, +3)</label>
                                    <input
                                        type="number"
                                        required
                                        value={editingRule.daysOffset ?? 0}
                                        onChange={(e) => setEditingRule({ ...editingRule, daysOffset: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">E-Posta Konusu *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingRule.emailSubject || ''}
                                    onChange={(e) => setEditingRule({ ...editingRule, emailSubject: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">E-Posta İçerik Şablonu *</label>
                                <textarea
                                    rows={5}
                                    required
                                    value={editingRule.emailBodyTemplate || ''}
                                    onChange={(e) => setEditingRule({ ...editingRule, emailBodyTemplate: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-emerald-500 outline-none leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingRule(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

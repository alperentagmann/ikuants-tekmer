'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Instagram,
    Share2,
    RefreshCw,
    Plus,
    CheckCircle2,
    AlertCircle,
    Settings,
    Inbox,
    ExternalLink,
    Shield,
    Clock,
    Hash
} from 'lucide-react';

interface SocialAccount {
    id: string;
    provider: string;
    accountName: string;
    accountId: string;
    profileUrl?: string;
    avatarUrl?: string;
    isActive: boolean;
    syncMode: string;
    syncIntervalMinutes: number;
    lastSyncAt?: string;
    _count?: { posts: number; syncRuns: number };
}

export default function SocialMediaIntegrationPage() {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Form state
    const [provider, setProvider] = useState('INSTAGRAM');
    const [accountName, setAccountName] = useState('');
    const [accountId, setAccountId] = useState('');
    const [profileUrl, setProfileUrl] = useState('');
    const [syncMode, setSyncMode] = useState('AUTO_DRAFT');
    const [submitting, setSubmitting] = useState(false);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/social/accounts');
            const data = await res.json();
            if (data.success) {
                setAccounts(data.accounts);
            }
        } catch {
            setFeedback({ type: 'error', message: 'Hesaplar yüklenirken hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/social/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    accountName: accountName.replace('@', ''),
                    accountId,
                    profileUrl: profileUrl || `https://instagram.com/${accountName.replace('@', '')}`,
                    syncMode,
                    syncIntervalMinutes: 30,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setFeedback({ type: 'success', message: 'Sosyal medya hesabı başarıyla bağlandı.' });
                setShowConnectModal(false);
                setAccountName('');
                setAccountId('');
                setProfileUrl('');
                fetchAccounts();
            } else {
                setFeedback({ type: 'error', message: data.error || 'Bağlantı başarısız oldu.' });
            }
        } catch {
            setFeedback({ type: 'error', message: 'Sunucuya bağlanırken hata oluştu.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSync = async (account: SocialAccount) => {
        setSyncingId(account.id);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/social/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: account.id }),
            });
            const data = await res.json();
            if (data.status === 'NOT_CONFIGURED') {
                setFeedback({
                    type: 'info',
                    message: data.message || 'Meta/Instagram API anahtarları henüz tanımlanmamış.',
                });
            } else if (data.success) {
                setFeedback({
                    type: 'success',
                    message: `Senkronizasyon tamamlandı: ${data.result?.imported || 0} yeni gönderi alındı.`,
                });
                fetchAccounts();
            } else {
                setFeedback({ type: 'error', message: data.error || 'Senkronizasyon başarısız oldu.' });
            }
        } catch {
            setFeedback({ type: 'error', message: 'Senkronizasyon sırasında hata oluştu.' });
        } finally {
            setSyncingId(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Share2 className="w-7 h-7 text-cyan-400" />
                        <span>Sosyal Medya Entegrasyon Merkezi</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Instagram ve diğer sosyal medya hesaplarınızı bağlayın, gönderileri haber veya duyurulara otomatik dönüştürün.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/sosyal-medya/gelen-kutusu"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
                    >
                        <Inbox className="w-4 h-4 text-cyan-400" />
                        <span>Gelen Kutusu</span>
                    </Link>
                    <button
                        onClick={() => setShowConnectModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-cyan-950/50"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Hesap Bağla</span>
                    </button>
                </div>
            </div>

            {feedback && (
                <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                        feedback.type === 'success'
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : feedback.type === 'info'
                            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                >
                    {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />}
                    {feedback.type === 'info' && <Shield className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />}
                    {feedback.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />}
                    <p className="text-sm">{feedback.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((acc) => (
                    <div
                        key={acc.id}
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-purple-600 to-orange-500 flex items-center justify-center text-white shadow-md">
                                        <Instagram className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">@{acc.accountName}</h3>
                                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                            {acc.provider}
                                        </span>
                                    </div>
                                </div>
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        acc.isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-slate-800 text-slate-400'
                                    }`}
                                >
                                    {acc.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>

                            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Senkronizasyon Modu:</span>
                                    <span className="font-medium text-cyan-400">{acc.syncMode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Çekilen Gönderi:</span>
                                    <span className="font-medium text-white">{acc._count?.posts || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Son Senkronizasyon:</span>
                                    <span className="font-medium text-slate-300">
                                        {acc.lastSyncAt ? new Date(acc.lastSyncAt).toLocaleString('tr-TR') : 'Henüz yapılmadı'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                            <button
                                onClick={() => handleSync(acc)}
                                disabled={syncingId === acc.id}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${syncingId === acc.id ? 'animate-spin' : ''}`} />
                                <span>{syncingId === acc.id ? 'Senkronize Ediliyor...' : 'Şimdi Senkronize Et'}</span>
                            </button>
                            {acc.profileUrl && (
                                <a
                                    href={acc.profileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                    title="Profili Aç"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}

                {accounts.length === 0 && !loading && (
                    <div className="col-span-full bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                        <Share2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Bağlı Sosyal Medya Hesabı Yok</h3>
                        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                            Kurumun resmi Instagram hesabını bağlayarak paylaşımlarınızı web sitesinde otomatik taslak haberlere dönüştürebilirsiniz.
                        </p>
                        <button
                            onClick={() => setShowConnectModal(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>İlk Hesabı Bağla</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Connect Modal */}
            {showConnectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Instagram className="w-6 h-6 text-pink-500" />
                            <span>Sosyal Medya Hesabı Bağla</span>
                        </h3>
                        <form onSubmit={handleConnect} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Platform</label>
                                <select
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="INSTAGRAM">Instagram</option>
                                    <option value="LINKEDIN">LinkedIn (Yakında)</option>
                                    <option value="YOUTUBE">YouTube (Yakında)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Kullanıcı Adı (@)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="ikuantstekmer"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Hesap / Page ID</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="17841400000000000"
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Senkronizasyon Modu</label>
                                <select
                                    value={syncMode}
                                    onChange={(e) => setSyncMode(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="AUTO_DRAFT">AUTO_DRAFT (Önerilen: Haber Taslağı Oluştur)</option>
                                    <option value="MANUAL_REVIEW">MANUAL_REVIEW (Sadece Gelen Kutusuna Al)</option>
                                    <option value="AUTO_PUBLISH">AUTO_PUBLISH (Doğrudan Yayına Al)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowConnectModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Bağlanıyor...' : 'Kaydet ve Bağla'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Inbox,
    FileText,
    EyeOff,
    CheckCircle2,
    ExternalLink,
    Filter,
    Search,
    RefreshCw,
    Instagram,
    AlertCircle
} from 'lucide-react';

interface SocialPostItem {
    id: string;
    externalId: string;
    caption?: string;
    mediaType: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    permalink?: string;
    postDate: string;
    syncStatus: string;
    convertedNewsId?: string;
    socialAccount: {
        id: string;
        accountName: string;
        provider: string;
    };
}

export default function SocialInboxPage() {
    const [posts, setPosts] = useState<SocialPostItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [convertingId, setConvertingId] = useState<string | null>(null);
    const [ignoringId, setIgnoringId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.set('syncStatus', statusFilter);
            if (search) params.set('search', search);

            const res = await fetch(`/api/admin/social/posts?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setPosts(data.items);
            }
        } catch {
            setFeedback({ type: 'error', message: 'Gönderiler yüklenirken hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [statusFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPosts();
    };

    const handleConvert = async (post: SocialPostItem) => {
        setConvertingId(post.id);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/social/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: post.id,
                    category: 'DUYURU',
                    autoPublish: false,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setFeedback({ type: 'success', message: 'Gönderi haber taslağına dönüştürüldü.' });
                fetchPosts();
            } else {
                setFeedback({ type: 'error', message: data.error || 'Dönüştürme başarısız oldu.' });
            }
        } catch {
            setFeedback({ type: 'error', message: 'İşlem sırasında hata oluştu.' });
        } finally {
            setConvertingId(null);
        }
    };

    const handleIgnore = async (post: SocialPostItem) => {
        setIgnoringId(post.id);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/social/posts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: post.id,
                    action: 'IGNORE',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setFeedback({ type: 'success', message: 'Gönderi yoksayıldı.' });
                fetchPosts();
            } else {
                setFeedback({ type: 'error', message: data.error || 'İşlem başarısız oldu.' });
            }
        } catch {
            setFeedback({ type: 'error', message: 'İşlem sırasında hata oluştu.' });
        } finally {
            setIgnoringId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT_CREATED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Taslak Oluşturuldu</span>;
            case 'PUBLISHED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Yayında</span>;
            case 'IGNORED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">Yoksayıldı</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Yeni</span>;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Inbox className="w-7 h-7 text-cyan-400" />
                        <span>Sosyal Medya Gelen Kutusu</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Instagram'dan çekilen gönderileri inceleyin, haber taslağı oluşturun veya yoksayın.
                    </p>
                </div>
                <Link
                    href="/admin/entegrasyonlar/sosyal-medya"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
                >
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span>Entegrasyon Ayarları</span>
                </Link>
            </div>

            {feedback && (
                <div
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                        feedback.type === 'success'
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                >
                    {feedback.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    ) : (
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                    )}
                    <p className="text-sm">{feedback.message}</p>
                </div>
            )}

            {/* Filters */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Açıklama içinde ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                </form>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 w-full sm:w-auto"
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="NEW">Yeni</option>
                        <option value="DRAFT_CREATED">Taslak Oluşturuldu</option>
                        <option value="PUBLISHED">Yayında</option>
                        <option value="IGNORED">Yoksayıldı</option>
                    </select>

                    <button
                        onClick={() => fetchPosts()}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Yenile"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl flex flex-col justify-between group"
                    >
                        <div>
                            {post.thumbnailUrl || post.mediaUrl ? (
                                <div className="h-48 w-full bg-slate-950 overflow-hidden relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={post.thumbnailUrl || post.mediaUrl}
                                        alt="Sosyal Medya Görseli"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-3 right-3">
                                        {getStatusBadge(post.syncStatus)}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 flex justify-end">
                                    {getStatusBadge(post.syncStatus)}
                                </div>
                            )}

                            <div className="p-5">
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                                    <span>@{post.socialAccount.accountName}</span>
                                    <span>{new Date(post.postDate).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <p className="text-sm text-slate-200 line-clamp-4 leading-relaxed mb-4">
                                    {post.caption || '(Açıklama metni bulunmuyor)'}
                                </p>
                            </div>
                        </div>

                        <div className="p-5 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {post.syncStatus !== 'DRAFT_CREATED' && post.syncStatus !== 'PUBLISHED' && (
                                    <button
                                        onClick={() => handleConvert(post)}
                                        disabled={convertingId === post.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>{convertingId === post.id ? 'İşleniyor...' : 'Habere Dönüştür'}</span>
                                    </button>
                                )}
                                {post.syncStatus !== 'IGNORED' && (
                                    <button
                                        onClick={() => handleIgnore(post)}
                                        disabled={ignoringId === post.id}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors disabled:opacity-50"
                                        title="Yoksay"
                                    >
                                        <EyeOff className="w-3.5 h-3.5" />
                                        <span>Yoksay</span>
                                    </button>
                                )}
                            </div>

                            {post.permalink && (
                                <a
                                    href={post.permalink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                    title="Orijinal Gönderiyi Aç"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}

                {posts.length === 0 && !loading && (
                    <div className="col-span-full bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                        <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Gelen Kutusunda Gönderi Yok</h3>
                        <p className="text-slate-400 text-sm max-w-md mx-auto">
                            Seçili filtrelere uygun sosyal medya gönderisi bulunamadı veya henüz senkronizasyon yapılmadı.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

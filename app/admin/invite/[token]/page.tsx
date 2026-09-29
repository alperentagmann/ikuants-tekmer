"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AcceptInvitePage() {
    const params = useParams();
    const router = useRouter();
    const token = params?.token as string;

    const [isLoading, setIsLoading] = useState(true);
    const [inviteInfo, setInviteInfo] = useState<{ email: string; role: string; department?: string } | null>(null);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) return;
            try {
                const res = await fetch(`/api/admin/auth/invite/${token}`);
                const data = await res.json();
                if (res.ok && data.invite) {
                    setInviteInfo(data.invite);
                } else {
                    setError(data.error || 'Davet bağlantısı geçersiz veya süresi dolmuş.');
                }
            } catch {
                setError('Davet doğrulanırken sunucu hatası oluştu.');
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('Şifreniz en az 8 karakter uzunluğunda olmalıdır.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/auth/invite/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password }),
            });

            const data = await res.json();
            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    router.push('/admin/login');
                }, 2500);
            } else {
                setError(data.error || 'Hesap etkinleştirme başarısız oldu.');
            }
        } catch {
            setError('Sunucu hatası oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#06060c] flex items-center justify-center p-4 text-white text-xs font-mono">
                Davet bilgileri doğrulanıyor...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#06060c] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="w-full max-w-md bg-[#0e0e1a]/90 border border-white/10 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl space-y-6 relative z-10">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 mx-auto flex items-center justify-center font-orbitron font-bold text-white text-lg shadow-lg shadow-primary/30">
                        İK
                    </div>
                    <h1 className="text-xl font-bold font-orbitron text-white">İKÜANTS TEKMER</h1>
                    <p className="text-xs text-gray-400">Yönetim Paneli Hesap Etkinleştirme</p>
                </div>

                {error ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : isSuccess ? (
                    <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-3">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                        <div className="font-bold text-sm">Hesabınız Başarıyla Etkinleştirildi!</div>
                        <p className="text-xs text-emerald-300/80">
                            Giriş sayfasına yönlendiriliyorsunuz...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1">
                            <div className="text-gray-400">E-Posta Adresi:</div>
                            <div className="font-mono font-semibold text-white">{inviteInfo?.email}</div>
                            <div className="text-gray-400 pt-1">Atanan Rol:</div>
                            <div className="font-mono text-primary font-bold">{inviteInfo?.role}</div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                                Adınız ve Soyadınız *
                            </label>
                            <div className="relative">
                                <User className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ad Soyad"
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                                Parolanızı Belirleyin *
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="En az 8 karakter"
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                                Parolanızı Tekrar Girin *
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Parolayı tekrar girin"
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            {isSubmitting ? 'Etkinleştiriliyor...' : 'Hesabımı Etkinleştir'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

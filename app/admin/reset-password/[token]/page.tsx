"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KeyRound, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const params = useParams();
    const router = useRouter();
    const token = params?.token as string;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('Yeni şifreniz en az 8 karakter uzunluğunda olmalıdır.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();
            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    router.push('/admin/login');
                }, 2500);
            } else {
                setError(data.error || 'Şifre sıfırlama işlemi başarısız oldu.');
            }
        } catch {
            setError('Sunucu hatası oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#06060c] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="w-full max-w-md bg-[#0e0e1a]/90 border border-white/10 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl space-y-6 relative z-10">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 mx-auto flex items-center justify-center font-orbitron font-bold text-white text-lg shadow-lg shadow-primary/30">
                        İK
                    </div>
                    <h1 className="text-xl font-bold font-orbitron text-white">İKÜANTS TEKMER</h1>
                    <p className="text-xs text-gray-400">Yeni Şifre Belirleme</p>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {isSuccess ? (
                    <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-3">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                        <div className="font-bold text-sm">Şifreniz Başarıyla Güncellendi!</div>
                        <p className="text-xs text-emerald-300/80">
                            Giriş sayfasına yönlendiriliyorsunuz...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                                Yeni Parolanız *
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
                                Yeni Parolanızı Tekrar Girin *
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
                            <KeyRound className="w-4 h-4" />
                            {isSubmitting ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

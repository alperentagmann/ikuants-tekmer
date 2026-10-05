'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/** Loading and error states shared by all public forms. */
export function FormLoadState({ loading, error, onRetry, dark }: { loading: boolean; error: string | null; onRetry: () => void; dark?: boolean }) {
    if (loading) {
        return (
            <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Form yükleniyor">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-14 rounded-lg ${dark ? 'bg-white/5' : 'bg-gray-100 dark:bg-white/5'}`} />
                ))}
            </div>
        );
    }
    if (error) {
        return (
            <div className={`p-6 rounded-xl border text-center ${dark ? 'border-white/10 text-gray-300' : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'}`} role="alert">
                <AlertCircle className="w-8 h-8 mx-auto mb-3 text-amber-500" />
                <p className="mb-4 text-sm">{error}</p>
                <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-current text-sm font-semibold">
                    <RefreshCw className="w-4 h-4" /> Tekrar dene
                </button>
            </div>
        );
    }
    return null;
}

/** Hidden field that real users never fill; bots usually do. */
export function HoneypotField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
            <label>
                Bu alanı boş bırakın
                <input type="text" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
            </label>
        </div>
    );
}

export function FormSubmitError({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <div className="mt-4 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-sm text-red-500" role="alert">
            {message}
        </div>
    );
}

"use client";
import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    requireMatchText?: string;
    isDestructive?: boolean;
    type?: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    description,
    message,
    confirmText = 'Onayla',
    cancelText = 'Vazgeç',
    requireMatchText,
    isDestructive = true,
    type,
    onConfirm,
    onCancel,
}) => {
    const [inputValue, setInputValue] = useState('');

    if (!isOpen) return null;

    const dialogDescription = description || message || '';
    const isActuallyDestructive = isDestructive || type === 'danger';

    const isMatchValid = !requireMatchText || inputValue === requireMatchText;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#0f0f18] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${isActuallyDestructive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold font-orbitron">{title}</h3>
                </div>

                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    {dialogDescription}
                </p>

                {requireMatchText && (
                    <div className="mb-6">
                        <label className="block text-xs font-mono text-gray-400 mb-2">
                            Onaylamak için <span className="text-rose-400 font-bold">{requireMatchText}</span> yazın:
                        </label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={requireMatchText}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-rose-500 outline-none"
                        />
                    </div>
                )}

                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            if (isMatchValid) {
                                onConfirm();
                            }
                        }}
                        disabled={!isMatchValid}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg ${
                            isActuallyDestructive
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 disabled:opacity-40 disabled:hover:bg-rose-600'
                                : 'bg-primary hover:bg-primary/90 text-white shadow-primary/30 disabled:opacity-40'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

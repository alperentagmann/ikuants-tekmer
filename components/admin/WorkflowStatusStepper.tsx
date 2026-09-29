"use client";
import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Send, XCircle } from 'lucide-react';

export type WorkflowState = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';

interface WorkflowStatusStepperProps {
    currentStatus: WorkflowState;
    approvalStatus?: string;
    onStatusChange?: (newStatus: WorkflowState) => void;
    canApprove?: boolean;
}

export const WorkflowStatusStepper: React.FC<WorkflowStatusStepperProps> = ({
    currentStatus,
    approvalStatus,
    onStatusChange,
    canApprove = false,
}) => {
    const steps = [
        { key: 'DRAFT', label: 'Taslak', icon: Clock },
        { key: 'REVIEW', label: 'İncelemede', icon: Send },
        { key: 'APPROVED', label: 'Onaylandı', icon: CheckCircle2 },
        { key: 'PUBLISHED', label: 'Yayında', icon: CheckCircle2 },
    ];

    const getStepStatus = (stepKey: string) => {
        const order = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED'];
        const currentIndex = order.indexOf(currentStatus);
        const stepIndex = order.indexOf(stepKey);

        if (currentStatus === 'REJECTED') return 'rejected';
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'upcoming';
    };

    return (
        <div className="p-4 rounded-xl bg-[#0e0e18] border border-white/10 space-y-4 font-sans">
            <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">İçerik & Yayın Yaşam Döngüsü:</span>
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    currentStatus === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : currentStatus === 'REVIEW'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : currentStatus === 'REJECTED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-white/5 text-gray-300 border-white/10'
                }`}>
                    {currentStatus}
                </span>
            </div>

            {/* Stepper Grid */}
            <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-0.5 bg-white/10 -z-0" />
                
                {steps.map((step) => {
                    const status = getStepStatus(step.key);
                    const Icon = step.icon;
                    return (
                        <div key={step.key} className="flex flex-col items-center gap-1.5 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                status === 'completed'
                                    ? 'bg-cyan-500 border-cyan-400 text-black shadow-lg shadow-cyan-500/30'
                                    : status === 'current'
                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 ring-4 ring-cyan-500/20'
                                    : 'bg-[#0e0e18] border-white/20 text-gray-500'
                            }`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className={`text-[11px] font-mono ${
                                status === 'current' ? 'text-cyan-400 font-bold' : 'text-gray-400'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Action Buttons */}
            {onStatusChange && (
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-end gap-2">
                    {currentStatus === 'DRAFT' && (
                        <button
                            type="button"
                            onClick={() => onStatusChange('REVIEW')}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
                        >
                            İncelemeye Gönder
                        </button>
                    )}
                    {currentStatus === 'REVIEW' && canApprove && (
                        <>
                            <button
                                type="button"
                                onClick={() => onStatusChange('REJECTED')}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-colors"
                            >
                                Reddet
                            </button>
                            <button
                                type="button"
                                onClick={() => onStatusChange('APPROVED')}
                                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
                            >
                                Onayla
                            </button>
                        </>
                    )}
                    {currentStatus === 'APPROVED' && (
                        <button
                            type="button"
                            onClick={() => onStatusChange('PUBLISHED')}
                            className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            Canlıya Al (Yayınla)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { useDynamicForm } from "@/components/forms/useDynamicForm";
import { DynamicFormFields } from "@/components/forms/DynamicFormFields";
import { FormLoadState, HoneypotField, FormSubmitError } from "@/components/forms/FormStatus";
import { getFormTheme } from "@/components/forms/form-themes";

export interface InternshipCardStyle {
    themeKey: string;
    accent: { text: string; border: string; borderBg: string; successBorder: string; successIcon: string; resetBtn: string; submitBtn: string };
    stepLabels: string[];
    sectionIcons: LucideIcon[];
    success: { title: string; message: string; resetLabel: string };
}

/** Shared two-step card used by the student and company internship forms. */
export function InternshipFormCard({ slug, style }: { slug: string; style: InternshipCardStyle }) {
    const form = useDynamicForm(slug);
    const theme = getFormTheme(style.themeKey);
    const currentPage = form.stepIndex + 1;
    const SectionIcon = style.sectionIcons[form.stepIndex] || style.sectionIcons[0];

    if (form.result) {
        return (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`bg-[#0a0a0a] border ${style.accent.successBorder} p-12 rounded-2xl text-center`}>
                <Check className={`w-16 h-16 ${style.accent.successIcon} mx-auto mb-6`} />
                <h2 className="font-orbitron font-bold text-3xl text-white mb-4">{style.success.title}</h2>
                <p className="text-gray-400 mb-6">{form.result.successMessage || style.success.message}</p>
                <button onClick={form.reset} className={`px-8 py-3 ${style.accent.resetBtn} text-white rounded-lg transition-all font-orbitron`}>
                    {style.success.resetLabel}
                </button>
            </motion.div>
        );
    }

    return (
        <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-10 rounded-2xl relative overflow-hidden min-h-[600px] flex flex-col">
            <HoneypotField value={form.honeypot} onChange={form.setHoneypot} />
            {/* Stepper */}
            <div className="flex justify-between mb-8 max-w-xl mx-auto px-4 w-full">
                {form.sections.map((section, i) => (
                    <div key={section.stepNumber} className={`flex flex-col items-center gap-2 ${currentPage >= i + 1 ? style.accent.text : 'text-gray-600'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${currentPage >= i + 1 ? style.accent.borderBg : 'border-gray-800 bg-gray-900'}`}>
                            {i + 1}
                        </div>
                        <span className="text-[10px] font-mono hidden md:block uppercase tracking-widest">
                            {style.stepLabels[i] || section.title}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex-grow">
                {form.loading || form.loadError || !form.definition ? (
                    <FormLoadState loading={form.loading} error={form.loadError || (!form.loading && !form.definition ? 'Form şu anda yayında değil.' : null)} onRetry={form.reload} dark />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div key={`p${currentPage}`} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                            <h3 className={theme.sectionTitle}>
                                <SectionIcon className={theme.sectionIcon} /> {form.currentSection?.title}
                            </h3>
                            <DynamicFormFields
                                fields={form.stepFields}
                                theme={theme}
                                values={form.values}
                                errors={form.errors}
                                onChange={form.setValue}
                                kvkkTexts={form.definition.kvkkTexts}
                                uploadSlug={slug}
                            />
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            <FormSubmitError message={form.submitError} />

            {form.definition && (
                <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                    <button
                        onClick={form.prev}
                        disabled={form.isFirstStep}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition text-sm font-semibold"
                    >
                        <ChevronLeft className="w-4 h-4" /> Geri
                    </button>

                    {form.isLastStep ? (
                        <button
                            onClick={form.submit}
                            disabled={form.submitting}
                            className={`flex items-center gap-2 px-8 py-3 ${style.accent.submitBtn} text-white rounded-lg font-bold disabled:opacity-50 disabled:shadow-none transition-all`}
                        >
                            {form.submitting ? "Gönderiliyor..." : form.definition.submitLabel || "Başvuruyu Gönder"} <Send className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={form.next}
                            className="flex items-center gap-2 px-8 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm font-semibold"
                        >
                            Sonraki <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

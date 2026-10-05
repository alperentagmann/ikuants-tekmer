"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Building2, Flame, Target, Rocket, ChevronRight, ChevronLeft, Check, PieChart, DollarSign } from "lucide-react";
import { useDynamicForm } from "@/components/forms/useDynamicForm";
import { DynamicFormFields } from "@/components/forms/DynamicFormFields";
import { FormLoadState, HoneypotField, FormSubmitError } from "@/components/forms/FormStatus";
import { getFormTheme } from "@/components/forms/form-themes";

/** Questions are managed in Admin > Form Merkezi ("antsfire-basvuru-formu"). */
const FORM_SLUG = "antsfire-basvuru-formu";
const SECTION_ICONS = [Building2, Rocket, PieChart, DollarSign, Target];

export const AntsFireApplication = () => {
    const form = useDynamicForm(FORM_SLUG);
    const theme = getFormTheme("antsfire");
    const currentPage = form.stepIndex + 1;
    const SectionIcon = SECTION_ICONS[form.stepIndex] || Target;

    if (form.result) {
        return (
            <section className="py-24 bg-[#050510]">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] border border-orange-500/30 p-12 rounded-2xl">
                        <Check className="w-16 h-16 text-orange-500 mx-auto mb-6" />
                        <h2 className="font-orbitron font-bold text-3xl text-white mb-4">Başvurunuz Alındı!</h2>
                        <p className="text-gray-400 mb-2">{form.result.successMessage || 'ANTSFire Kuluçka Programı başvurunuz bize ulaştı. Değerlendirme sürecimiz başlamıştır.'}</p>
                        {form.result.applicationNumber && (
                            <p className="text-gray-500 text-sm mb-6">Başvuru numaranız: <span className="font-mono text-orange-400">{form.result.applicationNumber}</span></p>
                        )}
                        <button onClick={() => window.location.href = '/antsfire'} className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-all font-orbitron">
                            Program Sayfasına Dön
                        </button>
                    </motion.div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-24 relative bg-[#050510] min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-900/10 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-4">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-400 font-bold">ANTSFIRE BAŞVURU</span>
                    </div>
                </motion.div>

                {/* Stepper */}
                <div className="flex justify-between mb-8 max-w-3xl mx-auto px-4">
                    {form.sections.map((section, i) => (
                        <div key={section.stepNumber} className={`flex flex-col items-center gap-2 ${currentPage >= i + 1 ? 'text-orange-400' : 'text-gray-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${currentPage >= i + 1 ? 'border-orange-500 bg-orange-500/20' : 'border-gray-800 bg-gray-900'}`}>
                                {i + 1}
                            </div>
                            <span className="text-[10px] font-mono hidden md:block uppercase tracking-widest">
                                {section.title.split(' ')[0]}
                            </span>
                        </div>
                    ))}
                </div>

                <motion.div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-10 rounded-2xl relative overflow-hidden min-h-[600px] flex flex-col">
                    <HoneypotField value={form.honeypot} onChange={form.setHoneypot} />
                    <div className="flex-grow">
                        {form.loading || form.loadError || !form.definition ? (
                            <FormLoadState loading={form.loading} error={form.loadError || (!form.loading && !form.definition ? 'Form şu anda yayında değil.' : null)} onRetry={form.reload} dark />
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div key={`page${currentPage}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
                                        uploadSlug={FORM_SLUG}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>

                    <FormSubmitError message={form.submitError} />

                    {/* Navigation */}
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
                                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-bold hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
                                >
                                    {form.submitting ? "Gönderiliyor..." : form.definition.submitLabel || "Başvuruyu Tamamla"} <Send className="w-4 h-4" />
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
                </motion.div>
            </div>
        </section>
    );
};

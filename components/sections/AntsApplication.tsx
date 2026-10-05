"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ChevronRight, ChevronLeft, Rocket, Check, User, Lightbulb, Users, FileText } from "lucide-react";
import { useDynamicForm } from "@/components/forms/useDynamicForm";
import { DynamicFormFields } from "@/components/forms/DynamicFormFields";
import { FormLoadState, HoneypotField, FormSubmitError } from "@/components/forms/FormStatus";
import { getFormTheme } from "@/components/forms/form-themes";

/** Questions are managed in Admin > Form Merkezi ("antspark-basvuru-formu"). */
const FORM_SLUG = "antspark-basvuru-formu";
const SECTION_ICONS = [User, Lightbulb, Users, FileText];

export const AntsApplication = () => {
    const form = useDynamicForm(FORM_SLUG);
    const theme = getFormTheme("antspark");
    const totalPages = Math.max(form.sections.length, 1);
    const currentPage = form.stepIndex + 1;
    const SectionIcon = SECTION_ICONS[form.stepIndex] || FileText;

    if (form.result) {
        return (
            <section id="antspark-application" className="py-24 relative bg-[#050510]">
                <div className="container mx-auto px-6 max-w-4xl">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0a0a0a] border border-green-500/30 p-12 rounded-2xl text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="font-orbitron font-bold text-3xl text-white mb-4">Başvurunuz Alındı!</h2>
                        <p className="text-gray-400 mb-2">
                            {form.result.successMessage || "Başvurunuz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz."}
                        </p>
                        {form.result.applicationNumber && (
                            <p className="text-gray-500 text-sm mb-6">Başvuru numaranız: <span className="font-mono text-purple-400">{form.result.applicationNumber}</span></p>
                        )}
                        <button
                            onClick={form.reset}
                            className="px-8 py-3 bg-purple-500/20 border border-purple-500 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white transition-all font-orbitron"
                        >
                            Yeni Başvuru
                        </button>
                    </motion.div>
                </div>
            </section>
        );
    }

    return (
        <section id="antspark-application" className="py-24 relative bg-[#050510]">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-4">
                        <Rocket className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-400 font-mono">ANTSPARK ÖN KULUÇKA PROGRAMI</span>
                    </div>
                    <h2 className="font-orbitron font-bold text-3xl md:text-4xl text-white mb-2">
                        Başvuru Formu
                    </h2>
                    <p className="text-gray-400">Fikrini büyüt, işine dönüştür, geleceğe imzanı at!</p>
                </motion.div>

                {/* Progress Bar */}
                {form.sections.length > 0 && (
                    <div className="mb-8">
                        <div className="flex justify-between mb-2">
                            {form.sections.map((section, i) => (
                                <div
                                    key={section.stepNumber}
                                    className={`flex items-center gap-2 ${currentPage >= i + 1 ? 'text-purple-400' : 'text-gray-600'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentPage >= i + 1 ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                                        {i + 1}
                                    </div>
                                    <span className="hidden md:inline text-xs">{section.title.replace(/ ve Tamamlama$/, '')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentPage / totalPages) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#0a0a0a] border border-white/10 p-8 md:p-12 rounded-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
                    <HoneypotField value={form.honeypot} onChange={form.setHoneypot} />

                    {form.loading || form.loadError || !form.definition ? (
                        <FormLoadState loading={form.loading} error={form.loadError || (!form.loading && !form.definition ? 'Form şu anda yayında değil.' : null)} onRetry={form.reload} dark />
                    ) : (
                        <>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`page${currentPage}`}
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -50, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <h3 className={theme.sectionTitle}>
                                        <SectionIcon className={theme.sectionIcon} />
                                        {form.currentSection?.title}
                                    </h3>
                                    {form.currentSection?.description && <p className={theme.help}>{form.currentSection.description}</p>}
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

                            <FormSubmitError message={form.submitError} />

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={form.prev}
                                    disabled={form.isFirstStep}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-orbitron text-sm transition-all ${form.isFirstStep
                                        ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Önceki
                                </button>

                                {!form.isLastStep ? (
                                    <button
                                        type="button"
                                        onClick={form.next}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-orbitron text-sm transition-all ${form.isStepComplete
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                                            : 'bg-white/10 text-gray-500'
                                            }`}
                                    >
                                        Sonraki
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={form.submit}
                                        disabled={form.submitting}
                                        className={`flex items-center gap-2 px-8 py-3 rounded-lg font-orbitron text-sm transition-all ${form.isFormComplete && !form.submitting
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                                            : 'bg-gray-700 text-gray-400'
                                            }`}
                                    >
                                        {form.submitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Gönderiliyor...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                {form.definition.submitLabel || 'Başvuruyu Gönder'}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

"use client";
import React from "react";
import { motion } from "framer-motion";
import { Send, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { useDynamicForm } from "@/components/forms/useDynamicForm";
import { DynamicFormFields } from "@/components/forms/DynamicFormFields";
import { FormLoadState, HoneypotField, FormSubmitError } from "@/components/forms/FormStatus";
import { getFormTheme } from "@/components/forms/form-themes";

/**
 * TEKMER yer edinme (placement) application. This is NOT a program application.
 * Questions are managed in Admin > Form Merkezi ("tekmer-yer-edinme-basvuru-formu").
 */
const FORM_SLUG = "tekmer-yer-edinme-basvuru-formu";

export const Application = () => {
    const form = useDynamicForm(FORM_SLUG);
    const theme = getFormTheme("site");
    const step = form.stepIndex + 1;

    if (form.result) {
        return (
            <section id="application" className="py-24 relative bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
                <div className="container mx-auto px-6 max-w-4xl">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-green-500/30 p-12 rounded-2xl text-center shadow-lg dark:shadow-none"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="font-orbitron font-bold text-3xl text-black dark:text-white mb-4">Başvurunuz Alındı!</h2>
                        <p className="text-black/70 dark:text-gray-400 mb-2">
                            {form.result.successMessage || 'İKÜANTS TEKMER başvurunuz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.'}
                        </p>
                        {form.result.applicationNumber && (
                            <p className="text-sm text-black/50 dark:text-gray-500 mb-6">Başvuru numaranız: <span className="font-mono text-primary">{form.result.applicationNumber}</span></p>
                        )}
                        <button
                            onClick={form.reset}
                            className="px-8 py-3 bg-primary/20 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all font-semibold"
                        >
                            Yeni Başvuru
                        </button>
                    </motion.div>
                </div>
            </section>
        );
    }

    return (
        <section id="application" className="py-24 relative bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="font-orbitron font-bold text-4xl md:text-5xl mb-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">BAŞVURU FORMU</span>
                    </h2>
                    <p className="text-black/70 dark:text-gray-400 max-w-2xl mx-auto">
                        İKÜANTS TEKMER ailesine katılmak için aşağıdaki formu doldurun.
                    </p>
                    {/* Stepper Indicator */}
                    {form.sections.length > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            {form.sections.map((section, i) => (
                                <React.Fragment key={section.stepNumber}>
                                    {i > 0 && <div className={`h-1 w-16 rounded ${step >= i + 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>}
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= i + 1 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>{i + 1}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`form-step-${step}`}
                    className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 p-8 md:p-12 rounded-2xl relative overflow-hidden shadow-lg dark:shadow-none"
                    onSubmit={(e) => e.preventDefault()}
                    noValidate
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
                    <HoneypotField value={form.honeypot} onChange={form.setHoneypot} />

                    {form.loading || form.loadError || !form.definition ? (
                        <FormLoadState loading={form.loading} error={form.loadError || (!form.loading && !form.definition ? 'Form şu anda yayında değil.' : null)} onRetry={form.reload} />
                    ) : (
                        <div className="space-y-8">
                            <h3 className="text-xl text-black dark:text-white font-orbitron font-semibold mb-6 border-b border-gray-200 dark:border-white/10 pb-4 flex items-center justify-between">
                                <span>{form.currentSection?.title}</span>
                                {!form.isFirstStep && (
                                    <button type="button" onClick={form.prev} className="text-sm text-primary flex items-center gap-1 hover:underline">
                                        <ArrowLeft className="w-4 h-4" /> Geri Dön
                                    </button>
                                )}
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

                            <FormSubmitError message={form.submitError} />

                            {!form.isLastStep ? (
                                <button
                                    type="button"
                                    onClick={form.next}
                                    className={`w-full py-5 bg-gradient-to-r from-primary to-purple-600 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-3 group transition-all ${!form.isStepComplete ? 'opacity-50' : 'hover:from-primary/90 hover:to-purple-600/90 shadow-lg'}`}
                                >
                                    SONRAKİ ADIM <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={form.submit}
                                    disabled={form.submitting}
                                    className={`w-full py-5 bg-gradient-to-r from-primary to-purple-600 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-3 group transition-all ${!form.isFormComplete || form.submitting ? 'opacity-70' : 'hover:from-primary/90 hover:to-purple-600/90 shadow-[0_0_30px_rgba(112,0,255,0.3)] hover:shadow-[0_0_50px_rgba(112,0,255,0.5)]'}`}
                                >
                                    {form.submitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            GÖNDERİLİYOR...
                                        </>
                                    ) : (
                                        <>
                                            {form.definition.submitLabel || 'BAŞVURUYU TAMAMLA VE GÖNDER'} <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </motion.form>
            </div>
        </section>
    );
};

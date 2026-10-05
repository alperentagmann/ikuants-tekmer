"use client";
import React from "react";
import { motion } from "framer-motion";
import { Send, Users, Lightbulb, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { useDynamicForm } from "@/components/forms/useDynamicForm";
import { DynamicFormFields } from "@/components/forms/DynamicFormFields";
import { FormLoadState, HoneypotField, FormSubmitError } from "@/components/forms/FormStatus";
import { getFormTheme } from "@/components/forms/form-themes";

/** Questions are managed in Admin > Form Merkezi ("glowup-ideathon-basvuru-formu"). */
const FORM_SLUG = "glowup-ideathon-basvuru-formu";
const SECTION_ICONS = [Users, Lightbulb, Check];

export default function GlowUpBasvuruPage() {
    const form = useDynamicForm(FORM_SLUG);
    const theme = getFormTheme("glowup");
    const currentPage = form.stepIndex + 1;
    const totalPages = Math.max(form.sections.length, 1);
    const SectionIcon = SECTION_ICONS[form.stepIndex] || Check;

    if (form.result) {
        return (
            <div className="py-24 min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
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
                            {form.result.successMessage || 'GLOW UP Ideathon başvurunuz başarıyla gönderildi. Takımınıza en kısa sürede dönüş yapılacaktır.'}
                        </p>
                        {form.result.applicationNumber && (
                            <p className="text-sm text-black/50 dark:text-gray-500 mb-6">Başvuru numaranız: <span className="font-mono text-cyan-500">{form.result.applicationNumber}</span></p>
                        )}
                        <button
                            onClick={form.reset}
                            className="px-8 py-3 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-white transition-all font-semibold"
                        >
                            Yeni Başvuru
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
                        <Lightbulb className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-cyan-400 font-mono">IDEATHON BAŞVURUSU</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl mb-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            GLOW UP
                        </span>
                    </h1>
                    <p className="text-black/70 dark:text-gray-400 max-w-2xl mx-auto">
                        2 günde fikrini iş modeline dönüştür! Takımınızla birlikte başvurun.
                    </p>
                </motion.div>

                {/* Program Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-12 p-8 rounded-2xl bg-white dark:bg-[#0a0a0a] dark:bg-gradient-to-r dark:from-cyan-500/10 dark:via-blue-500/5 dark:to-purple-500/10 border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none"
                >
                    <h2 className="font-orbitron text-xl text-black dark:text-white mb-6 text-center">GLOW UP Nedir?</h2>
                    <p className="text-black/80 dark:text-gray-300 text-center mb-8 max-w-3xl mx-auto">
                        GLOW UP, İKÜANTS TEKMER tarafından düzenlenen 2 günlük yoğun bir ideathon programıdır.
                        Teknoloji odaklı fikirlerinizi deneyimli mentörler eşliğinde geliştirin, iş modeline dönüştürün
                        ve jüri önünde sunarak ödül kazanma şansı yakalayın!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center">
                            <div className="text-3xl mb-2">🚀</div>
                            <h3 className="text-black dark:text-white font-semibold mb-2">2 Gün Yoğun Program</h3>
                            <p className="text-black/70 dark:text-gray-400 text-sm">Fikir geliştirmeden sunuma kadar tüm süreçler</p>
                        </div>
                        <div className="p-5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center">
                            <div className="text-3xl mb-2">👨‍🏫</div>
                            <h3 className="text-black dark:text-white font-semibold mb-2">Uzman Mentörlük</h3>
                            <p className="text-black/70 dark:text-gray-400 text-sm">Alanında uzman mentörlerden birebir destek</p>
                        </div>
                        <div className="p-5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center">
                            <div className="text-3xl mb-2">🏆</div>
                            <h3 className="text-black dark:text-white font-semibold mb-2">Ödüller & Fırsatlar</h3>
                            <p className="text-black/70 dark:text-gray-400 text-sm">Para ödülü ve ANTSPARK'a doğrudan katılım hakkı</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                            <h3 className="text-cyan-600 dark:text-cyan-400 font-semibold mb-3">📅 Program Akışı</h3>
                            <ul className="space-y-2 text-sm text-black/70 dark:text-gray-300">
                                <li>• <strong>1. Gün:</strong> Fikir sunumu, ekip eşleşmesi, problem tanımlama, çözüm tasarımı</li>
                                <li>• <strong>1. Gün Akşam:</strong> Mentör seansları, prototip çalışması</li>
                                <li>• <strong>2. Gün:</strong> İş modeli kanvası, sunum hazırlama, pitch pratiği</li>
                                <li>• <strong>2. Gün Final:</strong> Jüri önünde sunum, değerlendirme ve ödül töreni</li>
                            </ul>
                        </div>
                        <div className="p-5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                            <h3 className="text-cyan-600 dark:text-cyan-400 font-semibold mb-3">🎁 Kazanımlar</h3>
                            <ul className="space-y-2 text-sm text-black/70 dark:text-gray-300">
                                <li>• İlk 3 takıma para ödülü</li>
                                <li>• İlk 3 takıma ANTSPARK Ön Kuluçka Programı'na direkt kabul</li>
                                <li>• Tüm katılımcılara katılım sertifikası</li>
                                <li>• Networking fırsatları ve ekosistem bağlantıları</li>
                                <li>• Mentörlerle kalıcı iletişim imkanı</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {form.sections.map((section) => section.title).map((step, i) => (
                            <span key={i} className={`text-xs font-mono ${currentPage > i ? 'text-cyan-400' : 'text-gray-500'}`}>
                                {step}
                            </span>
                        ))}
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${(currentPage / totalPages) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 p-8 md:p-12 rounded-2xl shadow-lg dark:shadow-none"
                >
                    <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-blue-500 absolute top-0 left-0 rounded-t-2xl" />
                    <HoneypotField value={form.honeypot} onChange={form.setHoneypot} />

                    {form.loading || form.loadError || !form.definition ? (
                        <FormLoadState loading={form.loading} error={form.loadError || (!form.loading && !form.definition ? 'Form şu anda yayında değil.' : null)} onRetry={form.reload} />
                    ) : (
                        <div className="space-y-6">
                            <h2 className={theme.sectionTitle}>
                                <SectionIcon className={theme.sectionIcon} />
                                {form.currentSection?.title}
                            </h2>
                            <DynamicFormFields
                                fields={form.stepFields}
                                theme={theme}
                                values={form.values}
                                errors={form.errors}
                                onChange={form.setValue}
                                kvkkTexts={form.definition.kvkkTexts}
                                uploadSlug={FORM_SLUG}
                            />
                        </div>
                    )}

                    <FormSubmitError message={form.submitError} />

                    {/* Navigation */}
                    {form.definition && (
                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                            {!form.isFirstStep ? (
                                <button
                                    type="button"
                                    onClick={form.prev}
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 dark:bg-white/5 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Önceki
                                </button>
                            ) : <div />}

                            {!form.isLastStep ? (
                                <button
                                    type="button"
                                    onClick={form.next}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${form.isStepComplete
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90'
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
                                    className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${form.isFormComplete && !form.submitting
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90'
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
                    )}
                </motion.div>
            </div>
        </div>
    );
}

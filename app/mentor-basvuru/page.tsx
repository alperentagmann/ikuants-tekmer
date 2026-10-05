"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Send, User, Briefcase, GraduationCap, Target, Check, Award, FileText } from "lucide-react";
import { useDynamicForm } from "@/components/forms/useDynamicForm";
import { DynamicFormFields } from "@/components/forms/DynamicFormFields";
import { FormLoadState, HoneypotField, FormSubmitError } from "@/components/forms/FormStatus";
import { getFormTheme } from "@/components/forms/form-themes";

/** Questions are managed in Admin > Form Merkezi ("mentor-basvuru-formu"). */
const FORM_SLUG = "mentor-basvuru-formu";
const SECTION_ICONS = [User, GraduationCap, Target, Briefcase, FileText, Award];
const sectionClass = "p-6 rounded-xl bg-white/[0.02] border border-white/5";

export default function MentorBasvuruPage() {
    const form = useDynamicForm(FORM_SLUG);
    const theme = getFormTheme("mentor");

    if (form.result) {
        return (
            <div className="py-24 min-h-screen">
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
                            {form.result.successMessage || 'Mentör başvurunuz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.'}
                        </p>
                        {form.result.applicationNumber && (
                            <p className="text-sm text-gray-500 mb-6">Başvuru numaranız: <span className="font-mono text-primary">{form.result.applicationNumber}</span></p>
                        )}
                        <Link
                            href="/mentorler"
                            className="inline-block px-8 py-3 bg-primary/20 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all font-semibold"
                        >
                            Mentörlere Dön
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-24 relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">MENTÖR BAŞVURUSU</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-white mb-4">
                        Mentör Olmak İster Misiniz?
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Deneyimlerinizi genç girişimcilerle paylaşın, geleceği birlikte şekillendirin.
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={(e) => { e.preventDefault(); form.submit(); }}
                    noValidate
                    className="bg-[#0a0a0a] border border-white/10 p-8 md:p-12 rounded-2xl relative overflow-hidden"
                >
                    <div className="h-1 w-full bg-gradient-to-r from-primary to-purple-600 absolute top-0 left-0" />
                    <HoneypotField value={form.honeypot} onChange={form.setHoneypot} />

                    {form.loading || form.loadError || !form.definition ? (
                        <FormLoadState loading={form.loading} error={form.loadError || (!form.loading && !form.definition ? 'Form şu anda yayında değil.' : null)} onRetry={form.reload} dark />
                    ) : (
                        <div className="space-y-10">
                            {form.sections.map((section, i) => {
                                const Icon = SECTION_ICONS[i] || FileText;
                                return (
                                    <div key={section.stepNumber} className={sectionClass}>
                                        <h2 className={theme.sectionTitle}>
                                            <Icon className={theme.sectionIcon} />
                                            {section.title}
                                        </h2>
                                        {section.description && <p className="text-sm text-gray-400 mb-6">{section.description}</p>}
                                        <DynamicFormFields
                                            fields={form.definition!.fields.filter((f) => (f.stepNumber ?? 1) === section.stepNumber)}
                                            theme={theme}
                                            values={form.values}
                                            errors={form.errors}
                                            onChange={form.setValue}
                                            kvkkTexts={form.definition!.kvkkTexts}
                                            uploadSlug={FORM_SLUG}
                                        />
                                    </div>
                                );
                            })}

                            <FormSubmitError message={form.submitError} />

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={form.submitting}
                                className={`w-full py-5 rounded-lg font-orbitron font-bold tracking-widest flex items-center justify-center gap-3 transition-all ${form.isFormComplete && !form.submitting
                                    ? 'bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 shadow-lg shadow-primary/30'
                                    : 'bg-gray-700 text-gray-400'
                                    }`}
                            >
                                {form.submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        GÖNDERİLİYOR...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        {form.definition.submitLabel || 'BAŞVURUYU GÖNDER'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.form>
            </div>
        </div>
    );
}

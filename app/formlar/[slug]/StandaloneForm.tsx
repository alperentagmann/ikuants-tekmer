"use client";
import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { InlineFormCenterForm } from "@/components/forms/InlineFormCenterForm";

export function StandaloneForm({ slug, title, description, themeKey }: { slug: string; title: string; description: string | null; themeKey: string }) {
    const [reference, setReference] = useState<string | null>(null);
    return (
        <div className="min-h-screen bg-gray-50 py-24 dark:bg-[#050510]">
            <div className="container mx-auto max-w-3xl px-6">
                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"><ClipboardList className="h-4 w-4" /> Form</div>
                    <h1 className="mb-3 font-orbitron text-3xl font-bold text-black dark:text-white md:text-4xl">{title}</h1>
                    {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
                </div>
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0c0c18] md:p-10">
                    {reference ? (
                        <div className="py-10 text-center">
                            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
                            <h2 className="mb-2 font-orbitron text-2xl font-bold text-black dark:text-white">Formunuz alındı</h2>
                            <p className="mb-6 text-gray-600 dark:text-gray-400">Referans numaranız: <strong>{reference}</strong></p>
                            <Link href="/" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white">Ana sayfaya dön</Link>
                        </div>
                    ) : (
                        <InlineFormCenterForm slug={slug} themeKey={themeKey} onSubmitted={setReference} />
                    )}
                </div>
            </div>
        </div>
    );
}

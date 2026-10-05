"use client";
import React from "react";
import { Building2, Briefcase } from "lucide-react";
import { InternshipFormCard } from "./InternshipFormCard";

/** Questions are managed in Admin > Form Merkezi ("staj-sirket-talep-formu"). */
export const CompanyInternshipForm = () => (
    <InternshipFormCard
        slug="staj-sirket-talep-formu"
        style={{
            themeKey: "internship-company",
            accent: {
                text: "text-blue-400",
                border: "border-blue-500",
                borderBg: "border-blue-500 bg-blue-500/20",
                successBorder: "border-blue-500/30",
                successIcon: "text-blue-500",
                resetBtn: "bg-blue-600 hover:bg-blue-500",
                submitBtn: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]",
            },
            stepLabels: ["Firma Bilgileri", "Staj Detayları"],
            sectionIcons: [Building2, Briefcase],
            success: {
                title: "Çağrınız Alındı!",
                message: "Stajyer talebiniz başarıyla bize ulaşmıştır. En kısa sürede öğrencilerle eşleştirme süreci başlatılacaktır.",
                resetLabel: "Yeni Çağrı Oluştur",
            },
        }}
    />
);

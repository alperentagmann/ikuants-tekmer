"use client";
import React from "react";
import { User, BookOpen } from "lucide-react";
import { InternshipFormCard } from "./InternshipFormCard";

/** Questions are managed in Admin > Form Merkezi ("staj-ogrenci-basvuru-formu"). */
export const StudentInternshipForm = () => (
    <InternshipFormCard
        slug="staj-ogrenci-basvuru-formu"
        style={{
            themeKey: "internship-student",
            accent: {
                text: "text-green-400",
                border: "border-green-500",
                borderBg: "border-green-500 bg-green-500/20",
                successBorder: "border-green-500/30",
                successIcon: "text-green-500",
                resetBtn: "bg-green-600 hover:bg-green-500",
                submitBtn: "bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]",
            },
            stepLabels: ["Bireysel ve Eğitim", "Staj Tercihleri"],
            sectionIcons: [User, BookOpen],
            success: {
                title: "Başvurunuz Alındı!",
                message: "Staj başvurunuz başarıyla alınmıştır. Girişimlerimizle eşleştirme sağlandığında sizinle iletişime geçeceğiz.",
                resetLabel: "Yeni Başvuru Yap",
            },
        }}
    />
);

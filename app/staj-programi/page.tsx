"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Building2, User } from "lucide-react";
import { CompanyInternshipForm } from "@/components/sections/CompanyInternshipForm";
import { StudentInternshipForm } from "@/components/sections/StudentInternshipForm";

export default function StajProgramiPage() {
    const [activeTab, setActiveTab] = useState<"company" | "student">("company");

    return (
        <section className="py-24 relative bg-[#050510] min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-green-900/10 pointer-events-none" />

            <div className="container mx-auto px-6 max-w-5xl relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <h1 className="font-orbitron font-bold text-4xl text-white mb-4">İKÜANTS TEKMER Staj Programı</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto mb-4">
                        Bu başvuru formu, İKÜANTS TEKMER bünyesindeki girişimci firmaların stajyer ihtiyaçları doğrultusunda öğrenci–firma eşleştirmesi yapılabilmesi amacıyla hazırlanmıştır.
                    </p>
                    <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                        Başvurular, firmalardan gelen staj alanı ve yetkinlik talepleri ile öğrencilerin bilgi, beceri ve ilgi alanları dikkate alınarak değerlendirilecektir. Uygun bulunan adaylar ilgili firmalarla görüşmeye yönlendirilecektir.
                    </p>

                    <div className="flex justify-center gap-4 mb-4">
                        <button
                            onClick={() => setActiveTab("company")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all text-sm ${activeTab === "company"
                                ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                                }`}
                        >
                            <Building2 className="w-5 h-5" />
                            Firma Staj Çağrısı
                        </button>
                        <button
                            onClick={() => setActiveTab("student")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all text-sm ${activeTab === "student"
                                ? "bg-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]"
                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                                }`}
                        >
                            <User className="w-5 h-5" />
                            Öğrenci Staj Başvurusu
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === "company" ? <CompanyInternshipForm /> : <StudentInternshipForm />}
                </motion.div>
            </div>
        </section>
    );
}

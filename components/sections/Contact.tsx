"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Mail, Phone, Lock, Calendar, Clock, Building2, Check } from "lucide-react";
import { siteContent } from "@/data/content";
import { InlineFormCenterForm } from "@/components/forms/InlineFormCenterForm";

export const Contact = () => {
    const { contact } = siteContent;
    const [activeTab, setActiveTab] = useState<'message' | 'meeting' | 'visit'>('message');
    const [meetingSubmitted, setMeetingSubmitted] = useState(false);
    const [contactSubmitted, setContactSubmitted] = useState(false);
    const [visitSubmitted, setVisitSubmitted] = useState(false);
    // "Bilgi Al" links arrive as /iletisim?konu=...; the message form is prefilled with the topic
    const [topic, setTopic] = useState<string | null>(null);
    // Address, e-mail, phone and hours are edited in Admin › Site Ayarları
    const [info, setInfo] = useState({ address: contact.info.address.value, email: contact.info.email.value, phone: contact.info.phone.value, hours: '' });
    useEffect(() => {
        fetch('/api/public/settings').then((r) => r.json()).then((d) => {
            if (d?.settings) setInfo({ address: d.settings.address, email: d.settings.contactEmail, phone: d.settings.phone, hours: d.settings.workingHours });
        }).catch(() => undefined);
    }, []);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            const konu = new URLSearchParams(window.location.search).get('konu');
            if (konu) {
                setTopic(konu.slice(0, 200));
                setActiveTab('message');
                document.getElementById('iletisim-formu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setReady(true);
        }, 0);
        return () => clearTimeout(t);
    }, []);

    return (
        <section id="contact" className="py-24 relative bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            <div className="container mx-auto px-6 max-w-7xl">
                {/* Tab Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap justify-center gap-4 mb-12"
                >
                    <button
                        onClick={() => setActiveTab('message')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'message'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white'
                            : 'bg-gray-200 dark:bg-white/5 text-black dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/10'
                            }`}
                    >
                        <Mail className="w-5 h-5" /> Mesaj Gönder
                    </button>
                    <button
                        onClick={() => setActiveTab('meeting')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'meeting'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white'
                            : 'bg-gray-200 dark:bg-white/5 text-black dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/10'
                            }`}
                    >
                        <Calendar className="w-5 h-5" /> Toplantı Rezervasyonu
                    </button>
                    <button
                        onClick={() => setActiveTab('visit')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'visit'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white'
                            : 'bg-gray-200 dark:bg-white/5 text-black dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/10'
                            }`}
                    >
                        <Building2 className="w-5 h-5" /> Merkez Ziyareti
                    </button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Form Section */}
                    <motion.div
                        id="iletisim-formu"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 p-8 rounded-2xl relative overflow-hidden shadow-lg dark:shadow-none scroll-mt-28"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />

                        {/* Message Form */}
                        {activeTab === 'message' && (
                            contactSubmitted ? (
                                <div className="text-center py-12" >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="font-orbitron text-2xl text-black dark:text-white mb-2">Mesajınız Alındı!</h3>
                                    <p className="text-black/70 dark:text-gray-400">En kısa sürede dönüş yapacağız.</p>
                                    <button onClick={() => setContactSubmitted(false)} className="mt-6 text-primary hover:underline">
                                        Yeni Mesaj Gönder
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-orbitron font-bold text-black dark:text-white mb-2">{contact.header}</h2>
                                    <p className="text-gray-400 text-sm mb-8">{contact.description}</p>

                                    {topic && (
                                        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                                            Bilgi talebi: <strong>{topic}</strong>
                                        </div>
                                    )}
                                    {ready && (
                                        <InlineFormCenterForm
                                            slug="iletisim-mesaj-formu"
                                            themeKey="contact"
                                            initial={topic ? { message: `${topic} hakkında detaylı bilgi almak istiyorum.

` } : undefined}
                                            context={topic ? { entityType: 'InfoRequest', label: topic } : null}
                                            onSubmitted={() => setContactSubmitted(true)}
                                        />
                                    )}
                                </>
                            )
                        )}

                        {/* Meeting Reservation Form */}
                        {activeTab === 'meeting' && (
                            <>
                                {meetingSubmitted ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="font-orbitron text-2xl text-black dark:text-white mb-2">Rezervasyon Alındı!</h3>
                                        <p className="text-black/70 dark:text-gray-400">En kısa sürede onay maili göndereceğiz.</p>
                                        <button onClick={() => setMeetingSubmitted(false)} className="mt-6 text-primary hover:underline">
                                            Yeni Rezervasyon
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-orbitron font-bold text-black dark:text-white mb-2 flex items-center gap-2">
                                            <Calendar className="w-6 h-6 text-primary" />
                                            Toplantı Rezervasyonu
                                        </h2>
                                        <p className="text-black/70 dark:text-gray-400 text-sm mb-6">Online veya yüz yüze toplantı için randevu alın.</p>

                                        <InlineFormCenterForm slug="iletisim-toplanti-formu" themeKey="contact" buttonClassName="w-full py-4 bg-gradient-to-r from-primary to-purple-600 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" onSubmitted={() => setMeetingSubmitted(true)} />
                                    </>
                                )}
                            </>
                        )}

                        {/* Visit Reservation Form */}
                        {activeTab === 'visit' && (
                            <>
                                {visitSubmitted ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="font-orbitron text-2xl text-black dark:text-white mb-2">Ziyaret Randevusu Alındı!</h3>
                                        <p className="text-black/70 dark:text-gray-400">En kısa sürede onay maili göndereceğiz.</p>
                                        <button onClick={() => setVisitSubmitted(false)} className="mt-6 text-primary hover:underline">
                                            Yeni Randevu
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-orbitron font-bold text-black dark:text-white mb-2 flex items-center gap-2">
                                            <Building2 className="w-6 h-6 text-primary" />
                                            Merkez Ziyareti Randevusu
                                        </h2>
                                        <p className="text-black/70 dark:text-gray-400 text-sm mb-6">İKÜANTS TEKMER'i yerinde görmek için randevu alın.</p>

                                        <InlineFormCenterForm slug="iletisim-ziyaret-formu" themeKey="contact" buttonClassName="w-full py-4 bg-gradient-to-r from-primary to-purple-600 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" onSubmitted={() => setVisitSubmitted(true)} />
                                    </>
                                )}
                            </>
                        )}
                    </motion.div>

                    {/* Info / Map Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-8"
                    >
                        <div className="bg-white dark:bg-[#0a0a0a]/50 border border-gray-200 dark:border-white/5 p-8 rounded-2xl backdrop-blur-sm shadow-lg dark:shadow-none">
                            <h3 className="flex items-center gap-2 text-xl font-orbitron font-bold text-black dark:text-white mb-6">
                                <Lock className="w-5 h-5 text-secondary" />
                                MERKEZ KOORDİNATLARI
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-4 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-primary/30 transition-colors">
                                    <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                                    <div>
                                        <h4 className="text-black dark:text-white font-bold mb-1">{contact.info.address.title}</h4>
                                        <p className="text-black/70 dark:text-gray-400 text-sm">{info.address}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-primary/30 transition-colors">
                                    <Mail className="w-6 h-6 text-primary shrink-0" />
                                    <div>
                                        <h4 className="text-black dark:text-white font-bold mb-1">{contact.info.email.title}</h4>
                                        <p className="text-black/70 dark:text-gray-400 text-sm">{info.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-primary/30 transition-colors">
                                    <Phone className="w-6 h-6 text-primary shrink-0" />
                                    <div>
                                        <h4 className="text-black dark:text-white font-bold mb-1">{contact.info.phone.title}</h4>
                                        <p className="text-black/70 dark:text-gray-400 text-sm">{info.phone}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-primary/30 transition-colors">
                                    <Clock className="w-6 h-6 text-primary shrink-0" />
                                    <div>
                                        <h4 className="text-black dark:text-white font-bold mb-1">Çalışma Saatleri</h4>
                                        <p className="text-black/70 dark:text-gray-400 text-sm">{info.hours || "Pazartesi - Cuma: 09:00 - 18:00"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Google Maps Link */}
                        <a
                            href="https://maps.app.goo.gl/UXsG9T7rdk444EwMA"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-h-[200px] bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all"
                        >
                            <div className="absolute inset-0 bg-secondary/10 opacity-20 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px]" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 bg-primary rounded-full animate-ping absolute" />
                                <div className="w-4 h-4 bg-primary rounded-full relative z-10 shadow-[0_0_20px_#7000ff]" />
                            </div>
                            <div className="absolute bottom-4 left-4 font-mono text-xs text-secondary">
                                GPS: 40.9868° N, 28.8521° E
                            </div>
                            <div className="absolute inset-0 bg-transparent group-hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="bg-black/80 px-4 py-2 rounded text-white text-xs font-bold border border-white/20 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    GOOGLE MAPS'TE AÇ
                                </span>
                            </div>
                        </a>

                    </motion.div>
                </div>
            </div >
        </section >
    );
};

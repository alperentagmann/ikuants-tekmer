"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Send, Mail, Phone, Lock, Calendar, Clock, Users, Building2, Check } from "lucide-react";
import { siteContent } from "@/data/content";

const meetingTopics = [
    "Girişimcilik Danışmanlığı",
    "Proje Değerlendirmesi",
    "Mentorluk Görüşmesi",
    "Yatırım Görüşmesi",
    "İş Birliği Önerisi",
    "Teknik Destek",
    "Diğer"
];

const visitTopics = [
    "TEKMER Tanıtım Turu",
    "Kuluçka Programı Bilgilendirme",
    "Coworking Alan İnceleme",
    "Laboratuvar Ziyareti",
    "Etkinlik Mekanı İnceleme",
    "Kurumsal Ziyaret",
    "Diğer"
];

const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

export const Contact = () => {
    const { contact } = siteContent;
    const [activeTab, setActiveTab] = useState<'message' | 'meeting' | 'visit'>('message');
    const [meetingSubmitted, setMeetingSubmitted] = useState(false);
    const [visitSubmitted, setVisitSubmitted] = useState(false);

    const [meetingForm, setMeetingForm] = useState({
        name: "", email: "", phone: "", company: "", topic: "", meetWith: "", date: "", time: "", notes: ""
    });

    const [contactForm, setContactForm] = useState({
        name: "", email: "", phone: "", company: "", message: ""
    });

    const [visitForm, setVisitForm] = useState({
        name: "", email: "", phone: "", company: "", topic: "", visitWho: "", date: "", time: "", groupSize: "", notes: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contactSubmitted, setContactSubmitted] = useState(false);

    const submitToApi = async (type: string, data: any) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, ...data })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return true;
        } catch (error) {
            console.error(error);
            alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await submitToApi('message', contactForm);
        if (success) {
            setContactSubmitted(true);
            setContactForm({ name: "", email: "", phone: "", company: "", message: "" });
        }
    };

    const handleMeetingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await submitToApi('meeting', meetingForm);
        if (success) {
            setMeetingSubmitted(true);
            setMeetingForm({ name: "", email: "", phone: "", company: "", topic: "", meetWith: "", date: "", time: "", notes: "" });
        }
    };

    const handleVisitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await submitToApi('visit', visitForm);
        if (success) {
            setVisitSubmitted(true);
            setVisitForm({ name: "", email: "", phone: "", company: "", topic: "", visitWho: "", date: "", time: "", groupSize: "", notes: "" });
        }
    };

    const inputClass = "w-full bg-[#1a1a1a] border border-white/10 rounded-lg focus:border-primary focus:bg-[#222] p-3 text-white outline-none transition-all text-sm [&>option]:bg-[#1a1a1a] [&>option]:text-white";
    const labelClass = "text-xs uppercase tracking-wider text-gray-500 font-bold";

    return (
        <section id="contact" className="py-24 relative">
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
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <Mail className="w-5 h-5" /> Mesaj Gönder
                    </button>
                    <button
                        onClick={() => setActiveTab('meeting')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'meeting'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <Calendar className="w-5 h-5" /> Toplantı Rezervasyonu
                    </button>
                    <button
                        onClick={() => setActiveTab('visit')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'visit'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <Building2 className="w-5 h-5" /> Merkez Ziyareti
                    </button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Form Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />

                        {/* Message Form */}
                        {activeTab === 'message' && (
                            contactSubmitted ? (
                                <div className="text-center py-12" >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="font-orbitron text-2xl text-white mb-2">Mesajınız Alındı!</h3>
                                    <p className="text-gray-400">En kısa sürede dönüş yapacağız.</p>
                                    <button onClick={() => setContactSubmitted(false)} className="mt-6 text-primary hover:underline">
                                        Yeni Mesaj Gönder
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-orbitron font-bold text-white mb-2">{contact.header}</h2>
                                    <p className="text-gray-400 text-sm mb-8">{contact.description}</p>

                                    <form onSubmit={handleContactSubmit} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className={labelClass}>Ad Soyad *</label>
                                                <input type="text" className={inputClass} placeholder="John Doe" required
                                                    value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelClass}>E-Posta *</label>
                                                <input type="email" className={inputClass} placeholder="email@example.com" required
                                                    value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className={labelClass}>Telefon Numarası *</label>
                                                <input type="tel" className={inputClass} placeholder="+90 5XX XXX XX XX" required
                                                    value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelClass}>Kuruluş / Şirket</label>
                                                <input type="text" className={inputClass} placeholder="Şirket adı (opsiyonel)"
                                                    value={contactForm.company} onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className={labelClass}>Mesaj İçeriği *</label>
                                            <textarea rows={4} className={inputClass} placeholder="Girişimim hakkında bilgi almak istiyorum..." required
                                                value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
                                        </div>

                                        <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-primary hover:bg-primary/80 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-2 group transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    GÖNDER
                                                </>
                                            )}
                                        </button>
                                    </form>
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
                                        <h3 className="font-orbitron text-2xl text-white mb-2">Rezervasyon Alındı!</h3>
                                        <p className="text-gray-400">En kısa sürede onay maili göndereceğiz.</p>
                                        <button onClick={() => setMeetingSubmitted(false)} className="mt-6 text-primary hover:underline">
                                            Yeni Rezervasyon
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-orbitron font-bold text-white mb-2 flex items-center gap-2">
                                            <Calendar className="w-6 h-6 text-primary" />
                                            Toplantı Rezervasyonu
                                        </h2>
                                        <p className="text-gray-400 text-sm mb-6">Online veya yüz yüze toplantı için randevu alın.</p>

                                        <form onSubmit={handleMeetingSubmit} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Ad Soyad *</label>
                                                    <input type="text" className={inputClass} required
                                                        value={meetingForm.name} onChange={(e) => setMeetingForm({ ...meetingForm, name: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass}>E-Posta *</label>
                                                    <input type="email" className={inputClass} required
                                                        value={meetingForm.email} onChange={(e) => setMeetingForm({ ...meetingForm, email: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Telefon *</label>
                                                    <input type="tel" className={inputClass} required placeholder="+90 5XX XXX XX XX"
                                                        value={meetingForm.phone} onChange={(e) => setMeetingForm({ ...meetingForm, phone: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Şirket / Kurum</label>
                                                    <input type="text" className={inputClass}
                                                        value={meetingForm.company} onChange={(e) => setMeetingForm({ ...meetingForm, company: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelClass}>Toplantı Konusu *</label>
                                                <select className={inputClass} required
                                                    value={meetingForm.topic} onChange={(e) => setMeetingForm({ ...meetingForm, topic: e.target.value })}>
                                                    <option value="">Konu Seçin</option>
                                                    {meetingTopics.map((topic) => (
                                                        <option key={topic} value={topic}>{topic}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelClass}>Toplantıyı kiminle gerçekleştirmek istersiniz? *</label>
                                                <select className={inputClass} required
                                                    value={meetingForm.meetWith} onChange={(e) => setMeetingForm({ ...meetingForm, meetWith: e.target.value })}>
                                                    <option value="">Kişi Seçin</option>
                                                    <option value="M. Cem Okur">M. Cem Okur</option>
                                                    <option value="Alperen Tağman">Alperen Tağman</option>
                                                    <option value="Tüm TEKMER Ekibi">Tüm TEKMER Ekibi</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Tarih *</label>
                                                    <input type="date" className={inputClass} required
                                                        min={new Date().toISOString().split('T')[0]}
                                                        value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Saat *</label>
                                                    <select className={inputClass} required
                                                        value={meetingForm.time} onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}>
                                                        <option value="">Saat Seçin</option>
                                                        {timeSlots.map((time) => (
                                                            <option key={time} value={time}>{time}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelClass}>Ek Notlar</label>
                                                <textarea rows={2} className={inputClass} placeholder="Toplantı hakkında eklemek istediğiniz bilgiler..."
                                                    value={meetingForm.notes} onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })} />
                                            </div>
                                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                                                {isSubmitting ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Calendar className="w-5 h-5" />
                                                        RANDEVU AL
                                                    </>
                                                )}
                                            </button>
                                        </form>
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
                                        <h3 className="font-orbitron text-2xl text-white mb-2">Ziyaret Randevusu Alındı!</h3>
                                        <p className="text-gray-400">En kısa sürede onay maili göndereceğiz.</p>
                                        <button onClick={() => setVisitSubmitted(false)} className="mt-6 text-primary hover:underline">
                                            Yeni Randevu
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-orbitron font-bold text-white mb-2 flex items-center gap-2">
                                            <Building2 className="w-6 h-6 text-primary" />
                                            Merkez Ziyareti Randevusu
                                        </h2>
                                        <p className="text-gray-400 text-sm mb-6">İKÜANTS TEKMER'i yerinde görmek için randevu alın.</p>

                                        <form onSubmit={handleVisitSubmit} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Ad Soyad *</label>
                                                    <input type="text" className={inputClass} required
                                                        value={visitForm.name} onChange={(e) => setVisitForm({ ...visitForm, name: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass}>E-Posta *</label>
                                                    <input type="email" className={inputClass} required
                                                        value={visitForm.email} onChange={(e) => setVisitForm({ ...visitForm, email: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Telefon *</label>
                                                    <input type="tel" className={inputClass} required placeholder="+90 5XX XXX XX XX"
                                                        value={visitForm.phone} onChange={(e) => setVisitForm({ ...visitForm, phone: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Şirket / Kurum</label>
                                                    <input type="text" className={inputClass}
                                                        value={visitForm.company} onChange={(e) => setVisitForm({ ...visitForm, company: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Ziyaret Konusu *</label>
                                                    <select className={inputClass} required
                                                        value={visitForm.topic} onChange={(e) => setVisitForm({ ...visitForm, topic: e.target.value })}>
                                                        <option value="">Konu Seçin</option>
                                                        {visitTopics.map((topic) => (
                                                            <option key={topic} value={topic}>{topic}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Kişi Sayısı *</label>
                                                    <input type="number" min="1" max="20" className={inputClass} required placeholder="1"
                                                        value={visitForm.groupSize} onChange={(e) => setVisitForm({ ...visitForm, groupSize: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelClass}>Merkez'de kimi ziyaret edeceksiniz? *</label>
                                                <select className={inputClass} required
                                                    value={visitForm.visitWho} onChange={(e) => setVisitForm({ ...visitForm, visitWho: e.target.value })}>
                                                    <option value="">Kişi Seçin</option>
                                                    <option value="M. Cem Okur">M. Cem Okur</option>
                                                    <option value="Alperen Tağman">Alperen Tağman</option>
                                                    <option value="Tüm TEKMER Ekibi">Tüm TEKMER Ekibi</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Tarih *</label>
                                                    <input type="date" className={inputClass} required
                                                        min={new Date().toISOString().split('T')[0]}
                                                        value={visitForm.date} onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Saat *</label>
                                                    <select className={inputClass} required
                                                        value={visitForm.time} onChange={(e) => setVisitForm({ ...visitForm, time: e.target.value })}>
                                                        <option value="">Saat Seçin</option>
                                                        {timeSlots.map((time) => (
                                                            <option key={time} value={time}>{time}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelClass}>Ek Notlar</label>
                                                <textarea rows={2} className={inputClass} placeholder="Ziyaret hakkında eklemek istediğiniz bilgiler..."
                                                    value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} />
                                            </div>
                                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                                                {isSubmitting ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Building2 className="w-5 h-5" />
                                                        ZİYARET RANDEVUSU AL
                                                    </>
                                                )}
                                            </button>
                                        </form>
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
                        <div className="bg-[#0a0a0a]/50 border border-white/5 p-8 rounded-2xl backdrop-blur-sm">
                            <h3 className="flex items-center gap-2 text-xl font-orbitron font-bold text-white mb-6">
                                <Lock className="w-5 h-5 text-secondary" />
                                MERKEZ KOORDİNATLARI
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-4 rounded bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                                    <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                                    <div>
                                        <h4 className="text-white font-bold mb-1">{contact.info.address.title}</h4>
                                        <p className="text-gray-400 text-sm">{contact.info.address.value}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                                    <Mail className="w-6 h-6 text-primary shrink-0" />
                                    <div>
                                        <h4 className="text-white font-bold mb-1">{contact.info.email.title}</h4>
                                        <p className="text-gray-400 text-sm">{contact.info.email.value}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                                    <Phone className="w-6 h-6 text-primary shrink-0" />
                                    <div>
                                        <h4 className="text-white font-bold mb-1">{contact.info.phone.title}</h4>
                                        <p className="text-gray-400 text-sm">{contact.info.phone.value}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                                    <Clock className="w-6 h-6 text-primary shrink-0" />
                                    <div>
                                        <h4 className="text-white font-bold mb-1">Çalışma Saatleri</h4>
                                        <p className="text-gray-400 text-sm">Pazartesi - Cuma: 09:00 - 18:00</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Google Maps Link */}
                        <a
                            href="https://maps.app.goo.gl/UXsG9T7rdk444EwMA"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-h-[200px] bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all"
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

"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, Monitor, Gamepad2, Video, Users,
    Laptop, Coffee, MessageSquare, Wifi, Clock, Loader2,
    Calendar, CheckCircle2, AlertCircle, ArrowRight,
    Search, Sparkles, X, Shield, Phone, Mail, FileText,
    Boxes, Radio, Info, ChevronLeft, ChevronRight, Zap, Cpu, Printer, Receipt
} from "lucide-react";
import { SpaceExplorer } from "@/components/spaces/SpaceExplorer";
import { SpaceDetailDrawer } from "@/components/spaces/SpaceDetailDrawer";
import { MaybeStudioBlock } from "@/components/home/StudioFrame";
import { pageText } from "@/lib/homepage-layout";
import { celebrate } from "@/lib/celebrate";
import { MACHINE_QUOTE_FORM_SLUG, isMachineFacility } from "@/lib/machines";
import { SPACE_GROUPS, spaceGroupKey, type GalleryImage } from "@/lib/facility-media";
import { CalendarCheck, MousePointerClick, MailCheck } from "lucide-react";
import { InlineFormCenterForm } from "@/components/forms/InlineFormCenterForm";
import type { PublicPlacement } from "@/lib/services/form-placement-service";
import { useDynamicForm } from "@/components/forms/useDynamicForm";
import { DynamicFormFields } from "@/components/forms/DynamicFormFields";
import { HoneypotField } from "@/components/forms/FormStatus";
import { getFormTheme } from "@/components/forms/form-themes";
import dynamic from "next/dynamic";
import type { ViewerExperience } from "@/components/three/FacilityViewer";

// The 3D viewer and its library load only when a visitor opens a 3D view
const FacilityViewer = dynamic(() => import("@/components/three/FacilityViewer").then((m) => m.FacilityViewer), {
    ssr: false,
    loading: () => <div className="h-[60vh] min-h-[320px] rounded-2xl bg-[#0b0b14] flex items-center justify-center text-sm text-gray-400">3D görüntüleyici yükleniyor...</div>,
});

/** Requester questions are managed in Admin > Form Merkezi ("rezervasyon-talep-formu"). */
const RESERVATION_FORM_SLUG = "rezervasyon-talep-formu";

interface Facility {
    id: string;
    title: string;
    description: string;
    facilityType: string;
    featuresJson: string | null;
    iconName: string | null;
    coverImageUrl?: string | null;
    galleryJson?: string | null;
    sortOrder: number;
    isActive: boolean;
    has3D?: boolean;
}

export type SpaceSlot = { id: string; key: string; label: string; config?: Record<string, unknown>; node?: React.ReactNode };

/** Public spaces page. Section order comes from the design studio (Admin › Tasarım Stüdyosu › Kullanım alanları). */
export function SpacesPageClient({ slots, studio = false }: { slots: SpaceSlot[]; studio?: boolean }) {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [galleryView, setGalleryView] = useState<{ title: string; images: GalleryImage[]; index: number } | null>(null);
    const [quoteFor, setQuoteFor] = useState<{ id: string; title: string; reference: string | null } | null>(null);
    const [quoteSent, setQuoteSent] = useState<string | null>(null);
    const [placements, setPlacements] = useState<PublicPlacement[]>([]);
    const [placementSent, setPlacementSent] = useState<Record<string, string>>({});

    useEffect(() => {
        fetch('/api/public/form-placements?target=SPACES_PAGE').then((r) => r.json()).then((d) => setPlacements(Array.isArray(d.placements) ? d.placements : [])).catch(() => setPlacements([]));
    }, []);

    const [detailFac, setDetailFac] = useState<Facility | null>(null);

    // Müsaitlik Arama Barı (Section 591)
    const [finderDate, setFinderDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1); // Tomorrow default
        return d.toISOString().split('T')[0];
    });
    const [finderStartTime, setFinderStartTime] = useState("14:00");
    const [finderEndTime, setFinderEndTime] = useState("16:00");
    const [finderParticipants, setFinderParticipants] = useState(4);
    const [finderLoading, setFinderLoading] = useState(false);
    const [availabilityMap, setAvailabilityMap] = useState<Record<string, { isAvailable: boolean; message: string; capacityWarning?: string }>>({});
    const [finderSearched, setFinderSearched] = useState(false);

    // Rezervasyon Modal State (Section 571, 572)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
    const [formData, setFormData] = useState({
        date: "",
        startTime: "14:00",
        endTime: "16:00",
        participantCount: 4,
    });
    const requester = useDynamicForm(RESERVATION_FORM_SLUG);

    // 3D / 360 view (only for facilities with a real, published asset)
    const [viewerFacility, setViewerFacility] = useState<Facility | null>(null);
    const [viewerExperience, setViewerExperience] = useState<ViewerExperience | null>(null);
    const [viewerError, setViewerError] = useState<string | null>(null);
    const open3D = async (fac: Facility) => {
        setViewerFacility(fac);
        setViewerExperience(null);
        setViewerError(null);
        try {
            const res = await fetch(`/api/public/facilities/${fac.id}/experience`);
            const data = await res.json();
            if (data.success) setViewerExperience(data.experience);
            else setViewerError(data.message || '3D görünüm yüklenemedi.');
        } catch {
            setViewerError('3D görünüm yüklenemedi.');
        }
    };
    const requesterTheme = getFormTheme("reservation");

    // Modal Availability Check (Section 573, 574, 575)
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [slotStatus, setSlotStatus] = useState<{
        checked: boolean;
        isAvailable: boolean;
        message: string;
        capacityWarning?: string | null;
        alternativeSlots?: string[];
        suggestedAlternativeSpace?: string | null;
    } | null>(null);

    // Submission states
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submittedResult, setSubmittedResult] = useState<{
        reference: string;
        spaceName: string;
        date: string;
        time: string;
        status: string;
        message: string;
    } | null>(null);

    const iconMap: Record<string, any> = {
        Zap,
        Cpu,
        Printer,
        Monitor,
        Gamepad2,
        Video,
        Laptop,
        Coffee,
        MessageSquare,
        Building2,
        Boxes,
        Radio,
        Users,
    };

    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const res = await fetch('/api/public/facilities');
                const data = await res.json();
                if (data.success && Array.isArray(data.facilities)) {
                    setFacilities(data.facilities);
                    if (data.facilities.length > 0 && !selectedSpaceId) {
                        setSelectedSpaceId(data.facilities[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load facilities:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFacilities();
    }, []);

    // Set initial date in form when finderDate changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            date: finderDate,
            startTime: finderStartTime,
            endTime: finderEndTime,
            participantCount: finderParticipants,
        }));
    }, [finderDate, finderStartTime, finderEndTime, finderParticipants]);

    // Handle Müsaitlik Arama Barı submit (Section 591)
    const handleSearchAllAvailability = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (facilities.length === 0) return;

        setFinderLoading(true);
        setFinderSearched(true);
        const newMap: Record<string, any> = {};

        try {
            await Promise.all(
                facilities.map(async (fac) => {
                    try {
                        const res = await fetch('/api/public/reservations/availability', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                spaceId: fac.id,
                                date: finderDate,
                                startTime: finderStartTime,
                                endTime: finderEndTime,
                                participantCount: finderParticipants,
                            }),
                        });
                        const data = await res.json();
                        newMap[fac.id] = {
                            isAvailable: data.isAvailable ?? false,
                            message: data.message || '',
                            capacityWarning: data.capacityWarning,
                        };
                    } catch {
                        newMap[fac.id] = { isAvailable: false, message: 'Kontrol edilemedi' };
                    }
                })
            );
            setAvailabilityMap(newMap);
        } finally {
            setFinderLoading(false);
        }
    };

    // Live availability check inside modal (Section 573)
    const checkModalAvailability = async (spaceId: string, date: string, startTime: string, endTime: string, count: number) => {
        if (!spaceId || !date || !startTime || !endTime) return;

        setCheckingAvailability(true);
        try {
            const res = await fetch('/api/public/reservations/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spaceId,
                    date,
                    startTime,
                    endTime,
                    participantCount: count,
                }),
            });
            const data = await res.json();
            setSlotStatus({
                checked: true,
                isAvailable: data.isAvailable ?? false,
                message: data.message || (data.isAvailable ? '✓ Seçtiğiniz saat aralığında alan müsait.' : '✕ Bu alan seçilen saatlerde dolu.'),
                capacityWarning: data.capacityWarning,
                alternativeSlots: data.alternativeSlots,
                suggestedAlternativeSpace: data.suggestedAlternativeSpace,
            });
        } catch {
            setSlotStatus(null);
        } finally {
            setCheckingAvailability(false);
        }
    };

    // Trigger check when key fields change in modal
    useEffect(() => {
        if (isModalOpen && selectedSpaceId && formData.date && formData.startTime && formData.endTime) {
            const timer = setTimeout(() => {
                checkModalAvailability(selectedSpaceId, formData.date, formData.startTime, formData.endTime, formData.participantCount);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isModalOpen, selectedSpaceId, formData.date, formData.startTime, formData.endTime, formData.participantCount]);

    // Open modal with specific space pre-selected (Section 572)
    const handleOpenReservation = (spaceId?: string, times?: { date: string; startTime: string; endTime: string }) => {
        if (spaceId) {
            setSelectedSpaceId(spaceId);
        }
        if (times) setFormData((prev) => ({ ...prev, ...times }));
        setSubmitError(null);
        setSubmittedResult(null);
        setIsModalOpen(true);
    };

    // Handle Reservation Form Submit (Section 576, 586)
    const handleSubmitReservation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requester.validateAll()) {
            setSubmitError('Lütfen işaretli alanları kontrol edin.');
            return;
        }
        setSubmitting(true);
        setSubmitError(null);

        try {
            const res = await fetch('/api/public/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    spaceId: selectedSpaceId,
                    values: requester.values,
                    ...requester.getSubmissionMeta(),
                }),
            });

            const data = await res.json();
            if (data.fieldErrors) requester.setErrors(data.fieldErrors);

            if (data.success) {
                requester.reset();
                celebrate({ reference: data.reference, message: data.message });
                setSubmittedResult({
                    reference: data.reference,
                    spaceName: data.spaceName,
                    date: data.date,
                    time: data.time,
                    status: 'Onay Bekliyor',
                    message: data.message,
                });
            } else {
                setSubmitError(data.error || 'Talep iletilirken bir hata oluştu.');
            }
        } catch (err: any) {
            setSubmitError(err.message || 'Bağlantı hatası oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const features = [
        { icon: Wifi, text: "Yüksek Hızlı İnternet" },
        { icon: Clock, text: "Rezervasyonlu Erişim" },
        { icon: Users, text: "Girişimci & Ekip Alanları" },
        { icon: Building2, text: "Modern Donanım & Reji" }
    ];

    const selectedFacility = facilities.find(f => f.id === selectedSpaceId);

    const introText = (field: string) => pageText("spacesIntro", slots.find((s) => s.key === "spacesIntro")?.config, field);
    const wrap = (node: React.ReactNode) => <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">{node}</div>;
    const parts: Record<string, React.ReactNode> = {
        spacesIntro: wrap(<>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono font-semibold">{introText("eyebrow")}</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-3xl sm:text-4xl md:text-5xl text-black dark:text-white mb-4">
                        {introText("title")}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed text-sm sm:text-base">
                        {introText("text")}
                    </p>
                </motion.div>
        </>),
        spacesFeatures: wrap(<>
                {/* Features Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12"
                >
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                            <feature.icon className="w-5 h-5 text-secondary flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium">{feature.text}</span>
                        </div>
                    ))}
                </motion.div>
                {/* How it works */}
                <ol className="-mt-6 mb-12 grid gap-3 sm:grid-cols-3" aria-label="Rezervasyon nasıl çalışır">
                    {[
                        { icon: MousePointerClick, title: "Alanı seçin", text: "Filtreleyin, detayına bakın, fotoğrafları ve donanımı inceleyin." },
                        { icon: CalendarCheck, title: "Saati seçip talep gönderin", text: "Doluluk çizelgesinden boş saate tıklayın; form o saatle açılır." },
                        { icon: MailCheck, title: "Onay e-postası alın", text: "Ekibimiz talebi onaylar. Makinelerde fiyat teklifi gönderilir." },
                    ].map((s, i) => (
                        <li key={s.title} className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-sm font-bold text-white shadow-lg shadow-primary/30">{i + 1}</span>
                            <div>
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white"><s.icon className="h-4 w-4 text-primary" />{s.title}</div>
                                <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{s.text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
        </>),
        spacesFinder: wrap(<>
                {/* Section 591: "HEMEN MÜSAİTLİK BUL" WIDGET */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-14 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-900/10 to-secondary/10 border border-primary/20 shadow-xl backdrop-blur-sm"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        <h2 className="text-lg font-bold font-orbitron text-black dark:text-white">
                            Hemen Müsait Alan Bul
                        </h2>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 hidden sm:inline">
                            — Tarih ve saat seçerek tüm alanların durumunu tek tıkla sorgulayın
                        </span>
                    </div>

                    <form onSubmit={handleSearchAllAvailability} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-end">
                        <div>
                            <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Tarih
                            </label>
                            <input
                                type="date"
                                required
                                value={finderDate}
                                onChange={(e) => setFinderDate(e.target.value)}
                                className="w-full bg-white dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Başlangıç Saati
                            </label>
                            <input
                                type="time"
                                required
                                value={finderStartTime}
                                onChange={(e) => setFinderStartTime(e.target.value)}
                                className="w-full bg-white dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-black dark:text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Bitiş Saati
                            </label>
                            <input
                                type="time"
                                required
                                value={finderEndTime}
                                onChange={(e) => setFinderEndTime(e.target.value)}
                                className="w-full bg-white dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-black dark:text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Katılımcı Sayısı
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={finderParticipants}
                                onChange={(e) => setFinderParticipants(Number(e.target.value))}
                                className="w-full bg-white dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={finderLoading}
                                className="w-full py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer h-[41px]"
                            >
                                {finderLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Sorgulanıyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4" />
                                        <span>Müsait Alanları Göster</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
        </>),
        spacesList: wrap(loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-gray-500 font-mono text-sm">Ortak alan envanteri yükleniyor...</p>
                    </div>
        ) : (
            <SpaceExplorer
                facilities={facilities}
                iconFor={(fac) => (fac.iconName && iconMap[fac.iconName]) || Building2}
                availability={finderSearched ? availabilityMap : null}
                onDetails={(fac) => setDetailFac(facilities.find((f) => f.id === fac.id) || null)}
                onReserve={(fac) => handleOpenReservation(fac.id)}
                onQuote={(fac) => setQuoteFor({ id: fac.id, title: fac.title, reference: null })}
                onOpen3D={(fac) => { const f = facilities.find((x) => x.id === fac.id); if (f) open3D(f); }}
                onOpenGallery={(fac, images, startAt) => setGalleryView({ title: fac.title, images, index: startAt })}
            />
        )),
        spacesForms: placements.length ? wrap(<div className="mt-12 space-y-12">
                        {placements.map((p) => (
                            <section key={p.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-white/5 md:p-10">
                                <h2 className="mb-2 font-orbitron text-2xl font-bold text-black dark:text-white">{p.title}</h2>
                                {p.description && <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{p.description}</p>}
                                {placementSent[p.id] ? (
                                    <p className="font-semibold text-emerald-600">Formunuz alındı. Referans: {placementSent[p.id]}</p>
                                ) : (
                                    <InlineFormCenterForm slug={p.slug} themeKey={p.themeKey} onSubmitted={(ref) => setPlacementSent((x) => ({ ...x, [p.id]: ref }))} />
                                )}
                            </section>
                        ))}
        </div>) : null,
    };

    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            {slots.map((slot) => {
                const node = slot.key in parts ? parts[slot.key] : slot.node;
                if (!node) return null;
                return <MaybeStudioBlock key={slot.id} enabled={studio} id={slot.id} label={slot.label}>{node}</MaybeStudioBlock>;
            })}

            {/* SPACE DETAIL */}
            {detailFac && (
                <SpaceDetailDrawer
                    fac={detailFac}
                    groupTitle={SPACE_GROUPS.find((g) => g.key === spaceGroupKey(detailFac.facilityType))?.title}
                    onClose={() => setDetailFac(null)}
                    onReserve={(times) => { const id = detailFac.id; setDetailFac(null); handleOpenReservation(id, times); }}
                    onQuote={() => { setQuoteFor({ id: detailFac.id, title: detailFac.title, reference: null }); setDetailFac(null); }}
                    onOpen3D={() => { const f = detailFac; setDetailFac(null); open3D(f); }}
                    onOpenGallery={(images, startAt) => setGalleryView({ title: detailFac.title, images, index: startAt })}
                />
            )}

            {/* MACHINE PRICE QUOTE */}
            {quoteFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={`${quoteFor.title} fiyat teklifi`} onClick={() => setQuoteFor(null)}>
                    <div className="relative my-8 w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0c0c16] sm:p-8" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => setQuoteFor(null)} className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-black dark:hover:bg-white/5 dark:hover:text-white" aria-label="Kapat"><X className="h-5 w-5" /></button>
                        <div className="mb-6">
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300"><Receipt className="h-3.5 w-3.5" /> FİYAT TEKLİFİ TALEBİ</div>
                            <h3 className="font-orbitron text-2xl font-bold text-black dark:text-white">{quoteFor.title}</h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Tahmini kullanım süresini, adedi ve iş detaylarını yazın. Talebiniz ekibimize iletilir; teklif e-posta ile gönderilir.</p>
                        </div>
                        {quoteSent ? (
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                                <p className="font-semibold text-emerald-700 dark:text-emerald-300">Teklif talebiniz alındı.</p>
                                <p className="mt-1 font-mono text-xs text-gray-500">Referans: {quoteSent}</p>
                                <button type="button" onClick={() => { setQuoteFor(null); setQuoteSent(null); }} className="mt-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-6 py-2.5 text-xs font-bold text-white">Tamam</button>
                            </div>
                        ) : (
                            <InlineFormCenterForm
                                slug={MACHINE_QUOTE_FORM_SLUG}
                                themeKey="reservation"
                                context={{ entityType: "Facility", entityId: quoteFor.id, label: quoteFor.title }}
                                initial={{ machine: quoteFor.title, ...(quoteFor.reference ? { reservationReference: quoteFor.reference } : {}) }}
                                onSubmitted={(ref) => setQuoteSent(ref)}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* PHOTO GALLERY */}
            {galleryView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={`${galleryView.title} fotoğrafları`} onClick={() => setGalleryView(null)}>
                    <button type="button" onClick={() => setGalleryView(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Kapat"><X className="h-6 w-6" /></button>
                    {galleryView.images.length > 1 && (
                        <>
                            <button type="button" className="absolute left-4 rounded-full bg-white/10 p-2 text-white" aria-label="Önceki" onClick={(e) => { e.stopPropagation(); setGalleryView({ ...galleryView, index: (galleryView.index - 1 + galleryView.images.length) % galleryView.images.length }); }}><ChevronLeft className="h-6 w-6" /></button>
                            <button type="button" className="absolute right-4 rounded-full bg-white/10 p-2 text-white" aria-label="Sonraki" onClick={(e) => { e.stopPropagation(); setGalleryView({ ...galleryView, index: (galleryView.index + 1) % galleryView.images.length }); }}><ChevronRight className="h-6 w-6" /></button>
                        </>
                    )}
                    <figure className="max-w-5xl" onClick={(e) => e.stopPropagation()}>
                        <img src={galleryView.images[galleryView.index].url} alt={galleryView.images[galleryView.index].caption || galleryView.title} className="max-h-[80vh] w-auto rounded-xl object-contain" />
                        <figcaption className="mt-3 text-center text-sm text-white/80">{galleryView.title}{galleryView.images[galleryView.index].caption && galleryView.images[galleryView.index].caption !== galleryView.title ? ` — ${galleryView.images[galleryView.index].caption}` : ''} · {galleryView.index + 1}/{galleryView.images.length}</figcaption>
                    </figure>
                </div>
            )}

            {/* 3D / 360 VIEWER */}
            {viewerFacility && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto" role="dialog" aria-modal="true" aria-label={`${viewerFacility.title} 3D görünümü`} onClick={() => setViewerFacility(null)}>
                    <div className="relative w-full max-w-5xl bg-white dark:bg-[#0c0c16] border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-mono text-primary font-bold mb-1"><Boxes className="w-4 h-4" /><span>3D / 360° GÖRÜNÜM</span></div>
                                <h3 className="text-xl font-bold font-orbitron text-black dark:text-white">{viewerFacility.title}</h3>
                            </div>
                            <button onClick={() => setViewerFacility(null)} className="p-2 rounded-full text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Kapat"><X className="w-5 h-5" /></button>
                        </div>
                        {viewerError ? (
                            <div className="p-6 rounded-2xl bg-gray-100 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300 text-center">{viewerError}</div>
                        ) : viewerExperience ? (
                            <FacilityViewer experience={viewerExperience} title={viewerFacility.title} />
                        ) : (
                            <div className="h-[60vh] min-h-[320px] rounded-2xl bg-[#0b0b14] flex items-center justify-center text-sm text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" />Yükleniyor...</div>
                        )}
                        {/* Facility facts are always available as text (3D is not the only source of information) */}
                        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                <p className="mb-2">{viewerFacility.description}</p>
                                {viewerExperience?.description && <p className="text-xs text-gray-500 dark:text-gray-400">{viewerExperience.description}</p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => { const id = viewerFacility.id; setViewerFacility(null); setSelectedSpaceId(id); handleOpenReservation(id); }} className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-white/10"><Search className="w-3.5 h-3.5 text-cyan-500" />Müsaitliği Kontrol Et</button>
                                <button onClick={() => { const id = viewerFacility.id; setViewerFacility(null); handleOpenReservation(id); }} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-bold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Rezervasyon Talebi Oluştur</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Section 571, 572, 573: REZERVASYON MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-[#0c0c16] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl my-8"
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Section 586: Net Sonuç Ekranı */}
                            {submittedResult ? (
                                <div className="text-center py-6 space-y-6">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-bold font-orbitron text-black dark:text-white mb-2">
                                            Rezervasyon Talebiniz Alındı
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                            {submittedResult.message}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-2xl p-5 text-left max-w-md mx-auto space-y-2 text-xs font-mono">
                                        <div className="flex justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                                            <span className="text-gray-500">Rezervasyon No:</span>
                                            <strong className="text-primary text-sm">{submittedResult.reference}</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Seçilen Alan:</span>
                                            <strong className="text-black dark:text-white">{submittedResult.spaceName}</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tarih &amp; Saat:</span>
                                            <strong className="text-black dark:text-white">{submittedResult.date} • {submittedResult.time}</strong>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span className="text-gray-500">Durum:</span>
                                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30">
                                                {submittedResult.status}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        Belirttiğiniz e-posta adresi üzerinden takip bilgisi iletilmiştir.
                                    </p>

                                    {selectedFacility && isMachineFacility(selectedFacility) && (
                                        <div className="mx-auto max-w-md rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-left">
                                            <p className="mb-3 text-xs text-amber-800 dark:text-amber-200">Bu makinenin kullanımı ücretlidir. Ne kadar kullanacağınızı ve iş detaylarınızı paylaşın, size fiyat teklifi gönderelim.</p>
                                            <button type="button" onClick={() => { setQuoteFor({ id: selectedFacility.id, title: selectedFacility.title, reference: submittedResult.reference }); setIsModalOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-400">
                                                <Receipt className="h-4 w-4" /> Fiyat Teklifi Talep Et
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-all cursor-pointer"
                                    >
                                        Tamam
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {/* Modal Title */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 text-xs font-mono text-primary font-bold mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>TALEP FORMU</span>
                                        </div>
                                        <h3 className="text-2xl font-bold font-orbitron text-black dark:text-white">
                                            Ortak Alan Rezervasyon Talebi
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Seçtiğiniz alan için talebinizi iletin, onay sonrasında bildirim e-postası alacaksınız.
                                        </p>
                                    </div>

                                    {submitError && (
                                        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            <span>{submitError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmitReservation} className="space-y-4">
                                        <HoneypotField value={requester.honeypot} onChange={requester.setHoneypot} />

                                        {/* Area Selector (Section 572: Auto-selected) */}
                                        <div>
                                            <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Kullanmak İstediğiniz Alan *
                                            </label>
                                            <select
                                                required
                                                value={selectedSpaceId}
                                                onChange={(e) => setSelectedSpaceId(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white focus:border-primary outline-none [&>option]:bg-white dark:[&>option]:bg-[#0c0c16]"
                                            >
                                                {facilities.map((fac) => (
                                                    <option key={fac.id} value={fac.id}>
                                                        {fac.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Date & Time selection */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                            <div>
                                                <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    Tarih *
                                                </label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.date}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                                    className="w-full bg-gray-50 dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-black dark:text-white focus:border-primary outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    Başlangıç *
                                                </label>
                                                <input
                                                    type="time"
                                                    required
                                                    value={formData.startTime}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                                    className="w-full bg-gray-50 dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-black dark:text-white focus:border-primary outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    Bitiş *
                                                </label>
                                                <input
                                                    type="time"
                                                    required
                                                    value={formData.endTime}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                                    className="w-full bg-gray-50 dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-black dark:text-white focus:border-primary outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Participant count & Purpose */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    Kaç Kişi Kullanacaksınız? *
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={100}
                                                    required
                                                    value={formData.participantCount}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, participantCount: Number(e.target.value) }))}
                                                    className="w-full bg-gray-50 dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white focus:border-primary outline-none"
                                                />
                                            </div>

                                        </div>

                                        {/* Section 573, 574, 575: LIVE AVAILABILITY FEEDBACK */}
                                        {checkingAvailability ? (
                                            <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 text-xs font-mono text-gray-500 flex items-center gap-2">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                                <span>Müsaitlik kontrol ediliyor...</span>
                                            </div>
                                        ) : slotStatus ? (
                                            <div className={`p-3 rounded-xl text-xs font-mono border ${
                                                slotStatus.isAvailable
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                            }`}>
                                                <p className="font-semibold">{slotStatus.message}</p>

                                                {/* Section 575: Capacity warning */}
                                                {slotStatus.capacityWarning && (
                                                    <p className="text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span>{slotStatus.capacityWarning}</span>
                                                    </p>
                                                )}

                                                {/* Section 574: Suggest alternatives if full */}
                                                {!slotStatus.isAvailable && slotStatus.alternativeSlots && slotStatus.alternativeSlots.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-rose-500/20">
                                                        <span className="font-bold text-gray-700 dark:text-gray-300">Aynı Gün İçin Müsait Saat Önerileri:</span>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {slotStatus.alternativeSlots.map((slot, si) => (
                                                                <button
                                                                    type="button"
                                                                    key={si}
                                                                    onClick={() => {
                                                                        const [s, e] = slot.split(' — ');
                                                                        setFormData(prev => ({ ...prev, startTime: s.trim(), endTime: e.trim() }));
                                                                    }}
                                                                    className="px-2 py-0.5 rounded bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 text-[11px] font-bold text-primary hover:border-primary transition-colors cursor-pointer"
                                                                >
                                                                    {slot}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {slotStatus.suggestedAlternativeSpace && (
                                                    <p className="text-cyan-600 dark:text-cyan-400 mt-1 flex items-center gap-1">
                                                        <Info className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span>{slotStatus.suggestedAlternativeSpace}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ) : null}

                                        {/* Requester details, purpose, notes and KVKK (Form Center) */}
                                        {requester.loading ? (
                                            <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 text-xs font-mono text-gray-500 flex items-center gap-2">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                                <span>Form yükleniyor...</span>
                                            </div>
                                        ) : requester.definition ? (
                                            <DynamicFormFields
                                                fields={requester.definition.fields}
                                                theme={requesterTheme}
                                                values={requester.values}
                                                errors={requester.errors}
                                                onChange={requester.setValue}
                                                kvkkTexts={requester.definition.kvkkTexts}
                                                uploadSlug={RESERVATION_FORM_SLUG}
                                            />
                                        ) : (
                                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
                                                {requester.loadError || 'Talep formu şu anda yüklenemiyor.'}
                                            </div>
                                        )}

                                        {/* Submit button */}
                                        <div className="pt-4 flex items-center justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                            >
                                                İptal
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={submitting || !requester.definition}
                                                className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/25 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Gönderiliyor...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>Rezervasyon Talebini Gönder</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

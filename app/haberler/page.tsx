"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Calendar, ArrowRight, Tag, ChevronRight, Sparkles, X } from "lucide-react";

const news = [
    {
        id: 1,
        title: "ANTSPARK MasterClass'ta Girişimcilik Ekosistemi Masaya Yatırıldı",
        excerpt: "İKÜANTS TEKMER tarafından 15 Aralık Pazartesi günü düzenlenen ANTSPARK MasterClass, girişimcilik ve inovasyon ekosisteminin önemli paydaşlarını bir araya getirdi.",
        fullContent: `İKÜANTS TEKMER tarafından 15 Aralık Pazartesi günü düzenlenen "ANTSPARK MasterClass", girişimcilik ve inovasyon ekosisteminin önemli paydaşlarını bir araya getirdi.

Program; girişimciler, öğrenciler, akademisyenler ve ekosistem paydaşlarının bir araya gelerek fikir alışverişinde bulunduğu networking oturumu ile başladı. Bu bölümde katılımcılar yeni iş birlikleri geliştirme, deneyim paylaşma ve ANTSPARK çatısı altında yürütülen çalışmalar hakkında doğrudan bilgi alma fırsatı buldu.

Programın açılışı, Rektör Yardımcımız & İKÜANTS TEKMER Yönetim Kurulu Başkan Vekili Prof. Dr. Gülce Öğrüç Ildız tarafından gerçekleştirildi. Açılış konuşmasında üniversite temelli girişimcilik ekosistemlerinin önemi, yenilikçi fikirlerin ticarileşme süreçleri ve genç girişimcilere sunulan destek mekanizmalarına değinildi.

Açılışın ardından, girişimcilik ekosisteminin duayen isimlerinden Ufuk Batum "Ekosistem ve Kahramanları" başlıklı "MasterClass" oturumuyla katılımcılarla buluştu. Oturumda; girişimcilik yolculuğunun dinamikleri, ekosistem aktörlerinin rolleri, sürdürülebilir başarı için kritik eşikler ve deneyim temelli içgörüler paylaşıldı.

Katılımcılar, hem ilham verici örnekler hem de pratik bakış açılarıyla zengin bir içerik deneyimi yaşadı.

ANTSPARK MasterClass, üniversite odaklı girişimcilik ekosisteminin güçlenmesine katkı sunan, bilgi paylaşımı ve etkileşimi odağına alan nitelikli bir buluşma olarak başarıyla tamamlandı.

İKÜANTS TEKMER olarak girişimcilik ekosisteminin geliştirilmesi ve güçlendirilmesi için bu tür etkinlikler düzenlemeye devam edeceğiz.`,
        date: "15 Aralık 2025",
        category: "Etkinlik",
        image: "/images/news/antspark-masterclass/05.jpg",
        gallery: [
            "/images/news/antspark-masterclass/01.jpg",
            "/images/news/antspark-masterclass/02.jpg",
            "/images/news/antspark-masterclass/03.jpg",
            "/images/news/antspark-masterclass/04.jpg",
            "/images/news/antspark-masterclass/05.jpg"
        ],
        featured: true
    },
    {
        id: 2,
        title: "ANTSPARK Ön Kuluçka Programı'nda Yoğun Bir Eğitim Haftası Geride Kaldı!",
        excerpt: "İKÜANTS TEKMER'in yürüttüğü ANTSPARK Ön Kuluçka Programı, girişimcilerin fikir aşamasından ticarileşmeye uzanan yolculuklarında ihtiyaç duydukları yetkinlikleri kazandırmaya devam ediyor.",
        fullContent: `İKÜANTS TEKMER'in yürüttüğü ANTSPARK Ön Kuluçka Programı, girişimcilerin fikir aşamasından ticarileşmeye uzanan yolculuklarında ihtiyaç duydukları yetkinlikleri kazandırmaya devam ediyor.

Bu hafta gerçekleştirilen eğitimler:

• 08 Aralık 2025'te "Girişimciler İçin Hukuki Çerçeve" eğitimi; Dr. Öğr. Üyesi Muharrem Tütüncü, Dr. Öğr. Üyesi Ender Demir ve Hukuk Müşavirimiz Av. İmren Öner Topaloğlu tarafından verildi.

• 09 Aralık 2025'te "Dijital Pazarlamaya Giriş" başlıklı eğitim, marketing alanında uzman Haydar Özkömürcü tarafından başarıyla gerçekleştirildi.

• 10 Aralık 2025'te tüm girişimcilerimiz birer saatlik birebir mentörlük aldılar.

• 11 Aralık 2025'te ise "Girişimcilikte Psikolojik Dayanıklılık: Esneklik Geliştirme Atölyesi-3", örgütsel psikoloji alanında uzman İlker Çitli tarafından başarıyla gerçekleştirildi.

Programın beşinci haftasında girişimcileri yine dopdolu bir takvim bekliyor:

• 15 Aralık 2025 & 13.00-18.00 "MasterClass ve Fikri Mülkiyet Oturumu"
• 16 Aralık 2025 & 15.00-18.00 "Fikir Değerlendirme Teknikleri" – Ufuk Batum (Mentör ve Yatırımcılar Ligi Kurucusu)
• 18 Aralık 2025 & 15.00-18.00 "Fikirden Ürüne Giden Yol: Startup'ta İlk 90 Gün" – Çağrı Temel (Hezarfen LLC Kurucu Ortağı)

İKÜANTS TEKMER; girişimcilere yalnızca teknik bilgiler kazandırmayı değil, aynı zamanda zihinsel dayanıklılık, pazar odaklı yaklaşım ve iş modeli geliştirme becerileri gibi güçlü bir girişim yolculuğu için gerekli tüm yetkinlikleri sunmayı amaçlıyor.

ANTSPARK Ön Kuluçka Programı, önümüzdeki haftalarda da kapsamlı eğitim ve mentorluklarla girişimcilere destek olmayı sürdürecek.

İKÜANTS TEKMER'i sosyal medya hesaplarından (@ikuantstekmer) takip ederek program hakkında duyurulara erişebilirsiniz.`,
        date: "8 Aralık 2025",
        category: "Program",
        image: "/images/news/antspark-egitim-haftasi/04.jpg",
        gallery: [
            "/images/news/antspark-egitim-haftasi/01.jpg",
            "/images/news/antspark-egitim-haftasi/02.jpg",
            "/images/news/antspark-egitim-haftasi/03.jpg",
            "/images/news/antspark-egitim-haftasi/04.jpg"
        ],
        featured: false
    },
    {
        id: 3,
        title: "ANTSPARK Ön Kuluçka Programı'nda Verimli Bir Eğitim Haftası Geride Kaldı!",
        excerpt: "İKÜANTS TEKMER'in yürüttüğü ANTSPARK Ön Kuluçka Programı, girişimcilerin fikir aşamasından ticarileşme sürecine kadar olan yolculuklarında verimli bir hafta daha geçirdi.",
        fullContent: `İKÜANTS TEKMER'in yürüttüğü ANTSPARK Ön Kuluçka Programı, girişimcilerin fikir aşamasından ticarileşme sürecine kadar olan yolculuklarında verimli bir hafta daha geçirdi.

Program kapsamında girişimcilerimize iş geliştirme, pazarlama stratejileri ve finansal planlama konularında kapsamlı eğitimler verildi.

Bu hafta ele alınan konular:

• İş Modeli Geliştirme: Girişimciler, iş modellerini nasıl oluşturacakları ve optimize edecekleri konusunda detaylı bilgi edindi.

• Pazar Araştırması: Hedef kitle analizi ve pazar araştırması teknikleri üzerine uygulamalı çalışmalar yapıldı.

• Finansal Planlama: Bütçeleme, nakit akışı yönetimi ve yatırımcı sunumu hazırlama konuları işlendi.

• Mentörlük Seansları: Her girişimci, alanında uzman mentörlerle birebir görüşme fırsatı buldu.

İKÜANTS TEKMER olarak girişimcilerimizin başarılı bir şekilde ticarileşme süreçlerini tamamlamalarını desteklemeye devam ediyoruz.

ANTSPARK Ön Kuluçka Programı, girişimcilerin ihtiyaç duyduğu tüm yetkinlikleri kazandırmak için tasarlanmış kapsamlı bir programdır.

Sosyal medya hesaplarımızdan (@ikuantstekmer) bizi takip ederek güncel gelişmelerden haberdar olabilirsiniz.`,
        date: "1 Aralık 2025",
        category: "Program",
        image: "/images/news/antspark-verimli-hafta/01.jpg",
        gallery: [
            "/images/news/antspark-verimli-hafta/01.jpg",
            "/images/news/antspark-verimli-hafta/02.jpg",
            "/images/news/antspark-verimli-hafta/03.jpg"
        ],
        featured: false
    },
    {
        id: 4,
        title: "İKÜANTS TEKMER, ÜSİMP Organizasyonunda Yer Aldı",
        excerpt: "İKÜANTS TEKMER; ÜSİMP tarafından ODTÜ'de gerçekleştirilen Kongre – Sempozyum – Fuar organizasyonunda yer aldı. Etkinlikte uzmanımız Alperen Tağman'a 'RTTP' rozeti resmi olarak takdim edildi.",
        fullContent: `İKÜANTS Teknoloji Geliştirme Merkezi (TEKMER); Türkiye'nin üniversite–sanayi iş birliğinde en yetkin platformlarından olan Üniversite Sanayi İşbirliği Merkezleri Platformu (ÜSİMP) tarafından Orta Doğu Teknik Üniversitesi'nde (ODTÜ) gerçekleştirilen Kongre – Sempozyum – Fuar organizasyonunda yer aldı.

Türkiye'de teknoloji transferi, Ar-Ge kapasitesi, girişimcilik destek mekanizmaları ve üniversite–sanayi etkileşimlerinin ele alındığı bu geniş kapsamlı etkinlikte üniversitemizi temsil eden İKÜANTS TEKMER Uzmanı Alperen Tağman, ilgili paydaşlarla etkin iletişim kurdu ve ekosistemle alakalı bilgi alışverişinde bulundu.

Etkinlik süresince Tağman'a "Registered Technology Transfer Professional (RTTP)" rozeti resmi olarak takdim edildi. Bu unvan, uluslararası teknoloji transfer profesyonelliği standartlarını karşılayan kişiler için verilen prestijli bir rozet olup, merkezimizin uzmanlık kapasitesini ve profesyonel yetkinliğini bir kez daha tescilledi.

Kongre kapsamında gerçekleştirilen faaliyetler:

• ÜSİMP tarafından düzenlenen Teknoloji Transfer Ofisi ve TEKMER yöneticileri toplantısına katılım sağlandı.

• Üniversite–sanayi iş birliği modelleri, fikri mülkiyet süreçleri, teknoloji transfer süreçleri ve girişimcilik destek programları üzerine değerlendirmelerde bulunuldu.

• Fuar alanında gerçekleştirilen ziyaretler kapsamında çok yönlü networking faaliyetleri yürütüldü ve yeni iş birliği fırsatları değerlendirildi.

• Program kapsamında düzenlenen konferans ve sempozyum oturumlarına iştirak edilerek güncel gelişmeler ve politikalar takip edildi.

İKÜANTS TEKMER; Türkiye'nin girişimcilik ve teknoloji geliştirme ekosistemine katkı sunmak amacıyla, üniversite–sanayi iş birliği ve girişimcilik süreçlerinde aktif rol almaya ve ulusal platformlarda görünürlüğünü artırmaya devam etmektedir.`,
        date: "27-28 Kasım 2025",
        category: "Duyuru",
        image: "/images/news/usimp-organizasyon/03.jpg",
        gallery: [
            "/images/news/usimp-organizasyon/01.jpg",
            "/images/news/usimp-organizasyon/02.jpg",
            "/images/news/usimp-organizasyon/03.jpg",
            "/images/news/usimp-organizasyon/04.jpg",
            "/images/news/usimp-organizasyon/05.jpg"
        ],
        featured: true
    },
    {
        id: 5,
        title: "İKÜANTS TEKMER, E-Ticaret Haftası Etkinliğine Katıldı",
        excerpt: "İstanbul Kültür Üniversitesi İKÜANTS TEKMER, 21–22 Kasım 2025 tarihlerinde İstanbul Lütfi Kırdar Kongre Merkezi'nde gerçekleştirilen 'E-Ticaret Haftası' etkinliğine katıldı.",
        fullContent: `İstanbul Kültür Üniversitesi İKÜANTS TEKMER, 21–22 Kasım 2025 tarihlerinde İstanbul Lütfi Kırdar Kongre Merkezi'nde gerçekleştirilen "E-Ticaret Haftası" etkinliğine katıldı.

E-ticaret ekosisteminin öncü temsilcilerini, girişimleri ve teknoloji odaklı çözüm sağlayıcılarını buluşturan etkinlikte merkezimiz önemli görüşmeler gerçekleştirdi.

Etkinlikte ele alınan konular:

• İKÜANTS TEKMER'in girişimcilere sunduğu destekler hakkında bilgi verildi.

• Ar-Ge ve inovasyon altyapımız tanıtıldı.

• Teknoloji geliştirme ve ticarileştirme süreçlerimiz hakkında katılımcılara detaylı bilgi aktarıldı.

• E-ticaret alanında faaliyet gösteren girişimcilerle networking fırsatları değerlendirildi.

• Dijital dönüşüm ve e-ticaret trendleri üzerine panel ve sunumlara katılım sağlandı.

E-Ticaret Haftası, Türkiye'nin en büyük e-ticaret etkinliklerinden biri olup, sektörün önde gelen isimlerini bir araya getirmektedir.

İKÜANTS TEKMER olarak dijital girişimcilik alanındaki gelişmeleri yakından takip etmeye ve girişimcilerimize bu alanda destek sunmaya devam ediyoruz.

Etkinlik hakkında daha fazla bilgi için sosyal medya hesaplarımızı takip edebilirsiniz.`,
        date: "22 Kasım 2025",
        category: "Etkinlik",
        image: "/images/news/eticaret-haftasi/02.jpg",
        gallery: [
            "/images/news/eticaret-haftasi/01.jpg",
            "/images/news/eticaret-haftasi/02.jpg"
        ],
        featured: false
    }
];

const categories = ["Tümü", "Etkinlik", "Program", "Duyuru"];

interface NewsItem {
    id: number;
    title: string;
    excerpt: string;
    fullContent: string;
    date: string;
    category: string;
    image: string;
    featured: boolean;
    gallery?: string[];
}

export default function HaberlerPage() {
    const [selectedCategory, setSelectedCategory] = useState("Tümü");
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const [showRsvpForm, setShowRsvpForm] = useState(false);
    const [rsvpData, setRsvpData] = useState({ name: "", email: "", phone: "" });
    const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

    const filteredNews = selectedCategory === "Tümü"
        ? news
        : news.filter(item => item.category === selectedCategory);

    const featuredNews = news.find(n => n.featured);
    const regularNews = filteredNews.filter(n => n.id !== featuredNews?.id || selectedCategory !== "Tümü");

    const closeModal = () => {
        setSelectedNews(null);
        setShowRsvpForm(false);
        setRsvpSubmitted(false);
        setRsvpData({ name: "", email: "", phone: "" });
    };

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Keyboard navigation for image gallery
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedImage || !selectedNews?.gallery) return;

            if (e.key === "ArrowLeft") {
                const currentIndex = selectedNews.gallery.indexOf(selectedImage);
                const prevIndex = currentIndex === 0 ? selectedNews.gallery.length - 1 : currentIndex - 1;
                setSelectedImage(selectedNews.gallery[prevIndex]);
            } else if (e.key === "ArrowRight") {
                const currentIndex = selectedNews.gallery.indexOf(selectedImage);
                const nextIndex = currentIndex === selectedNews.gallery.length - 1 ? 0 : currentIndex + 1;
                setSelectedImage(selectedNews.gallery[nextIndex]);
            } else if (e.key === "Escape") {
                setSelectedImage(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedImage, selectedNews]);

    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Newspaper className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">GÜNCEL</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mb-4">
                        Haber & Duyurular
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        İKÜANTS TEKMER'den en güncel haberler, etkinlikler ve duyurular
                    </p>
                </motion.div>

                {/* Category Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap justify-center gap-3 mb-12"
                >
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${selectedCategory === category
                                ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30'
                                : 'bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/10 hover:text-black dark:hover:text-white border border-gray-300 dark:border-white/10'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </motion.div>

                {/* Featured News (Hero Card) */}
                {selectedCategory === "Tümü" && featuredNews && (
                    <motion.div
                        onClick={() => setSelectedNews(featuredNews)}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="group block mb-12 cursor-pointer"
                    >
                        <div className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-all shadow-lg dark:shadow-none bg-white dark:bg-white/5">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                {/* Image */}
                                <div className="relative h-64 lg:h-96 overflow-hidden">
                                    <img
                                        src={featuredNews.image}
                                        alt={featuredNews.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent lg:bg-gradient-to-t lg:from-black/60 lg:to-transparent" />
                                    <div className="absolute top-4 left-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold">
                                            <Sparkles className="w-3 h-3" />
                                            ÖNE ÇIKAN
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 lg:p-12 flex flex-col justify-center">
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
                                            <Tag className="w-3 h-3" />
                                            {featuredNews.category}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            {featuredNews.date}
                                        </span>
                                    </div>
                                    <h2 className="font-orbitron text-2xl lg:text-3xl text-black dark:text-white font-bold mb-4 group-hover:text-primary transition-colors leading-tight">
                                        {featuredNews.title}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                                        {featuredNews.excerpt}
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
                                        Devamını Oku
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* News Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {regularNews.map((item, index) => (
                        <motion.div
                            key={item.id}
                            onClick={() => setSelectedNews(item)}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.1 }}
                            className="group cursor-pointer"
                        >
                            <div className="relative h-full rounded-2xl overflow-hidden bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-all hover:shadow-xl dark:hover:shadow-xl hover:shadow-primary/10 shadow-md dark:shadow-none">
                                {/* Image */}
                                <div className="relative h-52 overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                                    <div className="absolute top-4 right-4">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${item.category === 'Etkinlik' ? 'bg-purple-500/80 text-white' :
                                            item.category === 'Program' ? 'bg-cyan-500/80 text-white' :
                                                'bg-orange-500/80 text-white'
                                            }`}>
                                            {item.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                                        <Calendar className="w-4 h-4" />
                                        {item.date}
                                    </div>
                                    <h3 className="text-lg font-semibold text-black dark:text-white mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                        {item.excerpt}
                                    </p>
                                    <div className="inline-flex items-center gap-1.5 text-primary text-sm font-medium group-hover:gap-3 transition-all">
                                        Oku
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredNews.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">Bu kategoride henüz haber bulunmuyor.</p>
                    </motion.div>
                )}

                {/* Subscribe CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 p-8 md:p-12 rounded-3xl bg-gradient-to-r from-primary/20 via-purple-600/10 to-secondary/20 border border-gray-200 dark:border-white/10 text-center shadow-lg"
                >
                    <h3 className="font-orbitron text-2xl text-black dark:text-white mb-3">
                        Güncel Haberlerden Haberdar Olun
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
                        İKÜANTS TEKMER'in etkinlikleri, programları ve fırsatları hakkında bilgi almak için bizi takip edin.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="https://chat.whatsapp.com/LAg3l2cUSFOHBn0miCO9lz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-[#25D366] text-white rounded-lg font-semibold hover:opacity-90 transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            WhatsApp Kanalına Katıl
                        </a>
                        <a
                            href="https://www.instagram.com/ikuantstekmer/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                        >
                            Instagram'da Takip Et
                        </a>
                        <a
                            href="https://www.linkedin.com/company/ikuants-tekmer/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                        >
                            LinkedIn'de Takip Et
                        </a>
                    </div>
                </motion.div>
            </div>

            {/* News Detail Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl max-w-4xl w-full h-[95vh] md:h-[90vh] flex flex-col shadow-2xl dark:shadow-none"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Image */}
                            <div className="relative h-48 md:h-56 flex-shrink-0">
                                <img
                                    src={selectedNews.image}
                                    alt={selectedNews.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent" />
                                <button
                                    onClick={closeModal}
                                    className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </button>
                                <div className="absolute bottom-4 left-6">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${selectedNews.category === 'Etkinlik' ? 'bg-purple-500 text-white' :
                                        selectedNews.category === 'Program' ? 'bg-cyan-500 text-white' :
                                            'bg-orange-500 text-white'
                                        }`}>
                                        {selectedNews.category}
                                    </span>
                                </div>
                            </div>

                            {/* Modal Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                    <Calendar className="w-4 h-4" />
                                    {selectedNews.date}
                                </div>
                                <h2 className="font-orbitron text-2xl md:text-3xl text-black dark:text-white font-bold mb-6">
                                    {selectedNews.title}
                                </h2>
                                <div className="text-black/80 dark:text-gray-300 leading-loose whitespace-pre-line text-base md:text-lg mb-8">
                                    {selectedNews.fullContent}
                                </div>

                                {/* Gallery Section */}
                                {selectedNews.gallery && selectedNews.gallery.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="font-orbitron text-xl text-black dark:text-white mb-4">Etkinlik Galerisi</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedNews.gallery.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative aspect-video rounded-xl overflow-hidden group border border-gray-200 dark:border-white/10 cursor-pointer"
                                                    onClick={() => setSelectedImage(img)}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`${selectedNews.title} - Görsel ${idx + 1}`}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-full">
                                                            🔍
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* RSVP Section for Etkinlik */}
                                {selectedNews.category === 'Etkinlik' && (
                                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
                                        {!showRsvpForm && !rsvpSubmitted && (
                                            <div className="text-center">
                                                <p className="text-black/70 dark:text-gray-400 mb-4">Bu etkinliğe katılmak ister misiniz?</p>
                                                <button
                                                    onClick={() => setShowRsvpForm(true)}
                                                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-purple-500/30"
                                                >
                                                    🎉 Sen de Katıl!
                                                </button>
                                            </div>
                                        )}

                                        {showRsvpForm && !rsvpSubmitted && (
                                            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 border border-gray-200 dark:border-white/10">
                                                <h3 className="font-orbitron text-xl text-black dark:text-white mb-4">Etkinlik Kaydı</h3>
                                                <p className="text-black/70 dark:text-gray-400 text-sm mb-6">Bilgilerinizi girerek etkinliğe katılım kaydınızı oluşturun.</p>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm text-black/70 dark:text-gray-400 mb-2">Ad Soyad *</label>
                                                        <input
                                                            type="text"
                                                            value={rsvpData.name}
                                                            onChange={(e) => setRsvpData({ ...rsvpData, name: e.target.value })}
                                                            className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg text-black dark:text-white focus:border-primary focus:outline-none"
                                                            placeholder="Adınız ve soyadınız"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-black/70 dark:text-gray-400 mb-2">E-posta *</label>
                                                        <input
                                                            type="email"
                                                            value={rsvpData.email}
                                                            onChange={(e) => setRsvpData({ ...rsvpData, email: e.target.value })}
                                                            className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg text-black dark:text-white focus:border-primary focus:outline-none"
                                                            placeholder="ornek@email.com"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-black/70 dark:text-gray-400 mb-2">Telefon *</label>
                                                        <input
                                                            type="tel"
                                                            value={rsvpData.phone}
                                                            onChange={(e) => setRsvpData({ ...rsvpData, phone: e.target.value })}
                                                            className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg text-black dark:text-white focus:border-primary focus:outline-none"
                                                            placeholder="0555 123 4567"
                                                        />
                                                    </div>
                                                    <div className="flex gap-3 pt-4">
                                                        <button
                                                            onClick={() => setShowRsvpForm(false)}
                                                            className="px-6 py-3 bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-all"
                                                        >
                                                            İptal
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (rsvpData.name && rsvpData.email && rsvpData.phone) {
                                                                    console.log('RSVP submitted:', { event: selectedNews.title, ...rsvpData });
                                                                    setRsvpSubmitted(true);
                                                                    setShowRsvpForm(false);
                                                                }
                                                            }}
                                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                                                        >
                                                            Kaydımı Oluştur
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {rsvpSubmitted && (
                                            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <span className="text-3xl">✅</span>
                                                </div>
                                                <h3 className="font-orbitron text-xl text-green-400 mb-2">Kaydınız Alındı!</h3>
                                                <p className="text-gray-400">Etkinlik hakkında detaylı bilgi e-posta adresinize gönderilecektir.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Screen Image Modal */}
            <AnimatePresence>
                {selectedImage && selectedNews?.gallery && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                        >
                            <X className="w-8 h-8" />
                        </motion.button>

                        {/* Navigation Buttons */}
                        {selectedNews.gallery.length > 1 && (
                            <>
                                <button
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = selectedNews.gallery!.indexOf(selectedImage);
                                        const prevIndex = currentIndex === 0 ? selectedNews.gallery!.length - 1 : currentIndex - 1;
                                        setSelectedImage(selectedNews.gallery![prevIndex]);
                                    }}
                                >
                                    <ChevronRight className="w-8 h-8 rotate-180" />
                                </button>
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = selectedNews.gallery!.indexOf(selectedImage);
                                        const nextIndex = currentIndex === selectedNews.gallery!.length - 1 ? 0 : currentIndex + 1;
                                        setSelectedImage(selectedNews.gallery![nextIndex]);
                                    }}
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        {/* Image */}
                        <motion.img
                            key={selectedImage} // Key helps Framer Motion detect changes for animation
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            src={selectedImage}
                            alt="Full screen view"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

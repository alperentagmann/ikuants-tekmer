"use client";
import React from "react";
import { motion } from "framer-motion";
import { FileCheck, DollarSign, Shield, Globe, GraduationCap, Building2, ArrowRight } from "lucide-react";

const supports = [
    {
        id: "01",
        title: "AR-GE VE TASARIM İNDİRİMİ",
        description: "5746 sayılı Kanun kapsamında, Teknoloji Geliştirme Bölgelerinde (TGB) ve TEKMER'lerde yürütülen Ar-Ge, yenilik ve tasarım projeleri kapsamında yapılan harcamaların tamamı (%100'ü), Kurumlar Vergisi matrahının tespitinde indirim konusu yapılır. Bu, firmanızın vergi yükünü doğrudan azaltarak elde ettiğiniz karı tekrar Ar-Ge'ye yatırmanıza olanak tanır.",
        example: "Örneğin; firmanızın yıl içinde 500.000 TL tutarında onaylı bir Ar-Ge harcaması yaptığını varsayalım. Yıl sonunda 1.000.000 TL kar elde ettiğinizde, vergi matrahınız 1.000.000 TL değil, Ar-Ge indirimi düşüldükten sonra 500.000 TL olarak hesaplanır. Bu sayede ödeyeceğiniz Kurumlar Vergisi yarı yarıya düşer.",
        icon: FileCheck,
        color: "from-blue-500 to-cyan-500"
    },
    {
        id: "02",
        title: "GELİR VERGİSİ STOPAJI TEŞVİKİ",
        description: "Bölgede çalışan Ar-Ge, tasarım ve destek personelinin bu görevleri ile ilgili ücretleri üzerinden hesaplanan gelir vergisinin; doktoralı olanlar için %95'i, yüksek lisanslı olanlar için %90'ı ve diğerleri için %80'i vergiden müstesnadır. Bu teşvik, nitelikli personel istihdamını işveren için çok daha az maliyetli hale getirir.",
        example: "Örneğin; brüt maaşı 30.000 TL olan bir yazılım mühendisi istihdam ettiğinizi düşünelim. Normal şartlarda devlete ödenmesi gereken gelir vergisi stopajının %80 ile %95'i (eğitim durumuna göre) devlet tarafından terkin edilir yani alınmaz. Bu durum işverenin personel maliyetini aylık bazda binlerce lira düşürür.",
        icon: DollarSign,
        color: "from-green-500 to-emerald-500"
    },
    {
        id: "03",
        title: "SİGORTA PRİMİ DESTEĞİ",
        description: "Kanun kapsamında çalışan Ar-Ge, tasarım ve destek personeli için hesaplanan sigorta primi işveren hissesinin %50'si, Hazine ve Maliye Bakanlığı tarafından karşılanır. Bu destek 5 yıl süreyle (bazı durumlarda projenin süresine bağlı olarak) uygulanır.",
        example: "Örneğin; Ar-Ge personeliniz için ödemeniz gereken aylık SGK işveren payı 5.000 TL ise, bunun 2.500 TL'si devlet tarafından karşılanır. 10 kişilik bir Ar-Ge ekibinde bu destek yıllık bazda çok ciddi bir tasarruf sağlar.",
        icon: Shield,
        color: "from-purple-500 to-pink-500"
    },
    {
        id: "04",
        title: "DAMGA VERGİSİ İSTİSNASI",
        description: "Ar-Ge ve yenilik faaliyetleri ile ilgili olarak düzenlenen her türlü kağıt (sözleşme, taahhütname, ihale kararları vb.) ve yapılan işlemler damga vergisinden muaftır. Özellikle yüksek tutarlı sözleşmelerde ve personel maaş bordrolarında damga vergisi maliyeti oluşmaz.",
        example: "Örneğin; projeniz kapsamında 1.000.000 TL değerinde bir danışmanlık veya hizmet alım sözleşmesi imzaladığınızda, normalde ödemeniz gereken (binde 9,48 oranında) yaklaşık 9.480 TL tutarındaki damga vergisini ödemezsiniz.",
        icon: FileCheck,
        color: "from-red-500 to-orange-500"
    },
    {
        id: "05",
        title: "GÜMRÜK VERGİSİ İSTİSNASI",
        description: "Ar-Ge, yenilik ve tasarım projeleri kapsamında kullanmak üzere yurt dışından ithal edeceğiniz eşya, makine, teçhizat ve yazılımlar; gümrük vergisinden, her türlü fondan ve bu işlemler için düzenlenen kağıtlar damga vergisinden istisnadır.",
        example: "Örneğin; projenizdeki bir prototip geliştirme aşaması için yurt dışından 20.000 Euro değerinde özel bir test cihazı getirmeniz gerekiyor. Bu istisna sayesinde cihazı gümrük vergisi ödemeden, sadece KDV (bazı durumlarda KDV istisnası da olabilir) ile ithal edebilirsiniz.",
        icon: Globe,
        color: "from-indigo-500 to-blue-600"
    },
    {
        id: "06",
        title: "TEMEL BİLİMLER DESTEĞİ",
        description: "En az lisans derecesine sahip Temel Bilimler (Matematik, Fizik, Kimya, Biyoloji) mezunu Ar-Ge personeli istihdam eden firmalara, bu personelin her biri için aylık brüt asgari ücret tutarı kadar maaş desteği sağlanır. Bu destek iki yıl süreyle Bakanlık bütçesinden hibe olarak verilir.",
        example: "Örneğin; Ar-Ge projenizde bir Matematikçi istihdam ettiniz. Bu personele ödediğiniz maaşın, o yılki brüt asgari ücret kadarlık kısmı (örneğin 20.002 TL) devlet tarafından şirketinize hibe olarak geri ödenir.",
        icon: GraduationCap,
        color: "from-yellow-400 to-orange-500"
    }
];

export default function DesteklerPage() {
    return (
        <div className="py-24 relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">AVANTAJLAR & TEŞVİKLER</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-white mb-4">
                        TEKMER Avantajları ve Destekler
                    </h1>
                    <p className="text-gray-400 max-w-3xl mx-auto">
                        İKÜANTS TEKMER bünyesinde yer alan firmalar, 5746 sayılı Kanun kapsamında sağlanan
                        birçok vergi avantajı ve devlet desteğinden yararlanma imkanına sahiptir.
                    </p>
                    <p className="text-gray-500 text-xs italic opacity-70 mt-4">
                        * Bu teşvikler 5746 sayılı Kanun kapsamındaki projeler için geçerlidir.
                    </p>
                </motion.div>

                {/* Supports Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    {supports.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group h-full"
                        >
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all h-full flex flex-col relative overflow-hidden">
                                {/* Background Gradient Hover Effect */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                <div className="relative z-10 flex items-start gap-6">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <item.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-orbitron text-xl text-white font-bold mb-3 group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-300 leading-relaxed mb-6 text-sm">
                                            {item.description}
                                        </p>

                                        {/* Example Box */}
                                        <div className="bg-black/20 rounded-lg p-4 border-l-2 border-primary/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Örnek Senaryo</span>
                                                <div className="h-px bg-primary/20 flex-1" />
                                            </div>
                                            <p className="text-gray-400 text-xs italic">
                                                "{item.example}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center p-12 rounded-3xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/10 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                    <div className="relative z-10">
                        <h3 className="font-orbitron text-2xl text-white mb-4">
                            Bu Avantajlardan Yararlanmak İçin Hemen Başvurun
                        </h3>
                        <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-lg">
                            Projenizi hayata geçirirken İKÜANTS TEKMER'in sunduğu finansal ve operasyonel desteklerden faydalanın.
                        </p>
                        <a
                            href="/basvuru"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-gray-100 transition-all duration-300 rounded-xl font-bold text-lg shadow-xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-1"
                        >
                            Başvuru Yap
                            <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

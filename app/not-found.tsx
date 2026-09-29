import Link from "next/link";
import { Compass, Home, Rocket, Users, Mail, ArrowRight } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center py-20 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-[#050510] dark:to-[#080816] text-center">
            <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-8 shadow-xl shadow-primary/10 animate-bounce">
                    <Compass className="w-10 h-10" />
                </div>

                <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    Hata 404
                </span>

                <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mt-4 mb-4">
                    Aradığınız Sayfa Bulunamadı
                </h1>

                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-lg mx-auto mb-10 leading-relaxed">
                    Ulaşmaya çalıştığınız sayfa taşınmış, silinmiş veya adı değiştirilmiş olabilir. Aşağıdaki bağlantıları kullanarak İKÜANTS TEKMER ekosistemini keşfetmeye devam edebilirsiniz.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left mb-10">
                    <Link
                        href="/"
                        className="group flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/50 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Home className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-black dark:text-white">Ana Sayfa</div>
                            <div className="text-xs text-gray-500">Merkeze genel bakış</div>
                        </div>
                        <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        href="/programlar"
                        className="group flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/50 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Rocket className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-black dark:text-white">Programlar</div>
                            <div className="text-xs text-gray-500">ANTSPARK & ANTSFIRE</div>
                        </div>
                        <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        href="/girisimciler"
                        className="group flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/50 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-black dark:text-white">Girişimciler</div>
                            <div className="text-xs text-gray-500">Kuluçka portföyü</div>
                        </div>
                        <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        href="/iletisim"
                        className="group flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/50 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-black dark:text-white">İletişim</div>
                            <div className="text-xs text-gray-500">Bize ulaşın</div>
                        </div>
                        <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-600 font-mono">
                    İKÜANTS TEKMER — İstanbul Kültür Üniversitesi Teknoloji Geliştirme Merkezi
                </div>
            </div>
        </div>
    );
}

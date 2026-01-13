import { Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { PartnerLogos } from "@/components/sections/PartnerLogos";

export const Footer = () => {
    return (
        <>
            <PartnerLogos />
            <footer className="relative bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-400 border-t border-gray-300 dark:border-primary/20 pt-16 pb-8 overflow-hidden transition-colors duration-300">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

                <div className="container mx-auto px-6 max-w-7xl relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        {/* Brand Column */}
                        <div className="space-y-4">
                            <h2 className="font-orbitron text-2xl text-gray-900 dark:text-white font-bold tracking-wider">
                                İKÜ<span className="text-primary">ANTS</span> TEKMER
                            </h2>
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                İKÜANTS Teknoloji Geliştirme Merkezi. Girişimciler için tasarlanmış inovasyon ekosistemi.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-4">
                            <h3 className="text-gray-900 dark:text-white font-bold uppercase tracking-wider text-sm border-l-2 border-secondary pl-3">
                                Hızlı Erişim
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/" className="hover:text-secondary transition-colors">Ana Sayfa</a></li>
                                <li><a href="/girisimciler" className="hover:text-secondary transition-colors">Girişimciler</a></li>
                                <li><a href="/programlar" className="hover:text-secondary transition-colors">Programlar</a></li>
                                <li><a href="/basvuru" className="hover:text-secondary transition-colors">Başvuru</a></li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="text-gray-900 dark:text-white font-bold uppercase tracking-wider text-sm border-l-2 border-secondary pl-3">
                                İletişim Üssü
                            </h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                                    <span>Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. No: 14 A Bakırköy 34158 İstanbul</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-primary shrink-0" />
                                    <a href="tel:+902124984162" className="hover:text-secondary transition-colors">(0212) 498 41 62</a>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-primary shrink-0" />
                                    <a href="mailto:bilgi@ikuantstekmer.com" className="hover:text-secondary transition-colors">bilgi@ikuantstekmer.com</a>
                                </li>
                            </ul>
                        </div>

                        {/* Social / Newsletter */}
                        <div className="space-y-4">
                            <h3 className="text-gray-900 dark:text-white font-bold uppercase tracking-wider text-sm border-l-2 border-secondary pl-3">
                                Bağlantıda Kal
                            </h3>
                            <div className="flex gap-4">
                                <a href="https://www.instagram.com/ikuantstekmer/" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-200 dark:bg-white/5 rounded hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all transform hover:scale-110">
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a href="https://www.linkedin.com/company/ikuants-tekmer/" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-200 dark:bg-white/5 rounded hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                                <a href="https://chat.whatsapp.com/LAg3l2cUSFOHBn0miCO9lz" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-200 dark:bg-white/5 rounded hover:bg-green-500 hover:text-white transition-all transform hover:scale-110">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                        <p className="text-center md:text-left">Copyright 2025 İKÜANTS TEKMER | Design By Alperen Tağman.</p>
                        <p className="text-center md:text-right">Tüm hakları saklıdır.</p>

                    </div>
                </div>
            </footer>
        </>
    );
};

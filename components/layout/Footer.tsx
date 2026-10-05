"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Instagram, Linkedin, Mail, MapPin, Phone, Youtube, Twitter } from "lucide-react";
import { PartnerLogos } from "@/components/sections/PartnerLogos";
import { DESIGN_CREDIT, stripCredit } from "@/lib/site-settings";

export const Footer = () => {
    const [footerLinks, setFooterLinks] = useState<any[]>([]);
    const [settings, setSettings] = useState({
        siteName: 'İKÜANTS TEKMER',
        footerText: 'İKÜANTS Teknoloji Geliştirme Merkezi. Girişimciler için tasarlanmış inovasyon ekosistemi.',
        phone: '(0212) 498 41 62',
        email: 'bilgi@ikuantstekmer.com',
        address: 'Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. No: 14 A Bakırköy 34158 İstanbul',
        instagram: 'https://www.instagram.com/ikuantstekmer/',
        linkedin: 'https://www.linkedin.com/company/ikuants-tekmer/',
        whatsapp: 'https://chat.whatsapp.com/LAg3l2cUSFOHBn0miCO9lz',
        copyright: `Copyright ${new Date().getFullYear()} İKÜANTS TEKMER`,
        youtube: '',
        x: '',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [settingsRes, menuRes] = await Promise.all([
                    fetch('/api/public/settings'),
                    fetch('/api/public/menus?location=FOOTER'),
                ]);
                const data = await settingsRes.json();
                if (data.success && data.settings) {
                    setSettings(prev => ({ ...prev, ...data.settings }));
                }
                const menuData = await menuRes.json();
                if (menuData.success && Array.isArray(menuData.menuItems) && menuData.menuItems.length > 0) {
                    setFooterLinks(menuData.menuItems);
                }
            } catch {
                // Fallback kept
            }
        };
        fetchSettings();
    }, []);

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
                                {settings.footerText}
                            </p>
                        </div>

                        {/* Quick Links / Dynamic CMS Footer Links */}
                        <div className="space-y-4">
                            <h3 className="text-gray-900 dark:text-white font-bold uppercase tracking-wider text-sm border-l-2 border-secondary pl-3">
                                Hızlı Erişim
                            </h3>
                            <ul className="space-y-2 text-sm">
                                {footerLinks.length > 0 ? (
                                    footerLinks.map((item: any) => (
                                        <li key={item.id}>
                                            <Link
                                                href={item.url}
                                                target={item.openInNewTab ? '_blank' : undefined}
                                                rel={item.isExternal ? 'noopener noreferrer' : undefined}
                                                className="hover:text-secondary transition-colors"
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))
                                ) : (
                                    <>
                                        <li><Link href="/" className="hover:text-secondary transition-colors">Ana Sayfa</Link></li>
                                        <li><Link href="/girisimciler" className="hover:text-secondary transition-colors">Girişimciler</Link></li>
                                        <li><Link href="/mentorler" className="hover:text-secondary transition-colors">Mentörler</Link></li>
                                        <li><Link href="/programlar" className="hover:text-secondary transition-colors">Programlar</Link></li>
                                        <li><Link href="/basvuru" className="hover:text-secondary transition-colors">Başvuru</Link></li>
                                    </>
                                )}
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
                                    <span>{settings.address}</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-primary shrink-0" />
                                    <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-secondary transition-colors">{settings.phone}</a>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-primary shrink-0" />
                                    <a href={`mailto:${settings.email}`} className="hover:text-secondary transition-colors">{settings.email}</a>
                                </li>
                            </ul>
                        </div>

                        {/* Social / Newsletter */}
                        <div className="space-y-4">
                            <h3 className="text-gray-900 dark:text-white font-bold uppercase tracking-wider text-sm border-l-2 border-secondary pl-3">
                                Bağlantıda Kal
                            </h3>
                            <div className="flex gap-4">
                                {settings.instagram && (
                                    <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 bg-gray-200 dark:bg-white/5 rounded hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all transform hover:scale-110">
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                )}
                                {settings.linkedin && (
                                    <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2 bg-gray-200 dark:bg-white/5 rounded hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110">
                                        <Linkedin className="w-5 h-5" />
                                    </a>
                                )}
                                {settings.youtube && (
                                    <a href={settings.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 bg-gray-200 dark:bg-white/5 rounded hover:bg-red-600 hover:text-white transition-all transform hover:scale-110">
                                        <Youtube className="w-5 h-5" />
                                    </a>
                                )}
                                {settings.x && (
                                    <a href={settings.x} target="_blank" rel="noopener noreferrer" aria-label="X" className="p-2 bg-gray-200 dark:bg-white/5 rounded hover:bg-black hover:text-white transition-all transform hover:scale-110">
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                )}
                                {settings.whatsapp && (
                                    <a href={settings.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="p-2 bg-gray-200 dark:bg-white/5 rounded hover:bg-green-500 hover:text-white transition-all transform hover:scale-110">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                        {/* The designer credit is fixed in code and is not editable from the admin panel */}
                        <p className="text-center md:text-left">
                            {stripCredit(settings.copyright)} <span aria-hidden="true">|</span> <span data-credit="locked">{DESIGN_CREDIT}.</span>
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
                            <button type="button" onClick={() => window.dispatchEvent(new Event('open-cookie-preferences'))} className="hover:text-primary hover:underline">Çerez tercihleri</button>
                            <span>Tüm hakları saklıdır.</span>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

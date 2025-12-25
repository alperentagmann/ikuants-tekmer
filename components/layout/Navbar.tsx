"use client";
import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
    name: string;
    href: string;
    subItems?: { name: string; href: string }[];
};

export const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

    const navLinks: NavItem[] = [
        { name: "ANA SAYFA", href: "/" },

        {
            name: "HAKKIMIZDA",
            href: "#",
            subItems: [
                { name: "Ekibimiz", href: "/ekibimiz" },
                { name: "Kurullarımız", href: "/kurullar" },
                { name: "Kullanım Alanları", href: "/kullanim-alanlari" },
                { name: "Hizmetlerimiz", href: "/hizmetlerimiz" },
                { name: "Mevzuat", href: "/mevzuat" },
                { name: "SSS", href: "/sss" },
            ]
        },
        { name: "GİRİŞİMCİLER", href: "/girisimciler" },
        { name: "DESTEKLER", href: "/destekler" },
        {
            name: "PROGRAMLAR",
            href: "/programlar",
            subItems: [
                { name: "Tüm Programlar", href: "/programlar" },
                { name: "ANTSPARK Ön Kuluçka", href: "/antspark" },
                { name: "Glow Up Ideathon", href: "/glowup-basvuru" },
            ]
        },
        { name: "HABERLER", href: "/haberler" },
        { name: "MENTÖRLER", href: "/mentorler" },
        { name: "İLETİŞİM", href: "/iletisim" },
    ];

    return (
        <nav className="fixed top-0 w-full z-50 px-6 py-4">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl border-b border-white/10"></div>

            <div className="relative container mx-auto flex items-center justify-between max-w-7xl">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <img
                        src="/logo-navbar.png"
                        alt="İKÜANTS TEKMER"
                        className="h-14 w-auto animate-logo-glow"
                    />
                </Link>

                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <div
                            key={link.name}
                            className="relative"
                            onMouseEnter={() => link.subItems && setOpenDropdown(link.name)}
                            onMouseLeave={() => setOpenDropdown(null)}
                        >
                            {link.subItems ? (
                                <button className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors py-2">
                                    {link.name}
                                    <ChevronDown className={cn(
                                        "w-4 h-4 transition-transform",
                                        openDropdown === link.name && "rotate-180"
                                    )} />
                                </button>
                            ) : (
                                <Link
                                    href={link.href}
                                    className="relative text-sm font-medium text-gray-300 hover:text-white transition-colors group py-2"
                                >
                                    {link.name}
                                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-secondary group-hover:w-full transition-all duration-300" />
                                </Link>
                            )}

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {link.subItems && openDropdown === link.name && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full left-0 mt-2 w-56 bg-[#0a0a15]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                                    >
                                        <div className="py-2">
                                            {link.subItems.map((subItem) => (
                                                <Link
                                                    key={subItem.name}
                                                    href={subItem.href}
                                                    className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    {subItem.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                    <Link
                        href="/basvuru"
                        className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 transition-all duration-300 rounded-lg font-semibold text-sm tracking-wide shadow-lg shadow-primary/25"
                    >
                        HEMEN BAŞVUR
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden text-white p-2"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="lg:hidden overflow-hidden bg-[#0a0a15]/98 backdrop-blur-xl border-b border-white/10 absolute top-full left-0 w-full"
                    >
                        <div className="flex flex-col p-6 gap-2">
                            {navLinks.map((link) => (
                                <React.Fragment key={link.name}>
                                    {link.subItems ? (
                                        <div>
                                            <button
                                                onClick={() => setOpenDropdown(openDropdown === link.name ? null : link.name)}
                                                className="flex items-center justify-between w-full text-gray-300 hover:text-secondary py-3 border-l-2 border-transparent hover:border-secondary pl-4 transition-all"
                                            >
                                                {link.name}
                                                <ChevronDown className={cn(
                                                    "w-4 h-4 transition-transform",
                                                    openDropdown === link.name && "rotate-180"
                                                )} />
                                            </button>
                                            <AnimatePresence>
                                                {openDropdown === link.name && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden pl-6"
                                                    >
                                                        {link.subItems.map((subItem) => (
                                                            <Link
                                                                key={subItem.name}
                                                                href={subItem.href}
                                                                className="block text-gray-400 hover:text-secondary py-2 text-sm"
                                                                onClick={() => setIsOpen(false)}
                                                            >
                                                                {subItem.name}
                                                            </Link>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <Link
                                            href={link.href}
                                            className="text-gray-300 hover:text-secondary py-3 border-l-2 border-transparent hover:border-secondary pl-4 transition-all"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))}
                            <Link
                                href="/basvuru"
                                className="w-full py-3 mt-4 bg-gradient-to-r from-primary to-purple-600 text-white text-center transition-all rounded-lg font-semibold"
                                onClick={() => setIsOpen(false)}
                            >
                                HEMEN BAŞVUR
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

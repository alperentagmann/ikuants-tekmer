"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MotionConfig } from "framer-motion";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { SuccessCelebration } from "@/components/effects/SuccessCelebration";
import { NavigationPolish } from "@/components/effects/NavigationPolish";
import { usePublicSettings } from "@/lib/public-settings-client";

/**
 * Public site header/footer. The admin panel (/admin) has its own layout, so the public
 * chrome is not rendered there; public pages render exactly as before.
 */
export function PublicChrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const settings = usePublicSettings();
    if (pathname?.startsWith("/admin")) return <>{children}</>;
    // Admin › Ayarlar › Animasyonlar: "reduced" / "off" disable large movement site-wide;
    // visitors who ask their OS for reduced motion always get it.
    const motion = settings?.animation.motion || "full";
    return (
        <MotionConfig reducedMotion={motion === "full" ? "user" : "always"}>
            <Navbar />
            <main className="flex-grow pt-20">{children}</main>
            <Footer />
            <CookieConsent />
            <SuccessCelebration settings={settings?.animation || null} />
            <NavigationPolish />
        </MotionConfig>
    );
}

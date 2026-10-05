import type { Metadata } from "next";
import Link from "next/link";
import { SettingService } from "@/lib/services/setting-service";
import { resolvePublicSettings } from "@/lib/site-settings";
import { CookiePreferencesButton } from "./CookiePreferencesButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Çerez Politikası | İKÜANTS TEKMER",
    description: "İKÜANTS TEKMER web sitesinde kullanılan çerezler ve tercihlerinizi nasıl yönetebileceğiniz.",
};

/** Text is edited in Admin › Site Ayarları › Çerez Uyarısı. */
export default async function CerezPolitikasiPage() {
    const settings = resolvePublicSettings(await SettingService.getPublicSettings());
    return (
        <div className="min-h-screen bg-gray-50 py-24 dark:bg-[#050510]">
            <div className="container mx-auto max-w-3xl px-6">
                <h1 className="mb-6 font-orbitron text-3xl font-bold text-black dark:text-white md:text-4xl">Çerez Politikası</h1>
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-white/5 md:p-10">
                    <div className="whitespace-pre-line text-base leading-relaxed text-gray-700 dark:text-gray-300">{settings.cookiePolicy}</div>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <CookiePreferencesButton />
                        <Link href="/kvkk/aydinlatma-metni" className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 dark:border-white/15 dark:text-gray-200">KVKK Aydınlatma Metni</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

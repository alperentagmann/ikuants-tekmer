"use client";

export function CookiePreferencesButton() {
    return (
        <button type="button" onClick={() => window.dispatchEvent(new Event("open-cookie-preferences"))} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">
            Çerez tercihlerimi değiştir
        </button>
    );
}

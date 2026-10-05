import type { Metadata, Viewport } from "next";
import { SETTING_DEFAULTS } from "@/lib/site-settings";
import { Space_Grotesk, Inter } from "next/font/google"; // Import fonts
import "./globals.css";
import { PublicChrome } from "@/components/layout/PublicChrome";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-orbitron",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DESCRIPTION = "İnovasyon ve teknoloji merkezimizde girişimcileri, kurumları ve yatırımcıları bir araya getiriyoruz.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "İKÜANTS TEKMER",
  description: DESCRIPTION,
  applicationName: "İKÜANTS TEKMER",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "İKÜANTS TEKMER",
    title: "İKÜANTS TEKMER — Girişimcilik & İnovasyon Merkezi",
    description: DESCRIPTION,
    images: [{ url: "/images/hero-slide-1.jpg", width: 1200, height: 630, alt: "İKÜANTS TEKMER" }],
  },
  twitter: { card: "summary_large_image", title: "İKÜANTS TEKMER", description: DESCRIPTION, images: ["/images/hero-slide-1.jpg"] },
  icons: { icon: "/favicon.ico", apple: "/logo.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050510" },
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
  ],
};

/** Organization structured data (same contact details shown in the site footer). */
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "İKÜANTS TEKMER",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  email: SETTING_DEFAULTS.site_email,
  telephone: SETTING_DEFAULTS.site_phone,
  address: { "@type": "PostalAddress", streetAddress: SETTING_DEFAULTS.contact_address, addressLocality: "İstanbul", addressCountry: "TR" },
  sameAs: [SETTING_DEFAULTS.social_instagram, SETTING_DEFAULTS.social_linkedin].filter(Boolean),
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased selection:bg-orange-500/30`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_LD).replace(/</g, "\\u003c") }} />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PublicChrome>{children}</PublicChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}

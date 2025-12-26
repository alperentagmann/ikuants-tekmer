import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google"; // Import fonts
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "İKÜANTS TEKMER",
  description: "İnovasyon ve teknoloji merkezimizde girişimcileri, kurumları ve yatırımcıları bir araya getiriyoruz.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${orbitron.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

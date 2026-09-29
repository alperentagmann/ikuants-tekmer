import React from "react";
import { Hero } from "@/components/sections/Hero";
import { Differences } from "@/components/sections/Differences";
import { PartnerLogos } from "@/components/sections/PartnerLogos";
import { Programs } from "@/components/sections/Programs";
import { Entrepreneurs } from "@/components/sections/Entrepreneurs";
import { Supports } from "@/components/sections/Supports";
import { HomepageService } from "@/lib/services/homepage-service";

export const revalidate = 60; // ISR cache revalidation

export default async function Home() {
  let sections: Array<{ sectionKey: string; isVisible: boolean }> = [];
  try {
    sections = await HomepageService.getSections();
  } catch (e) {
    console.error("Failed to load homepage sections from database:", e);
  }

  // Filter visible sections
  const visibleKeys = new Set(
    sections.length > 0
      ? sections.filter((s) => s.isVisible).map((s) => s.sectionKey)
      : ["hero", "partners", "hero_cards", "programs", "entrepreneurs", "supports"]
  );

  // If DB has ordered sections, sort by them
  const sortedKeys = sections.length > 0
    ? sections.filter((s) => s.isVisible).map((s) => s.sectionKey)
    : ["hero", "partners", "hero_cards", "programs", "entrepreneurs", "supports"];

  const renderSection = (key: string) => {
    switch (key) {
      case "hero":
        return <Hero key="hero" />;
      case "partners":
        return <PartnerLogos key="partners" />;
      case "hero_cards":
      case "differences":
        return <Differences key="hero_cards" />;
      case "programs":
        return <Programs key="programs" />;
      case "entrepreneurs":
        return <Entrepreneurs key="entrepreneurs" />;
      case "supports":
      case "cta":
        return <Supports key="supports" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
      {sortedKeys.map((key) => renderSection(key))}
    </div>
  );
}

import { Hero } from "@/components/sections/Hero";
import { Differences } from "@/components/sections/Differences";
import { PartnerLogos } from "@/components/sections/PartnerLogos";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <PartnerLogos />
      <Differences />
    </div>
  );
}

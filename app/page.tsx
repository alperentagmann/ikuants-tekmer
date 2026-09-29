import { Hero } from "@/components/sections/Hero";
import { Differences } from "@/components/sections/Differences";

export default function Home() {
  return (
    <div className="flex flex-col bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
      <Hero />
      <Differences />
    </div>
  );
}

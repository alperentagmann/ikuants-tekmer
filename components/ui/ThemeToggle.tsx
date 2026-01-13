"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="w-10 h-10 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400">
                <Sun className="h-5 w-5 opacity-0" />
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center overflow-hidden"
            aria-label="Temayı Değiştir"
        >
            <div className="relative z-10">
                {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-gray-300 transition-all hover:text-white" />
                ) : (
                    <Sun className="h-5 w-5 text-orange-500 transition-all hover:text-orange-600" />
                )}
            </div>
        </button>
    );
}

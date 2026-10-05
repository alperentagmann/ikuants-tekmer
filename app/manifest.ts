import type { MetadataRoute } from "next";

/** Web app manifest: lets visitors and staff add the site / admin panel to their home screen. */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "İKÜANTS TEKMER",
        short_name: "İKÜANTS",
        description: "İKÜANTS TEKMER girişimcilik ve inovasyon merkezi",
        start_url: "/",
        display: "standalone",
        background_color: "#050510",
        theme_color: "#050510",
        lang: "tr",
        icons: [{ src: "/logo.png", sizes: "any", type: "image/png" }],
    };
}

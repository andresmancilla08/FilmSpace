import type { MetadataRoute } from "next";

// PWA: hace la web instalable como app (iOS "Añadir a inicio", Android "Instalar").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FilmSpace",
    short_name: "FilmSpace",
    description: "Cine, series y TV en vivo",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

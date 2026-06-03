import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "**.themoviedb.org" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "archive.org" },
    ],
  },
};

export default withNextIntl(nextConfig);

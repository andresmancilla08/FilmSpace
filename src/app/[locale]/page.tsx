import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { HeroFeatured } from "@/components/media/HeroFeatured";
import { MediaRow } from "@/components/media/MediaRow";
import { getFeatured, getTrendingMovies, getPopularSeries, getPopularAnime } from "@/lib/tmdb";
import { FEATURED, TRENDING, NEW_SERIES, ANIME_PICKS } from "@/lib/mockData";

async function getPageData() {
  if (!process.env.TMDB_READ_TOKEN) {
    return { featured: FEATURED, trending: TRENDING, series: NEW_SERIES, anime: ANIME_PICKS };
  }
  try {
    const [featured, trending, series, anime] = await Promise.all([
      getFeatured(),
      getTrendingMovies(),
      getPopularSeries(),
      getPopularAnime(),
    ]);
    return { featured, trending, series, anime };
  } catch {
    return { featured: FEATURED, trending: TRENDING, series: NEW_SERIES, anime: ANIME_PICKS };
  }
}

export default async function Home() {
  const t = await getTranslations("home");
  const { featured, trending, series, anime } = await getPageData();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main>
        <HeroFeatured media={featured} />
        <div className="space-y-10 py-10 tv:space-y-14 tv:py-14">
          <MediaRow title={t("trendingNow")} items={trending} />
          <MediaRow title={t("popularSeries")} items={series} />
          <MediaRow title={t("animePicks")} items={anime} />
        </div>
      </main>
    </div>
  );
}

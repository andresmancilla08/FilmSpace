import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { HeroFeatured } from "@/components/media/HeroFeatured";
import { MediaRow } from "@/components/media/MediaRow";
import { ClassicRow } from "@/components/media/ClassicRow";
import { getFeatured, getTrendingMovies, getPopularSeries } from "@/lib/tmdb";
import { getPopularAnime } from "@/lib/anilist";
import { getClassicFilms } from "@/lib/archive";
import { FEATURED, TRENDING, NEW_SERIES, ANIME_PICKS } from "@/lib/mockData";

async function getPageData() {
  const hasTMDB = !!process.env.TMDB_READ_TOKEN;

  const [featured, trending, series, anime, classics] = await Promise.allSettled([
    hasTMDB ? getFeatured()        : Promise.resolve(FEATURED),
    hasTMDB ? getTrendingMovies()  : Promise.resolve(TRENDING),
    hasTMDB ? getPopularSeries()   : Promise.resolve(NEW_SERIES),
    getPopularAnime(),
    getClassicFilms(8),
  ]);

  return {
    featured: featured.status  === "fulfilled" ? featured.value  : FEATURED,
    trending: trending.status  === "fulfilled" ? trending.value  : TRENDING,
    series:   series.status    === "fulfilled" ? series.value    : NEW_SERIES,
    anime:    anime.status     === "fulfilled" ? anime.value     : ANIME_PICKS,
    classics: classics.status  === "fulfilled" ? classics.value  : [],
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const t = await getTranslations("home");
  const tc = await getTranslations("classics");
  const { featured, trending, series, anime, classics } = await getPageData();

  // Filtro del navbar (?t=movie|series|anime). Sin filtro = todo.
  const filter = (await searchParams).t;
  const showMovies = !filter || filter === "movie";
  const showSeries = !filter || filter === "series";
  const showAnime = !filter || filter === "anime";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main>
        <HeroFeatured media={featured} />
        <div className="space-y-10 py-10 tv:space-y-14 tv:py-14">
          {showMovies && <MediaRow title={t("trendingNow")} items={trending} />}
          {showSeries && <MediaRow title={t("popularSeries")} items={series} />}
          {showAnime && <MediaRow title={t("animePicks")} items={anime} />}
          {showMovies && <ClassicRow title={tc("rowTitle")} items={classics} />}
        </div>
      </main>
    </div>
  );
}

import { Navbar } from "@/components/layout/Navbar";
import { HeroFeatured } from "@/components/media/HeroFeatured";
import { MediaRow } from "@/components/media/MediaRow";
import { FEATURED, TRENDING, NEW_SERIES, ANIME_PICKS } from "@/lib/mockData";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main>
        <HeroFeatured media={FEATURED} />
        <div className="space-y-10 py-10 tv:space-y-14 tv:py-14">
          <MediaRow title="Trending Now" items={TRENDING} />
          <MediaRow title="New Series" items={NEW_SERIES} />
          <MediaRow title="Anime Picks" items={ANIME_PICKS} />
        </div>
      </main>
    </div>
  );
}

import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { getMovieDetail, getTVDetail } from "@/lib/tmdb";
import { FEATURED, TRENDING, NEW_SERIES, ANIME_PICKS } from "@/lib/mockData";
import type { ContentType, Media } from "@/types";

async function getMedia(type: string, id: number): Promise<Media | null> {
  if (!["movie", "series", "anime"].includes(type)) return null;

  if (!process.env.TMDB_READ_TOKEN) {
    const all: Media[] = [FEATURED, ...TRENDING, ...NEW_SERIES, ...ANIME_PICKS];
    return all.find((m) => m.id === id) ?? null;
  }

  try {
    if (type === "movie") return await getMovieDetail(id);
    return await getTVDetail(id, type as ContentType);
  } catch {
    return null;
  }
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale, id: idStr } = await params;
  const { type = "movie" } = await searchParams;
  const id = Number(idStr);
  if (!id || isNaN(id)) notFound();

  const media = await getMedia(type, id);
  if (!media) notFound();

  const backHref = `/${locale}/${media.type}/${media.id}`;
  const subtitle = media.type !== "movie" ? "S1 E1" : undefined;

  return (
    <VideoPlayer
      title={media.title}
      subtitle={subtitle}
      backHref={backHref}
      backdrop={media.backdrop}
    />
  );
}

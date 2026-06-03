import { notFound } from "next/navigation";
import { getMovieDetail, getTVDetail } from "@/lib/tmdb";
import { DetailPage } from "@/components/media/detail/DetailPage";
import { FEATURED, TRENDING, NEW_SERIES, ANIME_PICKS } from "@/lib/mockData";
import type { ContentType, MediaDetail } from "@/types";

const VALID_TYPES = new Set<string>(["movie", "series", "anime"]);

async function getDetail(type: string, id: number): Promise<MediaDetail | null> {
  if (!VALID_TYPES.has(type)) return null;
  const contentType = type as ContentType;

  if (!process.env.TMDB_READ_TOKEN) {
    const all = [FEATURED, ...TRENDING, ...NEW_SERIES, ...ANIME_PICKS];
    const media = all.find((m) => m.id === id);
    if (!media) return null;
    return { ...media, cast: [], trailer: null, similar: [] };
  }

  try {
    if (contentType === "movie") return await getMovieDetail(id);
    return await getTVDetail(id, contentType);
  } catch {
    return null;
  }
}

export default async function DetailRoute({
  params,
}: {
  params: Promise<{ locale: string; type: string; id: string }>;
}) {
  const { type, id: idStr } = await params;
  const id = Number(idStr);
  if (!id || isNaN(id)) notFound();

  const media = await getDetail(type, id);
  if (!media) notFound();

  return <DetailPage media={media} />;
}

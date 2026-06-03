import { NextResponse } from "next/server";
import { FEATURED, TRENDING, NEW_SERIES, ANIME_PICKS } from "@/lib/mockData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!query) return NextResponse.json([]);

  if (!process.env.TMDB_READ_TOKEN) {
    const all = [FEATURED, ...TRENDING, ...NEW_SERIES, ...ANIME_PICKS];
    const filtered = all.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.overview.toLowerCase().includes(query) ||
        m.genres.some((g) => g.toLowerCase().includes(query))
    );
    return NextResponse.json(filtered);
  }

  try {
    const { searchMedia } = await import("@/lib/tmdb");
    const results = await searchMedia(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}

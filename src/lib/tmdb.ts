import type { Media, ContentType } from "@/types";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  18: "Drama", 14: "Fantasy", 36: "History", 27: "Horror", 9648: "Mystery",
  10749: "Romance", 878: "Sci-Fi", 53: "Thriller", 10752: "War", 37: "Western",
  10759: "Action & Adventure", 10765: "Sci-Fi & Fantasy", 10768: "War & Politics",
};

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
}

interface TMDBResponse {
  results: TMDBItem[];
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: headers(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

function toMedia(item: TMDBItem, type: ContentType): Media {
  const dateStr = item.release_date ?? item.first_air_date ?? "2024-01-01";
  const year = new Date(dateStr).getFullYear();
  const seed = item.id;

  return {
    id: item.id,
    title: item.title ?? item.name ?? "Unknown",
    type,
    poster: item.poster_path
      ? `${IMG}/w500${item.poster_path}`
      : `https://picsum.photos/seed/${seed}/500/750`,
    backdrop: item.backdrop_path
      ? `${IMG}/w1280${item.backdrop_path}`
      : `https://picsum.photos/seed/${seed}bg/1920/1080`,
    overview: item.overview,
    rating: Math.round(item.vote_average * 10) / 10,
    year,
    genres: item.genre_ids
      .slice(0, 3)
      .map((id) => GENRE_MAP[id] ?? "")
      .filter(Boolean),
  };
}

export async function getFeatured(): Promise<Media> {
  const data = await get<TMDBResponse>("/trending/movie/week");
  const item = data.results.find((i) => i.backdrop_path && i.overview) ?? data.results[0];
  return toMedia(item, "movie");
}

export async function getTrendingMovies(): Promise<Media[]> {
  const data = await get<TMDBResponse>("/trending/movie/week");
  return data.results.slice(0, 10).map((i) => toMedia(i, "movie"));
}

export async function getPopularSeries(): Promise<Media[]> {
  const data = await get<TMDBResponse>("/trending/tv/week");
  return data.results
    .filter((i) => !i.genre_ids.includes(16))
    .slice(0, 8)
    .map((i) => toMedia(i, "series"));
}

export async function getPopularAnime(): Promise<Media[]> {
  const data = await get<TMDBResponse>("/discover/tv", {
    with_genres: "16",
    with_original_language: "ja",
    sort_by: "popularity.desc",
    "vote_count.gte": "200",
  });
  return data.results.slice(0, 8).map((i) => toMedia(i, "anime"));
}

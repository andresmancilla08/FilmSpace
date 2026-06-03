import type { Media, ContentType, CastMember, MediaDetail } from "@/types";

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

interface TMDBResponse { results: TMDBItem[] }

interface TMDBSearchItem extends TMDBItem {
  media_type: "movie" | "tv" | "person";
  original_language?: string;
}

interface TMDBGenre { id: number; name: string }
interface TMDBCastMember { id: number; name: string; character: string; profile_path: string | null }
interface TMDBVideo { key: string; site: string; type: string; official?: boolean }

interface TMDBMovieDetail {
  id: number; title: string; poster_path: string | null; backdrop_path: string | null;
  overview: string; vote_average: number; release_date: string;
  genres: TMDBGenre[]; tagline: string; runtime: number | null;
  credits: { cast: TMDBCastMember[] };
  videos: { results: TMDBVideo[] };
  similar: { results: TMDBItem[] };
}

interface TMDBTVDetail {
  id: number; name: string; poster_path: string | null; backdrop_path: string | null;
  overview: string; vote_average: number; first_air_date: string;
  genres: TMDBGenre[]; tagline: string; number_of_seasons: number;
  number_of_episodes: number; episode_run_time: number[];
  credits: { cast: TMDBCastMember[] };
  videos: { results: TMDBVideo[] };
  similar: { results: TMDBItem[] };
}

function headers() {
  return { Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`, "Content-Type": "application/json" };
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: headers(), next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

function toMedia(item: TMDBItem, type: ContentType): Media {
  const dateStr = item.release_date ?? item.first_air_date ?? "2024-01-01";
  return {
    id: item.id,
    title: item.title ?? item.name ?? "Unknown",
    type,
    poster: item.poster_path ? `${IMG}/w500${item.poster_path}` : `https://picsum.photos/seed/${item.id}/500/750`,
    backdrop: item.backdrop_path ? `${IMG}/w1280${item.backdrop_path}` : `https://picsum.photos/seed/${item.id}bg/1920/1080`,
    overview: item.overview,
    rating: Math.round(item.vote_average * 10) / 10,
    year: new Date(dateStr).getFullYear(),
    genres: item.genre_ids.slice(0, 3).map((id) => GENRE_MAP[id] ?? "").filter(Boolean),
  };
}

function findTrailer(videos: TMDBVideo[]): string | null {
  return (
    videos.find((v) => v.type === "Trailer" && v.site === "YouTube" && v.official)?.key ??
    videos.find((v) => v.type === "Trailer" && v.site === "YouTube")?.key ??
    null
  );
}

function toMediaDetail(item: TMDBMovieDetail | TMDBTVDetail, type: ContentType): MediaDetail {
  const isTV = type !== "movie";
  const tv = item as TMDBTVDetail;
  const movie = item as TMDBMovieDetail;
  const dateStr = isTV ? tv.first_air_date : movie.release_date;
  const cast: CastMember[] = item.credits.cast.slice(0, 8).map((c) => ({
    id: c.id, name: c.name, character: c.character,
    profile: c.profile_path ? `${IMG}/w185${c.profile_path}` : null,
  }));
  return {
    id: item.id,
    title: isTV ? tv.name : movie.title,
    type,
    poster: item.poster_path ? `${IMG}/w500${item.poster_path}` : `https://picsum.photos/seed/${item.id}/500/750`,
    backdrop: item.backdrop_path ? `${IMG}/w1280${item.backdrop_path}` : `https://picsum.photos/seed/${item.id}bg/1920/1080`,
    overview: item.overview,
    rating: Math.round(item.vote_average * 10) / 10,
    year: new Date((isTV ? tv.first_air_date : movie.release_date) ?? "2024-01-01").getFullYear(),
    genres: item.genres.slice(0, 3).map((g) => g.name),
    tagline: item.tagline || undefined,
    runtime: isTV ? (tv.episode_run_time?.[0] ?? undefined) : (movie.runtime ?? undefined),
    seasons: isTV ? tv.number_of_seasons : undefined,
    episodes: isTV ? tv.number_of_episodes : undefined,
    cast,
    trailer: findTrailer(item.videos.results),
    similar: item.similar.results.slice(0, 6).map((s) => toMedia(s, type)),
  };
}

// ── Catalog ──────────────────────────────────────────

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
  return data.results.filter((i) => !i.genre_ids.includes(16)).slice(0, 8).map((i) => toMedia(i, "series"));
}

export async function getPopularAnime(): Promise<Media[]> {
  const data = await get<TMDBResponse>("/discover/tv", {
    with_genres: "16", with_original_language: "ja",
    sort_by: "popularity.desc", "vote_count.gte": "200",
  });
  return data.results.slice(0, 8).map((i) => toMedia(i, "anime"));
}

// ── Detail ────────────────────────────────────────────

export async function getMovieDetail(id: number): Promise<MediaDetail> {
  const data = await get<TMDBMovieDetail>(`/movie/${id}`, { append_to_response: "credits,videos,similar" });
  return toMediaDetail(data, "movie");
}

export async function getTVDetail(id: number, type: ContentType = "series"): Promise<MediaDetail> {
  const data = await get<TMDBTVDetail>(`/tv/${id}`, { append_to_response: "credits,videos,similar" });
  return toMediaDetail(data, type);
}

// ── Search ────────────────────────────────────────────

export async function searchMedia(query: string): Promise<Media[]> {
  if (!query.trim()) return [];
  const data = await get<{ results: TMDBSearchItem[] }>("/search/multi", {
    query: query.trim(), include_adult: "false", language: "en-US",
  });
  return data.results
    .filter((item): item is TMDBSearchItem & { media_type: "movie" | "tv" } =>
      item.media_type === "movie" || item.media_type === "tv"
    )
    .slice(0, 20)
    .map((item) => {
      const isAnime = item.media_type === "tv" && item.genre_ids.includes(16) && item.original_language === "ja";
      const type: ContentType = item.media_type === "movie" ? "movie" : (isAnime ? "anime" : "series");
      return toMedia(item, type);
    })
    .filter((m) => m.poster || m.backdrop);
}

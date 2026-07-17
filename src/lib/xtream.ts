import type { IPTVCategory, IPTVChannel, IPTVEpisode } from "@/types";

export interface XtreamCreds {
  base: string;
  user: string;
  pass: string;
}

// Extrae host + user/pass de URLs típicas: get.php, player_api.php o query con username/password.
export function parseXtream(url: string): XtreamCreds | null {
  try {
    const u = new URL(url);
    const user = u.searchParams.get("username") ?? u.searchParams.get("user");
    const pass = u.searchParams.get("password") ?? u.searchParams.get("pass");
    if (!user || !pass) return null;
    return { base: `${u.protocol}//${u.host}`, user, pass };
  } catch {
    return null;
  }
}

async function api(creds: XtreamCreds, action?: string, extra: Record<string, string> = {}) {
  const q = new URLSearchParams({
    username: creds.user,
    password: creds.pass,
    ...(action ? { action } : {}),
    ...extra,
  });
  const target = `${creds.base}/player_api.php?${q}`;
  const res = await fetch(`/api/iptv?url=${encodeURIComponent(target)}`);
  if (!res.ok) throw new Error(String(res.status));
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("invalid json");
  }
}

function cats(raw: unknown): IPTVCategory[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c: { category_id?: string | number; category_name?: string }) => ({
      id: String(c.category_id ?? ""),
      name: String(c.category_name ?? "").trim() || "—",
    }))
    .filter((c) => c.id);
}

export async function xtreamVodCategories(creds: XtreamCreds): Promise<IPTVCategory[]> {
  return cats(await api(creds, "get_vod_categories"));
}

export async function xtreamSeriesCategories(creds: XtreamCreds): Promise<IPTVCategory[]> {
  return cats(await api(creds, "get_series_categories"));
}

export async function xtreamVodStreams(
  creds: XtreamCreds,
  categoryId?: string
): Promise<IPTVChannel[]> {
  const raw = await api(
    creds,
    "get_vod_streams",
    categoryId && categoryId !== "__all__" ? { category_id: categoryId } : {}
  );
  if (!Array.isArray(raw)) return [];
  return raw.map(
    (s: {
      name?: string;
      stream_icon?: string;
      category_id?: string | number;
      stream_id?: string | number;
      container_extension?: string;
      plot?: string;
      releaseDate?: string;
      releasedate?: string;
      rating?: string;
      year?: string;
    }) => {
      const id = s.stream_id;
      const ext = (s.container_extension || "mp4").replace(/^\./, "");
      const year = (s.releaseDate || s.releasedate || s.year || "").toString().slice(0, 4);
      return {
        name: String(s.name ?? "—").trim(),
        logo: String(s.stream_icon ?? ""),
        group: String(s.category_id ?? ""),
        category: String(s.category_id ?? "other"),
        url: id != null ? `${creds.base}/movie/${creds.user}/${creds.pass}/${id}.${ext}` : "",
        kind: "movie" as const,
        plot: s.plot ? String(s.plot) : undefined,
        year: year || undefined,
        rating: s.rating ? String(s.rating) : undefined,
      };
    }
  ).filter((c) => c.url);
}

export async function xtreamSeries(
  creds: XtreamCreds,
  categoryId?: string
): Promise<IPTVChannel[]> {
  const raw = await api(
    creds,
    "get_series",
    categoryId && categoryId !== "__all__" ? { category_id: categoryId } : {}
  );
  if (!Array.isArray(raw)) return [];
  return raw.map(
    (s: {
      name?: string;
      cover?: string;
      category_id?: string | number;
      series_id?: string | number;
      plot?: string;
      releaseDate?: string;
      rating?: string;
    }) => {
      const id = s.series_id != null ? String(s.series_id) : "";
      const year = (s.releaseDate || "").toString().slice(0, 4);
      return {
        name: String(s.name ?? "—").trim(),
        logo: String(s.cover ?? ""),
        group: String(s.category_id ?? ""),
        category: String(s.category_id ?? "other"),
        url: "", // se resuelve al elegir episodio
        kind: "series" as const,
        seriesId: id,
        plot: s.plot ? String(s.plot) : undefined,
        year: year || undefined,
        rating: s.rating ? String(s.rating) : undefined,
      };
    }
  ).filter((c) => c.seriesId);
}

// Episodios de una serie (temporadas → lista plana ordenada).
export async function xtreamSeriesInfo(
  creds: XtreamCreds,
  seriesId: string
): Promise<IPTVEpisode[]> {
  const raw = await api(creds, "get_series_info", { series_id: seriesId });
  const episodes = raw?.episodes;
  if (!episodes || typeof episodes !== "object") return [];
  const out: IPTVEpisode[] = [];
  for (const [seasonKey, list] of Object.entries(episodes as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    const season = Number(seasonKey) || 1;
    for (const ep of list as {
      id?: string | number;
      title?: string;
      episode_num?: number;
      container_extension?: string;
      info?: { plot?: string; duration?: string };
    }[]) {
      const id = ep.id;
      if (id == null) continue;
      const ext = (ep.container_extension || "mp4").replace(/^\./, "");
      out.push({
        id: String(id),
        title: String(ep.title ?? `E${ep.episode_num ?? out.length + 1}`).trim(),
        season,
        episode: Number(ep.episode_num) || out.length + 1,
        url: `${creds.base}/series/${creds.user}/${creds.pass}/${id}.${ext}`,
        plot: ep.info?.plot ? String(ep.info.plot) : undefined,
        duration: ep.info?.duration ? String(ep.info.duration) : undefined,
      });
    }
  }
  return out.sort((a, b) => a.season - b.season || a.episode - b.episode);
}

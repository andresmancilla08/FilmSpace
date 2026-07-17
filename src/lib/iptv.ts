import type { IPTVCategory, IPTVChannel, IPTVEpisode, IPTVKind, TVTab } from "@/types";
import {
  parseXtream,
  xtreamSeries,
  xtreamSeriesCategories,
  xtreamSeriesInfo,
  xtreamVodCategories,
  xtreamVodStreams,
  type XtreamCreds,
} from "@/lib/xtream";

const KEY = "filmspace.iptv.source";

// ───────────────────────── Proveedores (fuentes libres/legales) ─────────────────────────
// Solo FAST y listas abiertas (iptv-org, Pluto, Samsung TV+, Plex, Tubi). Sin listas "todo
// incluido" piratas. Se agrupan en dos pestañas al estilo Xuper: directo y 24/7.
interface Provider {
  id: string;
  tab: TVTab;
  url: string;
}

const IPTV = "https://iptv-org.github.io/iptv";
const FAST = "https://raw.githubusercontent.com/BuddyChewChew/app-m3u-generator/main/playlists";
const TDT = "https://www.tdtchannels.com/lists"; // TDTChannels: proyecto abierto, canales FTA/TDT

const fast = (id: string, tab: TVTab, file: string): Provider => ({ id, tab, url: `${FAST}/${file}.m3u` });

export const PROVIDERS: Provider[] = [
  // ── En vivo — catálogo abierto completo + FTA + FAST ──
  { id: "iptv-all", tab: "live", url: `${IPTV}/index.m3u` }, // iptv-org COMPLETO (~13k canales)
  { id: "tdt-tv", tab: "live", url: `${TDT}/tv.m3u8` }, // TDTChannels España (FTA)
  fast("samsung-es", "live", "samsungtvplus_es"),
  fast("samsung-us", "live", "samsungtvplus_us"),
  fast("samsung-gb", "live", "samsungtvplus_gb"),
  fast("pluto-es", "live", "plutotv_es"),
  fast("pluto-mx", "live", "plutotv_mx"),
  fast("pluto-ar", "live", "plutotv_ar"),
  fast("pluto-cl", "live", "plutotv_cl"),
  fast("pluto-us", "live", "plutotv_us"),
  fast("roku-all", "live", "roku_all"),
  // ── 24/7 — canales de contenido en loop (single-title) ──
  fast("plex-all", "247", "plex_all"),
  fast("tubi-all", "247", "tubi_all"),
  // ── Radio — emisoras FTA (TDTChannels) ──
  { id: "tdt-radio", tab: "radio", url: `${TDT}/radio.m3u8` },
];

// ───────────────────────── Normalización de categorías ─────────────────────────
// group-title varía por proveedor (países, géneros, idiomas). Lo mapeamos a claves
// canónicas TRADUCIBLES (i18n live.cat.*). Orden importa: primera regla que casa gana.
const CATEGORY_RULES: [RegExp, string][] = [
  [/noticia|news|informa/i, "news"],
  [/deporte|sport|fútbol|futbol|soccer/i, "sports"],
  [/infantil|niñ|kids|children|cartoon/i, "kids"],
  [/anime|animaci|animation/i, "animation"],
  [/cine|movie|película|pelicula|film/i, "movies"],
  [/serie|series|novela|drama/i, "series"],
  [/document|cultura|culture|histor|ciencia|science/i, "documentary"],
  [/music|música|musica|mtv|radio/i, "music"],
  [/religi|fe |iglesia|church/i, "religious"],
  [/entreten|entertainment|variety|comedy|comedia|reality|life|estilo/i, "entertainment"],
];

export function categorize(group: string): string {
  const g = group.trim();
  if (!g) return "other";
  for (const [re, key] of CATEGORY_RULES) if (re.test(g)) return key;
  return "other";
}

// Detecta VOD vs live por URL (Xtream /movie/ /series/) o group-title.
export function detectKind(url: string, group: string): IPTVKind {
  if (/\/movie\//i.test(url)) return "movie";
  if (/\/series\//i.test(url)) return "series";
  const g = group.trim();
  if (/vod|pel[ií]cula|movie|cine|film|films/i.test(g) && !/canal|channel|live/i.test(g))
    return "movie";
  if (/^series?\b|serie[s]?\b|tv\s*shows?/i.test(g)) return "series";
  return "live";
}

// ───────────────────────── Limpieza de nombres ─────────────────────────
// Los nombres traen ruido: "(1080p)", "[Not 24/7]", "[Geo-blocked]". Extraemos la
// calidad y devolvemos un nombre limpio para mostrar (el original queda para buscar).
const QUALITY_RE = /\((\d{3,4}p|4k|hd|sd|uhd)\)/i;
const TAG_RE = /\[[^\]]*\]/g; // [Not 24/7], [Geo-blocked], etc.

export function cleanName(raw: string): { name: string; quality?: string } {
  const quality = raw.match(QUALITY_RE)?.[1]?.toUpperCase();
  const name = raw
    .replace(QUALITY_RE, "")
    .replace(TAG_RE, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { name: name || raw.trim(), quality };
}

// ───────────────────────── Parseo M3U ─────────────────────────
// ponytail: cubre M3U estándar y Xtream (get.php?type=m3u_plus devuelve un M3U).
export function parseM3U(text: string): IPTVChannel[] {
  const lines = text.split(/\r?\n/);
  const out: IPTVChannel[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("#EXTINF")) continue;
    const raw = line.split(",").pop()?.trim() || "—";
    const logo = line.match(/tvg-logo="([^"]*)"/)?.[1] ?? "";
    const group = line.match(/group-title="([^"]*)"/)?.[1] ?? "";
    let url = "";
    for (let j = i + 1; j < lines.length; j++) {
      const n = lines[j].trim();
      if (!n || n.startsWith("#")) continue;
      url = n;
      break;
    }
    if (!url) continue;
    const { name, quality } = cleanName(raw);
    const kind = detectKind(url, group);
    out.push({
      name,
      logo,
      group,
      url,
      category: categorize(group),
      quality,
      kind,
    });
  }
  return out;
}

// ───────────────────────── Descarga (vía proxy propio, evita CORS) ─────────────────────────
export async function fetchPlaylist(url: string): Promise<IPTVChannel[]> {
  const res = await fetch(`/api/iptv?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(String(res.status));
  const channels = parseM3U(await res.text());
  if (!channels.length) throw new Error("empty");
  return channels;
}

// Descarga y fusiona todos los proveedores de una pestaña; tolera fallos individuales.
// Dedupe por URL de stream (misma url = mismo canal), preservando el primero.
export async function fetchTab(tab: "live" | "247" | "radio"): Promise<IPTVChannel[]> {
  const urls = PROVIDERS.filter((p) => p.tab === tab).map((p) => p.url);
  const results = await Promise.allSettled(urls.map(fetchPlaylist));
  const seen = new Set<string>();
  const merged: IPTVChannel[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const c of r.value) {
      if (seen.has(c.url)) continue;
      seen.add(c.url);
      merged.push(c);
    }
  }
  if (!merged.length) throw new Error("empty");
  return merged;
}

// Fuente personalizada del usuario (opcional, si añade su propia lista).
export function saveSource(url: string) {
  m3uCache = null;
  localStorage.setItem(KEY, url);
}
export function getSource(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(KEY);
}
export function clearSource() {
  m3uCache = null;
  localStorage.removeItem(KEY);
}

// ───────────────────────── VOD (películas / series) ─────────────────────────
// Modelo Xuper: el catálogo lo trae la lista del usuario (Xtream API o M3U con /movie|/series).
// Sin fuente propia no hay VOD comercial — las listas "todo incluido" pirateadas no se integran.

function m3uAsCategories(items: IPTVChannel[]): IPTVCategory[] {
  const seen = new Map<string, string>();
  for (const c of items) {
    const id = c.group || c.category || "other";
    if (!seen.has(id)) seen.set(id, c.group || c.category || "other");
  }
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
}

async function fromM3U(kind: "movie" | "series"): Promise<{
  categories: IPTVCategory[];
  items: IPTVChannel[];
}> {
  const all = await loadCustomM3U();
  const items = all.filter((c) => c.kind === kind);
  if (!items.length) throw new Error("empty");
  return { categories: m3uAsCategories(items), items };
}

// Cache en memoria del M3U custom (re-parsear 10k+ líneas por categoría es absurdo).
let m3uCache: { url: string; items: IPTVChannel[] } | null = null;

async function loadCustomM3U(): Promise<IPTVChannel[]> {
  const src = getSource();
  if (!src) throw new Error("no source");
  if (m3uCache?.url === src) return m3uCache.items;
  const items = await fetchPlaylist(src);
  m3uCache = { url: src, items };
  return items;
}

export async function fetchVodCategories(
  tab: "movies" | "series"
): Promise<IPTVCategory[]> {
  const src = getSource();
  if (!src) throw new Error("no source");
  const creds = parseXtream(src);
  if (creds) {
    const list =
      tab === "movies" ? await xtreamVodCategories(creds) : await xtreamSeriesCategories(creds);
    if (list.length) return list;
  }
  const { categories } = await fromM3U(tab === "movies" ? "movie" : "series");
  return categories;
}

export async function fetchVodItems(
  tab: "movies" | "series",
  categoryId?: string
): Promise<IPTVChannel[]> {
  const src = getSource();
  if (!src) throw new Error("no source");
  const creds = parseXtream(src);
  if (creds) {
    const items =
      tab === "movies"
        ? await xtreamVodStreams(creds, categoryId)
        : await xtreamSeries(creds, categoryId);
    if (items.length) return items;
  }
  const { items } = await fromM3U(tab === "movies" ? "movie" : "series");
  if (!categoryId || categoryId === "__all__") return items;
  return items.filter((c) => (c.group || c.category) === categoryId);
}

export async function fetchEpisodes(seriesId: string): Promise<IPTVEpisode[]> {
  const src = getSource();
  if (!src) throw new Error("no source");
  const creds = parseXtream(src);
  if (!creds) throw new Error("not xtream");
  const eps = await xtreamSeriesInfo(creds, seriesId);
  if (!eps.length) throw new Error("empty");
  return eps;
}

export function getXtreamCreds(): XtreamCreds | null {
  const src = getSource();
  return src ? parseXtream(src) : null;
}

// ───────────────────────── Reproducción ─────────────────────────
export function proxied(url: string): string {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}

export function streamType(url: string): "hls" | "mpegts" | "file" {
  if (/\.m3u8(\?|#|$)/i.test(url)) return "hls";
  if (/\.ts(\?|#|$)/i.test(url)) return "mpegts";
  return "file";
}

// ponytail: self-check — parseo + limpieza + categoría.
if (process.env.NODE_ENV === "test") {
  const demo = `#EXTM3U
#EXTINF:-1 tvg-logo="http://x/a.png" group-title="Noticias",Canal A (1080p)
http://host/live/a.m3u8
#EXTINF:-1 group-title="Deportes",Canal B [Not 24/7]
http://host/live/b.ts`;
  const r = parseM3U(demo);
  console.assert(r.length === 2, "esperaba 2 canales");
  console.assert(r[0].name === "Canal A" && r[0].quality === "1080P", "limpieza nombre/calidad mal");
  console.assert(r[0].category === "news" && r[1].category === "sports", "categoría mal");
  console.assert(r[1].name === "Canal B", "no quitó [Not 24/7]");
  console.assert(r[0].kind === "live" && r[1].kind === "live", "kind live mal");
  const vod = parseM3U(`#EXTM3U
#EXTINF:-1 group-title="Movies",Film
http://h/movie/u/p/1.mp4`);
  console.assert(vod[0]?.kind === "movie", "detectKind movie mal");
}

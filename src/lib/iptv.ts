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
import { VOD_SOURCES } from "@/lib/vod-sources";

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
const iptvLang = (c: string): Provider => ({ id: `iptv-l-${c}`, tab: "live", url: `${IPTV}/languages/${c}.m3u` });
const iptvCountry = (c: string): Provider => ({ id: `iptv-${c}`, tab: "live", url: `${IPTV}/countries/${c}.m3u` });

// Orden = prioridad. El dedupe por URL conserva la PRIMERA aparición, así que poniendo las
// fuentes en español al principio, "En vivo" (destacados + primeras pantallas) sale en español
// y el catálogo global de iptv-org queda accesible por búsqueda/categoría más abajo.
export const PROVIDERS: Provider[] = [
  // ── En vivo — ESPAÑOL primero ──
  iptvLang("spa"), // iptv-org: todos los canales en español
  { id: "tdt-tv", tab: "live", url: `${TDT}/tv.m3u8` }, // TDTChannels España (FTA)
  ...["es", "mx", "ar", "co", "cl", "pe", "ve", "ec", "uy", "py", "bo", "cr", "pa", "do", "gt", "hn", "ni", "sv", "pr"].map(iptvCountry),
  fast("samsung-es", "live", "samsungtvplus_es"),
  fast("pluto-es", "live", "plutotv_es"),
  fast("pluto-mx", "live", "plutotv_mx"),
  fast("pluto-ar", "live", "plutotv_ar"),
  fast("pluto-cl", "live", "plutotv_cl"),
  // ── En vivo — resto del mundo (catálogo completo iptv-org + FAST) ──
  { id: "iptv-all", tab: "live", url: `${IPTV}/index.m3u` }, // iptv-org COMPLETO (~13k)
  fast("samsung-us", "live", "samsungtvplus_us"),
  fast("samsung-gb", "live", "samsungtvplus_gb"),
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
  seriesCache = null;
  vodM3uCache = null;
  localStorage.setItem(KEY, url);
}
export function getSource(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(KEY);
}
export function clearSource() {
  seriesCache = null;
  vodM3uCache = null;
  localStorage.removeItem(KEY);
}

// ¿Hay catálogo VOD disponible? Sí si el usuario fijó listas en vod-sources.ts
// o pegó una lista propia con el botón +.
export function hasVodSource(): boolean {
  return VOD_SOURCES.length > 0 || !!getSource();
}

// Listas M3U para VOD = las fijas (vod-sources.ts) + la personalizada si es M3U.
// (Una fuente Xtream se maneja por su API aparte, no como M3U.)
function m3uVodSources(): string[] {
  const custom = getSource();
  const list = [...VOD_SOURCES];
  if (custom && !parseXtream(custom)) list.push(custom);
  return Array.from(new Set(list.filter(Boolean)));
}

// Descarga y fusiona TODAS las listas M3U de VOD (tolera fallos individuales),
// dedupe por URL. Cache en memoria por combinación de fuentes.
let vodM3uCache: { key: string; items: IPTVChannel[] } | null = null;

async function loadVodM3U(): Promise<IPTVChannel[]> {
  const sources = m3uVodSources();
  if (!sources.length) throw new Error("no source");
  const key = sources.join("|");
  if (vodM3uCache?.key === key) return vodM3uCache.items;
  const results = await Promise.allSettled(sources.map(fetchPlaylist));
  const seen = new Set<string>();
  const items: IPTVChannel[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const c of r.value) {
      if (seen.has(c.url)) continue;
      seen.add(c.url);
      items.push(c);
    }
  }
  if (!items.length) throw new Error("empty");
  vodM3uCache = { key, items };
  return items;
}

// ───────────────────────── VOD (películas / series) ─────────────────────────
// Modelo Xuper: el catálogo lo trae la lista del usuario (Xtream API o M3U con /movie|/series).
// Sin fuente propia no hay VOD comercial — las listas "todo incluido" pirateadas no se integran.

// Categorías VOD desde M3U: usa la clave canónica normalizada (traducible i18n), NUNCA el
// group-title crudo (que viene compuesto con ";" y en inglés). El id = clave canónica; la UI
// lo traduce vía catLabel/live.cat.*.
function m3uAsCategories(items: IPTVChannel[]): IPTVCategory[] {
  const seen = new Set<string>();
  for (const c of items) seen.add(c.category || "other");
  const keys = Array.from(seen).sort((a, b) => (a === "other" ? 1 : b === "other" ? -1 : a.localeCompare(b)));
  return keys.map((k) => ({ id: k, name: k }));
}

async function fromM3U(kind: "movie" | "series"): Promise<{
  categories: IPTVCategory[];
  items: IPTVChannel[];
}> {
  const all = await loadVodM3U();
  const items = all.filter((c) => c.kind === kind);
  if (!items.length) throw new Error("empty");
  return { categories: m3uAsCategories(items), items };
}

// ── Series M3U: agrupar episodios sueltos en shows con temporadas ──────────
// Un M3U (m3u_plus de proveedor Xtream) lista CADA episodio como línea propia
// ("Breaking Bad S01E01"). Sin agrupar, la pestaña Series mostraría un póster por
// episodio. Aquí los juntamos por show → un póster por serie → panel de episodios
// (el mismo que usa Xtream, vía seriesId "m3u:<show>").
const SE_PATTERNS: RegExp[] = [
  /^(.*?)[\s._-]*s(\d{1,2})[\s._-]*e(\d{1,3})\b/i, // Show S01E02
  /^(.*?)[\s._-]+(\d{1,2})x(\d{1,3})\b/i, // Show 1x02
];

function parseEpisode(name: string): {
  show: string;
  season: number;
  episode: number;
  epTitle?: string;
} {
  for (const re of SE_PATTERNS) {
    const m = name.match(re);
    if (m) {
      const show = m[1].replace(/[\s._:-]+$/, "").trim();
      const rest = name.slice(m[0].length).replace(/^[\s._:-]+/, "").trim();
      return {
        show: show || name.trim(),
        season: Number(m[2]) || 1,
        episode: Number(m[3]) || 1,
        epTitle: rest || undefined,
      };
    }
  }
  // Sin patrón SxxExx → serie de un solo episodio (special / peli en pestaña series).
  return { show: name.trim(), season: 1, episode: 1 };
}

export function groupM3USeries(eps: IPTVChannel[]): {
  shows: IPTVChannel[];
  episodes: Map<string, IPTVEpisode[]>;
  categories: IPTVCategory[];
} {
  const map = new Map<string, { show: IPTVChannel; eps: IPTVEpisode[] }>();
  let auto = 0;
  for (const c of eps) {
    const { show, season, episode, epTitle } = parseEpisode(c.name);
    const key = show.toLowerCase();
    let entry = map.get(key);
    if (!entry) {
      entry = {
        show: {
          name: show,
          logo: c.logo,
          group: c.group,
          url: "",
          category: c.category || "other",
          kind: "series",
          seriesId: `m3u:${key}`,
        },
        eps: [],
      };
      map.set(key, entry);
    }
    if (!entry.show.logo && c.logo) entry.show.logo = c.logo;
    entry.eps.push({
      id: c.url || `${key}-${++auto}`,
      title: epTitle || `S${season}E${String(episode).padStart(2, "0")}`,
      season,
      episode,
      url: c.url,
    });
  }
  const shows: IPTVChannel[] = [];
  const episodes = new Map<string, IPTVEpisode[]>();
  for (const [key, entry] of map) {
    entry.eps.sort((a, b) => a.season - b.season || a.episode - b.episode);
    shows.push(entry.show);
    episodes.set(`m3u:${key}`, entry.eps);
  }
  shows.sort((a, b) => a.name.localeCompare(b.name));
  const catKeys = new Set(shows.map((s) => s.category || "other"));
  const categories = Array.from(catKeys)
    .sort((a, b) => (a === "other" ? 1 : b === "other" ? -1 : a.localeCompare(b)))
    .map((k) => ({ id: k, name: k }));
  return { shows, episodes, categories };
}

// Cache del agrupado (evita re-agrupar 10k+ líneas en cada interacción).
let seriesCache:
  | { url: string; shows: IPTVChannel[]; episodes: Map<string, IPTVEpisode[]>; categories: IPTVCategory[] }
  | null = null;

async function getM3USeries() {
  const src = getSource();
  if (!src) throw new Error("no source");
  if (seriesCache?.url === src) return seriesCache;
  const all = await loadVodM3U();
  const eps = all.filter((c) => c.kind === "series");
  if (!eps.length) throw new Error("empty");
  seriesCache = { url: src, ...groupM3USeries(eps) };
  return seriesCache;
}

export async function fetchVodCategories(
  tab: "movies" | "series"
): Promise<IPTVCategory[]> {
  const src = getSource();
  if (!hasVodSource()) throw new Error("no source");
  const creds = src ? parseXtream(src) : null;
  if (creds) {
    const list =
      tab === "movies" ? await xtreamVodCategories(creds) : await xtreamSeriesCategories(creds);
    if (list.length) return list;
  }
  if (tab === "series") return (await getM3USeries()).categories;
  const { categories } = await fromM3U("movie");
  return categories;
}

export async function fetchVodItems(
  tab: "movies" | "series",
  categoryId?: string
): Promise<IPTVChannel[]> {
  const src = getSource();
  if (!hasVodSource()) throw new Error("no source");
  const creds = src ? parseXtream(src) : null;
  if (creds) {
    const items =
      tab === "movies"
        ? await xtreamVodStreams(creds, categoryId)
        : await xtreamSeries(creds, categoryId);
    if (items.length) return items;
  }
  const items =
    tab === "series" ? (await getM3USeries()).shows : (await fromM3U("movie")).items;
  if (!categoryId || categoryId === "__all__") return items;
  return items.filter((c) => (c.category || "other") === categoryId);
}

export async function fetchEpisodes(seriesId: string): Promise<IPTVEpisode[]> {
  if (seriesId.startsWith("m3u:")) {
    const eps = (await getM3USeries()).episodes.get(seriesId);
    if (!eps?.length) throw new Error("empty");
    return eps;
  }
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

  // Agrupado de series M3U: 3 episodios de 2 shows → 2 series, orden por temporada/ep.
  const g = groupM3USeries(
    parseM3U(`#EXTM3U
#EXTINF:-1 group-title="Series",Breaking Bad S01E02
http://h/series/u/p/2.mp4
#EXTINF:-1 group-title="Series",Breaking Bad S01E01
http://h/series/u/p/1.mp4
#EXTINF:-1 group-title="Series",Dark 1x01
http://h/series/u/p/3.mp4`)
  );
  console.assert(g.shows.length === 2, "esperaba 2 series agrupadas");
  console.assert(g.episodes.get("m3u:breaking bad")?.length === 2, "esperaba 2 episodios BB");
  console.assert(g.episodes.get("m3u:breaking bad")?.[0].episode === 1, "episodios sin ordenar");
  console.assert(g.episodes.get("m3u:dark")?.[0].season === 1, "parseo 1x01 mal");
}

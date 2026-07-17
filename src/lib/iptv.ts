import type { IPTVChannel, TVTab } from "@/types";

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

// Helpers para no repetir la base de cada proveedor.
const iptvLang = (c: string): Provider => ({ id: `iptv-l-${c}`, tab: "live", url: `${IPTV}/languages/${c}.m3u` });
const iptvCountry = (c: string): Provider => ({ id: `iptv-${c}`, tab: "live", url: `${IPTV}/countries/${c}.m3u` });
const fast = (id: string, tab: TVTab, file: string): Provider => ({ id, tab, url: `${FAST}/${file}.m3u` });

export const PROVIDERS: Provider[] = [
  // ── En vivo — canales lineales FTA + FAST en directo ──
  iptvLang("spa"),
  iptvLang("eng"),
  // Países hispanohablantes (canales locales no cubiertos por el idioma)
  ...["mx", "es", "ar", "co", "cl", "pe", "ve", "ec", "uy", "py", "bo", "cr", "pa", "do", "gt", "hn", "ni", "sv", "pr", "us"].map(iptvCountry),
  // FAST en directo
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
    out.push({ name, logo, group, url, category: categorize(group), quality });
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
export async function fetchTab(tab: TVTab): Promise<IPTVChannel[]> {
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
  localStorage.setItem(KEY, url);
}
export function getSource(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(KEY);
}
export function clearSource() {
  localStorage.removeItem(KEY);
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
}

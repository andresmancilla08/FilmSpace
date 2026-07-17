import type { IPTVChannel } from "@/types";

const KEY = "filmspace.iptv.source";

// ponytail: cubre M3U estándar y Xtream (get.php?type=m3u_plus devuelve un M3U). Ampliar atributos si hace falta.
export function parseM3U(text: string): IPTVChannel[] {
  const lines = text.split(/\r?\n/);
  const out: IPTVChannel[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("#EXTINF")) continue;
    const name = line.split(",").pop()?.trim() || "—";
    const logo = line.match(/tvg-logo="([^"]*)"/)?.[1] ?? "";
    const group = line.match(/group-title="([^"]*)"/)?.[1] ?? "Otros";
    // la url es la siguiente línea que no sea comentario ni esté vacía
    let url = "";
    for (let j = i + 1; j < lines.length; j++) {
      const n = lines[j].trim();
      if (!n || n.startsWith("#")) continue;
      url = n;
      break;
    }
    if (url) out.push({ name, logo, group, url });
  }
  return out;
}

export function saveSource(url: string) {
  localStorage.setItem(KEY, url);
}
export function getSource(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(KEY);
}
export function clearSource() {
  localStorage.removeItem(KEY);
}

// Envuelve una URL de stream en el proxy propio (evita CORS de segmentos).
export function proxied(url: string): string {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}

export function streamType(url: string): "hls" | "mpegts" | "file" {
  if (/\.m3u8(\?|#|$)/i.test(url)) return "hls";
  if (/\.ts(\?|#|$)/i.test(url)) return "mpegts";
  return "file";
}

// Descarga la lista vía proxy propio para evitar el CORS del proveedor.
export async function fetchPlaylist(url: string): Promise<IPTVChannel[]> {
  const res = await fetch(`/api/iptv?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(String(res.status));
  const channels = parseM3U(await res.text());
  if (!channels.length) throw new Error("empty");
  return channels;
}

// ponytail: self-check — parseo mínimo M3U.
if (process.env.NODE_ENV === "test") {
  const demo = `#EXTM3U
#EXTINF:-1 tvg-logo="http://x/a.png" group-title="Noticias",Canal A
http://host/live/a.m3u8
#EXTINF:-1 group-title="Deportes",Canal B
http://host/live/b.ts`;
  const r = parseM3U(demo);
  console.assert(r.length === 2, "esperaba 2 canales");
  console.assert(r[0].group === "Noticias" && r[0].url.endsWith("a.m3u8"), "parseo canal A mal");
}

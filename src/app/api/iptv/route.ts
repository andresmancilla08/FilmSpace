import { NextRequest } from "next/server";

// Proxy server-side: descarga el texto de la lista M3U/Xtream (evita CORS del navegador).
// Seguridad: la URL la da el usuario → bloqueamos hosts internos para no abrir un SSRF.
// ponytail: filtro por hostname literal; no resuelve DNS (no cubre rebinding). Suficiente para app personal.
function isBlocked(host: string): boolean {
  return /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|::1)/i.test(host) || host.endsWith(".internal");
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new Response("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new Response("invalid url", { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new Response("protocol not allowed", { status: 400 });
  }
  if (isBlocked(target.hostname)) {
    return new Response("host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(target, {
      // muchos proveedores exigen un User-Agent de reproductor
      headers: { "User-Agent": "VLC/3.0.20 LibVLC/3.0.20" },
      // VOD Xtream (get_vod_streams) puede ser grande; 60s evita cortes en catálogos densos
      signal: AbortSignal.timeout(60000),
    });
    if (!upstream.ok) return new Response(`upstream ${upstream.status}`, { status: 502 });
    return new Response(await upstream.text(), {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new Response("fetch failed", { status: 502 });
  }
}

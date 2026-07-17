import { NextRequest } from "next/server";

// Proxy de stream: reenvía segmentos/manifiestos del proveedor IPTV (evita CORS).
// Seguridad: URL de usuario → bloqueamos hosts internos (mismo criterio que /api/iptv).
// ponytail: filtro por hostname literal, no resuelve DNS (no cubre rebinding). OK para app personal.
// ADVERTENCIA: todo el vídeo pasa por aquí → consume banda/CPU de Vercel (coste real a escala).
function isBlocked(host: string): boolean {
  return /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|::1)/i.test(host) || host.endsWith(".internal");
}

const PROXY = "/api/stream?url=";
const UA = "VLC/3.0.20 LibVLC/3.0.20";

function parse(raw: string | null): URL | Response {
  if (!raw) return new Response("missing url", { status: 400 });
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("invalid url", { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:")
    return new Response("protocol not allowed", { status: 400 });
  if (isBlocked(target.hostname)) return new Response("host not allowed", { status: 403 });
  return target;
}

// Reescribe las líneas de un manifiesto HLS para que los segmentos también pasen por el proxy.
// ponytail: cubre URIs de segmentos y de tags (KEY/MAP). Resuelve relativas contra el manifiesto.
function rewriteManifest(text: string, base: URL): string {
  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return line;
      if (t.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, u) => `URI="${PROXY}${encodeURIComponent(new URL(u, base).toString())}"`);
      }
      return `${PROXY}${encodeURIComponent(new URL(t, base).toString())}`;
    })
    .join("\n");
}

export async function GET(req: NextRequest) {
  const target = parse(req.nextUrl.searchParams.get("url"));
  if (target instanceof Response) return target;

  const range = req.headers.get("range");
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: { "User-Agent": UA, ...(range ? { Range: range } : {}) },
    });
  } catch {
    return new Response("fetch failed", { status: 502 });
  }
  if (!upstream.ok && upstream.status !== 206)
    return new Response(`upstream ${upstream.status}`, { status: 502 });

  const ct = upstream.headers.get("content-type") ?? "";
  const isManifest =
    /mpegurl/i.test(ct) || /\.m3u8(\?|#|$)/i.test(target.pathname);

  if (isManifest) {
    const rewritten = rewriteManifest(await upstream.text(), target);
    return new Response(rewritten, {
      headers: { "content-type": "application/vnd.apple.mpegurl", "cache-control": "no-store" },
    });
  }

  // Binario (segmentos .ts / stream continuo): reenviar tal cual con soporte de Range.
  const headers = new Headers();
  for (const h of ["content-type", "content-length", "accept-ranges", "content-range"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("cache-control", "no-store");
  return new Response(upstream.body, { status: upstream.status, headers });
}

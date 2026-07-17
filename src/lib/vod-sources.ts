// ─────────────────────────────────────────────────────────────────────────
//  TUS LISTAS DE PELÍCULAS Y SERIES (M3U)
// ─────────────────────────────────────────────────────────────────────────
//  Pega aquí tus URLs M3U. UNA por línea, entre comillas, terminada en coma.
//  Puedes poner las que quieras (listas de pelis, de series o mixtas): el
//  catálogo detecta solo qué es película y qué es serie por la URL/grupo.
//
//  ⚠️  SOLO edita las URLs de abajo. No toques nada más de este archivo.
//  Se cargan automáticamente al abrir Películas / Series (sin el botón +).
//
//  Ejemplo:
//    "http://mi-proveedor.com/get.php?username=USUARIO&password=CLAVE&type=m3u_plus",
// ─────────────────────────────────────────────────────────────────────────

export const VOD_SOURCES: string[] = [
  // 👇 Pega tus URLs aquí:

  // ── iptv-org: índice general (todos los canales) ──
  "https://iptv-org.github.io/iptv/index.m3u",

  // ── iptv-org: categorías con contenido de películas y series ──
  "https://iptv-org.github.io/iptv/categories/movies.m3u",
  "https://iptv-org.github.io/iptv/categories/series.m3u",
  "https://iptv-org.github.io/iptv/categories/classic.m3u",
  "https://iptv-org.github.io/iptv/categories/comedy.m3u",
  "https://iptv-org.github.io/iptv/categories/documentary.m3u",
  "https://iptv-org.github.io/iptv/categories/animation.m3u",
  "https://iptv-org.github.io/iptv/categories/family.m3u",
  "https://iptv-org.github.io/iptv/categories/kids.m3u",
  "https://iptv-org.github.io/iptv/categories/entertainment.m3u",
];

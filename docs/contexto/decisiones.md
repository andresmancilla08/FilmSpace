# Decisiones

### Diseño no-tradicional — Vigente (REGLA GLOBAL)
- **Qué:** romper con patrones de streaming convencionales en cada pantalla.
- **Por qué:** diferenciación de producto; experiencia cinematográfica.
- **Descartado:** carruseles/filas estilo Netflix por defecto.

### i18n con next-intl — Bajo revisión
- **Qué:** el proyecto usa next-intl.
- **Nota:** la preferencia global del usuario es react-i18next (i18next). Discrepancia a resolver: migrar o ratificar next-intl aquí.

### Aceternity UI — Vigente
- **Por qué:** componentes animados premium acordes a la dirección visual.

### IPTV / TV en vivo + VOD (estilo Xuper) — Vigente
- **Qué:** módulo `/live` con En vivo, 24/7, Películas y Series. Live/24-7 desde FAST libres; VOD desde la lista del usuario (Xtream `player_api` o M3U con `/movie`/`/series`).
- **Por qué:** el usuario quería "su propio Xuper" multi-dispositivo. El catálogo completo de pelis/series lo aporta el proveedor (igual que Xuper), no se embebe contenido pirata.
- **Xtream:** `get_vod_streams` / `get_series` / `get_series_info`; carga por categoría para no tumbar el proxy con catálogos enormes.
- **Unificación M3U:** un solo input de URL cubre M3U y Xtream (Xtream expone `get.php?type=m3u_plus` y `player_api.php`).
- **Reproducción:** `hls.js` para `.m3u8` y `mpegts.js` para `.ts` (Xtream), carga dinámica solo al reproducir. Nativo en Safari/iOS. VOD sin badge "en vivo" (seek permitido).
- **CORS/coste:** player intenta **directo primero**; solo cae a `/api/stream` (proxy) si el navegador bloquea.
- **Descartado:** app nativa Expo; TiviMate; listas "todo incluido" pirata.
- **Estado:** live + VOD/series funcionales; falta pase del equipo visual y arte de iconos PWA.

### Agrupado de series en M3U puro — Vigente
- **Qué:** un M3U (m3u_plus) lista cada episodio como línea suelta ("Show S01E02"). `groupM3USeries()` (en `src/lib/iptv.ts`) detecta patrones `SxxExx` / `NxNN`, agrupa por nombre de show y sintetiza un `seriesId` `m3u:<show>`, reusando el mismo panel de temporadas/episodios que Xtream.
- **Por qué:** sin fuente Xtream, la pestaña Series mostraba un póster por episodio en vez de por serie. El usuario opera solo con M3U.
- **Cómo engancha:** `fetchVodItems("series")` → `shows`; `fetchEpisodes("m3u:...")` → episodios cacheados. La UI (`LiveTV.tsx`) no cambió: ya navegaba por `seriesId`.
- **Descartado:** parsear nombres con IA / TMDB matching (innecesario para agrupar; los patrones SxxExx cubren la mayoría de proveedores).

### PWA instalable — Vigente
- **Qué:** `app/manifest.ts` + `app/icon.tsx` + `app/apple-icon.tsx` (iconos generados por código, placeholder) + `appleWebApp` en metadata.
- **Por qué:** instalable en iPhone/iPad/Android como app sin tiendas ni coste.

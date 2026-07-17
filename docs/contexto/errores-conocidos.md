# Errores Conocidos

### Diseño "se ve genérico"
- **A propósito evitarlo:** la regla es romper patrones Netflix/Disney+. Si una pantalla se ve convencional, está mal.

### i18n: dos librerías posibles
- **Síntoma:** confusión entre next-intl (actual) y la preferencia global react-i18next. **Solución:** decidir y documentar; hoy el proyecto usa next-intl.

- TODO: registrar gotchas reales de Google TV / D-pad conforme aparezcan.

### IPTV: streams `.ts` no reproducen en navegador sin mpegts.js
- **Síntoma:** un canal Xtream `.ts` no arranca. **Causa:** el navegador no reproduce MPEG-TS crudo. **Solución:** ya se usa `mpegts.js` (carga dinámica) para `.ts`; para `.m3u8` se usa `hls.js`. Safari/iOS reproduce HLS nativo.

### IPTV: la lista carga pero el vídeo no (CORS)
- **Síntoma:** los canales aparecen pero al darle play falla. **Causa:** el proveedor no envía cabeceras CORS y el navegador bloquea los segmentos. **Solución (a propósito):** el player intenta directo y, si falla, reintenta vía `/api/stream` (proxy). Si aun así falla, la fuente no sirve para web.
- **Coste:** todo lo que pase por `/api/stream` consume banda/CPU de Vercel. Vídeo pesa (~2-4 GB/h HD) → uso intensivo puede superar el plan gratis. Por eso el proxy es último recurso, no la vía por defecto.

### Catálogo: la app no trae contenido (igual que Xuper)
- **A propósito:** FilmSpace/Xuper son reproductores; el catálogo lo trae la lista del usuario. Fuentes legales: IPTV-org y FAST gratis (Pluto, Samsung TV Plus, RTVE…) para TV; Internet Archive (ya integrado en `lib/archive.ts`) y Jellyfin propio para pelis/series. Las listas "todo incluido" de pago barato son pirata (ilegal).

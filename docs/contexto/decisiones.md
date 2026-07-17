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

### IPTV / TV en vivo (estilo Xuper) — Vigente
- **Qué:** módulo `/live` que carga listas M3U/Xtream y reproduce canales.
- **Por qué:** el usuario quería "su propio Xuper" multi-dispositivo para uso familiar.
- **Unificación M3U:** un solo input de URL cubre M3U y Xtream (Xtream expone `get.php?type=m3u_plus` que devuelve un M3U). Sin dos rutas de código.
- **Reproducción:** `hls.js` para `.m3u8` y `mpegts.js` para `.ts` (Xtream), carga dinámica solo al reproducir. Nativo en Safari/iOS.
- **CORS/coste:** player intenta **directo primero**; solo cae a `/api/stream` (proxy) si el navegador bloquea. Minimiza banda de Vercel (coste real si todo pasara por proxy).
- **Descartado:** app nativa Expo (mejor en TV pero Apple cobra 99 $/año o caduca a 7 días; el usuario quiere 0 €). TiviMate (no es "suyo").
- **Estado:** funcional; falta pase del equipo visual y arte de iconos PWA.

### PWA instalable — Vigente
- **Qué:** `app/manifest.ts` + `app/icon.tsx` + `app/apple-icon.tsx` (iconos generados por código, placeholder) + `appleWebApp` en metadata.
- **Por qué:** instalable en iPhone/iPad/Android como app sin tiendas ni coste.

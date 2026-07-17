/* eslint-disable @next/next/no-img-element */
// Mark de marca FilmSpace para iconos (favicon, PWA, apple-touch). SVG nítido y escalable,
// renderizado por next/og (Satori). Concepto: play de streaming + órbita ("space"), rojo
// FilmSpace #E50914 sobre base oscura. Un solo dibujo, escalado por tamaño.
export function BrandIcon({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tile" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1c0d11" />
            <stop offset="1" stopColor="#070708" />
          </linearGradient>
          <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
            gradientTransform="translate(372 392) scale(260)">
            <stop offset="0" stopColor="#E50914" stopOpacity="0.55" />
            <stop offset="1" stopColor="#E50914" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="play" x1="200" y1="150" x2="360" y2="362" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF4D57" />
            <stop offset="1" stopColor="#E50914" />
          </linearGradient>
        </defs>

        {/* Base */}
        <rect x="0" y="0" width="512" height="512" rx="116" fill="url(#tile)" />
        <rect x="0" y="0" width="512" height="512" rx="116" fill="url(#glow)" />

        {/* Órbita (space) */}
        <circle cx="256" cy="256" r="168" fill="none" stroke="#E50914" strokeOpacity="0.22" strokeWidth="6" />
        <ellipse cx="256" cy="256" rx="196" ry="86" fill="none" stroke="#ffffff" strokeOpacity="0.10"
          strokeWidth="4" transform="rotate(-28 256 256)" />
        <circle cx="404" cy="150" r="9" fill="#ffffff" fillOpacity="0.5" />

        {/* Play */}
        <path d="M214 168 L214 344 Q214 360 229 352 L360 268 Q374 258 360 249 L229 160 Q214 152 214 168 Z"
          fill="url(#play)" stroke="#FF6B73" strokeOpacity="0.35" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

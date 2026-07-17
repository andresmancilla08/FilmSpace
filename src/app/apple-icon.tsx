import { ImageResponse } from "next/og";

// Icono para "Añadir a pantalla de inicio" en iOS. ponytail: placeholder, sustituir por arte real.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#E50914",
          fontSize: 120,
          fontWeight: 800,
        }}
      >
        F
      </div>
    ),
    { ...size }
  );
}

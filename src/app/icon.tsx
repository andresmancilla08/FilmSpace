import { ImageResponse } from "next/og";

// Icono generado por código (placeholder). ponytail: sustituir por arte real del equipo visual.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 340,
          fontWeight: 800,
        }}
      >
        F
      </div>
    ),
    { ...size }
  );
}

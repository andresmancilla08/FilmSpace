import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

// Icono para "Añadir a pantalla de inicio" en iOS (mark de marca FilmSpace).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<BrandIcon size={180} />, { ...size });
}

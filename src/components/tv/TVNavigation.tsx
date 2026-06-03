"use client";
import { useDpad } from "@/hooks/useDpad";

// Mounts the global D-pad navigation listener. Renders nothing.
export function TVNavigation() {
  useDpad();
  return null;
}

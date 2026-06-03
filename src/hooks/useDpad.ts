"use client";
import { useEffect } from "react";

// Selects all interactive elements except those inside a [data-player] container
const INTERACTIVE = 'button:not([disabled]), a[href], [data-dpad], input, select';

function centerOf(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function isVisible(el: HTMLElement) {
  if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function useDpad(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!arrows.includes(e.key)) return;

      // Let the video player handle its own navigation
      if ((e.target as Element)?.closest("[data-player]")) return;

      const all = (Array.from(document.querySelectorAll(INTERACTIVE)) as HTMLElement[]).filter(
        (el) => !el.closest("[data-player]") && isVisible(el)
      );

      if (!all.length) return;

      const focused = document.activeElement as HTMLElement;

      if (!focused || !all.includes(focused)) {
        all[0].focus();
        e.preventDefault();
        return;
      }

      const { x: cx, y: cy } = centerOf(focused);

      const candidates = all
        .filter((el) => el !== focused)
        .map((el) => {
          const { x, y } = centerOf(el);
          const dx = x - cx;
          const dy = y - cy;
          return { el, dx, dy, dist: Math.hypot(dx, dy) };
        });

      const inDirection = candidates.filter(({ dx, dy }) => {
        switch (e.key) {
          case "ArrowRight": return dx > 4 && Math.abs(dy) < Math.abs(dx) * 2.5;
          case "ArrowLeft":  return dx < -4 && Math.abs(dy) < Math.abs(dx) * 2.5;
          case "ArrowDown":  return dy > 4 && Math.abs(dx) < Math.abs(dy) * 2.5;
          case "ArrowUp":    return dy < -4 && Math.abs(dx) < Math.abs(dy) * 2.5;
        }
        return false;
      });

      if (!inDirection.length) return;

      const nearest = inDirection.reduce((a, b) => (a.dist < b.dist ? a : b));
      nearest.el.focus();
      nearest.el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      e.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [enabled]);
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  IconPlayerPlayFilled,
  IconBroadcast,
  IconSearch,
  IconReload,
  IconAlertTriangle,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  fetchTab,
  fetchPlaylist,
  getSource,
  saveSource,
  clearSource,
  proxied,
  streamType,
} from "@/lib/iptv";
import type { IPTVChannel, TVTab } from "@/types";
import { VideoPlayer } from "@/components/player/VideoPlayer";

const MAX_VISIBLE = 600; // techo de render; el filtro por categoría/búsqueda acota
const FEATURED = 3; // destacados en el rail superior
// Gradientes cinematográficos para el rail de destacados (rota por índice).
const FEAT_BG = [
  "linear-gradient(135deg,#2a0d10,#141414)",
  "linear-gradient(135deg,#1a1030,#141414)",
  "linear-gradient(135deg,#0d2030,#141414)",
];

type Tab = TVTab | "custom";

export function LiveTV() {
  const t = useTranslations("live");

  const [tab, setTab] = useState<Tab>("live");
  const [cache, setCache] = useState<Record<string, IPTVChannel[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState("__all__");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<IPTVChannel | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  const channels = cache[tab] ?? [];

  // Carga perezosa por pestaña (una vez). Directo/24-7 desde proveedores; custom desde la URL del usuario.
  async function loadTab(which: Tab, customSrc?: string) {
    if (cache[which]) {
      setTab(which);
      return;
    }
    setTab(which);
    setLoading(true);
    setError(false);
    try {
      const list =
        which === "custom"
          ? await fetchPlaylist(customSrc ?? getSource() ?? "")
          : await fetchTab(which);
      setCache((c) => ({ ...c, [which]: list }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // Autocarga al entrar: pestaña "En vivo".
  useEffect(() => {
    loadTab("live");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar de pestaña, resetea filtros.
  function switchTab(which: Tab) {
    if (which === tab) return;
    setCategory("__all__");
    setQuery("");
    loadTab(which);
  }

  // Categorías presentes con su conteo, ordenadas por volumen ("Otros" siempre al final).
  const categories = useMemo(() => {
    const count = new Map<string, number>();
    channels.forEach((c) => count.set(c.category, (count.get(c.category) ?? 0) + 1));
    const keys = Array.from(count.keys()).sort((a, b) => {
      if (a === "other") return 1;
      if (b === "other") return -1;
      return (count.get(b) ?? 0) - (count.get(a) ?? 0);
    });
    return { list: ["__all__", ...keys], count };
  }, [channels]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return channels.filter(
      (c) =>
        (category === "__all__" || c.category === category) &&
        (!q || c.name.toLowerCase().includes(q))
    );
  }, [channels, category, query]);

  const visible = filtered.slice(0, MAX_VISIBLE);
  // Destacados: primeros canales con logo (más presentables), solo en vista limpia.
  const showFeatured = category === "__all__" && !query.trim() && tab !== "custom";
  const featured = useMemo(
    () => (showFeatured ? channels.filter((c) => c.logo).slice(0, FEATURED) : []),
    [channels, showFeatured]
  );

  const catLabel = (key: string) =>
    key === "__all__" ? t("cat.all") : t.has(`cat.${key}`) ? t(`cat.${key}`) : key;

  async function submitCustom() {
    const u = customUrl.trim();
    if (!u) return;
    saveSource(u);
    setAddOpen(false);
    setCache((c) => ({ ...c, custom: undefined as unknown as IPTVChannel[] }));
    await loadTab("custom", u);
  }

  // ── Reproductor a pantalla completa ──────────────────────────────
  if (current) {
    return (
      <div className="fixed inset-0 z-[60] bg-black">
        <VideoPlayer
          title={current.name}
          subtitle={catLabel(current.category)}
          backHref="#"
          live
          videoUrl={current.url}
          proxyUrl={proxied(current.url)}
          streamType={streamType(current.url)}
          onClose={() => setCurrent(null)}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-4 pt-24 pb-16 md:px-8 tv:px-16 tv:pt-28">
      {/* Fondo cinematográfico */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 12% -8%, rgba(229,9,20,.16), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(229,9,20,.07), transparent 55%)",
        }}
      />

      <div className="mx-auto max-w-[1500px]">
        {/* Header editorial */}
        <header className="mb-6 flex items-end gap-4">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-white/35">
              FilmSpace · TV
            </p>
            <h1 className="text-4xl font-black leading-none tracking-tight sm:text-5xl tv:text-6xl">
              {tab === "247" ? t("tab247") : tab === "custom" ? t("myList") : t("tabLive")}
            </h1>
          </div>
          {channels.length > 0 && (
            <div className="ml-auto text-right">
              <div className="text-2xl font-extrabold text-primary tabular-nums tv:text-4xl">
                {filtered.length.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                {t("channelsLabel")}
              </div>
            </div>
          )}
        </header>

        {/* Barra: tabs segmentados + búsqueda + añadir */}
        <div className="mb-7 flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            className="inline-flex rounded-full border border-white/10 bg-surface p-1.5"
          >
            {(
              [
                ["live", t("tabLive"), true],
                ["247", t("tab247"), false],
                ...(cache.custom ? [["custom", t("myList"), false] as const] : []),
              ] as const
            ).map(([key, label, dot]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                data-dpad
                onClick={() => switchTab(key as Tab)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold tracking-tight transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  tab === key
                    ? "bg-primary text-white shadow-[0_6px_20px_rgba(229,9,20,0.35)]"
                    : "text-white/55 hover:text-white"
                )}
              >
                {dot && tab === key && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                )}
                {label}
              </button>
            ))}
          </div>

          <div className="relative ml-auto">
            <IconSearch
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="w-44 rounded-full border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none md:w-72"
            />
          </div>
          <button
            data-dpad
            onClick={() => setAddOpen((v) => !v)}
            aria-label={t("addList")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-surface text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {addOpen ? <IconX size={18} /> : <IconPlus size={18} />}
          </button>
        </div>

        {/* Añadir lista propia (revelable) */}
        {addOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitCustom();
            }}
            className="mb-7 flex flex-wrap items-center gap-2"
          >
            <input
              type="url"
              inputMode="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder={t("urlPlaceholder")}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!customUrl.trim()}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-transform duration-150 active:scale-95 disabled:opacity-40"
            >
              {t("load")}
            </button>
          </form>
        )}

        {/* Estados */}
        {loading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-primary tv:h-16 tv:w-16" />
            <p className="text-sm text-white/50">{t("loading")}</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <IconAlertTriangle size={28} className="text-primary" />
            <p className="text-sm text-white/60">{t("error")}</p>
            <button
              onClick={() => {
                clearSource();
                setCache((c) => ({ ...c, [tab]: undefined as unknown as IPTVChannel[] }));
                loadTab(tab);
              }}
              className="mt-1 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white active:scale-95"
            >
              {t("load")}
            </button>
          </div>
        ) : (
          <>
            {/* Rail de destacados */}
            {featured.length > 0 && (
              <section className="mb-8">
                <p className="mb-3 ml-0.5 text-[11px] font-extrabold uppercase tracking-[0.25em] text-white/35">
                  {t("featured")}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((c, i) => (
                    <motion.button
                      key={`feat-${c.url}`}
                      onClick={() => setCurrent(c)}
                      data-dpad
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.04 }}
                      className="group relative h-44 overflow-hidden rounded-2xl border border-white/[0.07] text-left transition-transform duration-150 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary tv:h-52"
                      style={{ background: FEAT_BG[i % FEAT_BG.length] }}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-0 opacity-70"
                        style={{
                          background:
                            "radial-gradient(400px 200px at 85% 120%, rgba(229,9,20,.32), transparent 70%)",
                        }}
                      />
                      <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        {t("live")}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.logo}
                        alt=""
                        loading="lazy"
                        className="absolute right-4 top-4 h-9 w-auto max-w-[38%] object-contain opacity-90"
                        onError={(e) => ((e.currentTarget.style.display = "none"))}
                      />
                      <span className="absolute inset-x-5 bottom-4">
                        <span className="block truncate text-xl font-black tracking-tight tv:text-2xl">
                          {c.name}
                        </span>
                        <span className="mt-0.5 block text-xs font-semibold text-white/55">
                          {catLabel(c.category)}
                          {c.quality ? ` · ${c.quality}` : ""}
                        </span>
                      </span>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* Pills de categoría */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.list.map((key) => {
                const on = category === key;
                const n = key === "__all__" ? channels.length : categories.count.get(key) ?? 0;
                return (
                  <button
                    key={key}
                    data-dpad
                    onClick={() => setCategory(key)}
                    className={cn(
                      "flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      on
                        ? "border-white bg-white text-bg"
                        : "border-white/[0.06] bg-surface text-white/60 hover:text-white"
                    )}
                  >
                    {catLabel(key)}
                    <span
                      className={cn(
                        "rounded-full px-2 py-px text-[11px] font-extrabold tabular-nums",
                        on ? "bg-black/10 text-black/55" : "bg-white/10 text-white/60"
                      )}
                    >
                      {n.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Grid de canales */}
            {filtered.length === 0 ? (
              <p className="py-16 text-center text-white/40">{t("noChannels")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 tv:grid-cols-8 tv:gap-4">
                {visible.map((c, i) => (
                  <motion.button
                    key={`${c.url}-${i}`}
                    onClick={() => setCurrent(c)}
                    data-dpad
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(i * 0.008, 0.25) }}
                    className={cn(
                      "group relative flex aspect-square flex-col overflow-hidden rounded-2xl border text-left",
                      "border-white/[0.06] bg-surface transition-all duration-150",
                      "hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_0_1px_rgba(229,9,20,0.35),0_14px_34px_rgba(229,9,20,0.2)]",
                      "focus-visible:-translate-y-1 focus-visible:border-primary/60 focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_rgba(229,9,20,0.45),0_14px_34px_rgba(229,9,20,0.25)]"
                    )}
                  >
                    <div
                      className="flex flex-1 items-center justify-center p-3"
                      style={{
                        background:
                          "radial-gradient(120px 90px at 50% 32%, rgba(255,255,255,.05), transparent 70%)",
                      }}
                    >
                      {c.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.logo}
                          alt=""
                          loading="lazy"
                          className="max-h-14 w-auto max-w-full object-contain tv:max-h-20"
                          onError={(e) => {
                            const el = e.currentTarget;
                            el.style.display = "none";
                            el.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <span
                        className={cn(
                          "px-1 text-center text-sm font-extrabold leading-tight text-white/85",
                          c.logo && "hidden"
                        )}
                      >
                        {c.name}
                      </span>
                    </div>
                    <div className="bg-gradient-to-t from-black/40 to-transparent px-3 pb-3 pt-2">
                      <span className="block truncate text-[12.5px] font-bold text-white/90 tv:text-sm">
                        {c.name}
                      </span>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wide text-[#ff4d4d]">
                          <span className="h-[5px] w-[5px] rounded-full bg-[#ff4d4d]" />
                          {t("live")}
                        </span>
                        {c.quality && (
                          <span className="rounded bg-white/[0.08] px-1.5 py-px text-[9.5px] font-extrabold tracking-wide text-white/55">
                            {c.quality}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                      <IconPlayerPlayFilled size={30} className="text-primary" />
                    </span>
                  </motion.button>
                ))}
              </div>
            )}

            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-white/25">
              <IconBroadcast size={13} />
              {t("legal")}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

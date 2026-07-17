"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  IconPlayerPlayFilled,
  IconBroadcast,
  IconSearch,
  IconAlertTriangle,
  IconPlus,
  IconX,
  IconMovie,
  IconDeviceTvOld,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  fetchTab,
  fetchPlaylist,
  fetchVodCategories,
  fetchVodItems,
  fetchEpisodes,
  getSource,
  saveSource,
  clearSource,
  proxied,
  streamType,
} from "@/lib/iptv";
import type { IPTVCategory, IPTVChannel, IPTVEpisode, TVTab } from "@/types";
import { VideoPlayer } from "@/components/player/VideoPlayer";

const MAX_VISIBLE = 600;
const FEATURED = 3;
const FEAT_BG = [
  "linear-gradient(135deg,#2a0d10,#141414)",
  "linear-gradient(135deg,#1a1030,#141414)",
  "linear-gradient(135deg,#0d2030,#141414)",
];

type Tab = TVTab | "custom";
type VodTab = "movies" | "series";

function isVod(tab: Tab): tab is VodTab {
  return tab === "movies" || tab === "series";
}

export function LiveTV() {
  const t = useTranslations("live");

  const [tab, setTab] = useState<Tab>("live");
  const [cache, setCache] = useState<Record<string, IPTVChannel[]>>({});
  const [vodCats, setVodCats] = useState<Record<string, IPTVCategory[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"load" | "nosource" | null>(null);
  const [category, setCategory] = useState("__all__");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<IPTVChannel | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [hasSource, setHasSource] = useState(false);

  // Serie seleccionada → panel de episodios
  const [seriesPick, setSeriesPick] = useState<IPTVChannel | null>(null);
  const [episodes, setEpisodes] = useState<IPTVEpisode[]>([]);
  const [epLoading, setEpLoading] = useState(false);
  const [epError, setEpError] = useState(false);
  const [playingEp, setPlayingEp] = useState<IPTVEpisode | null>(null);

  const channels = cache[cacheKey(tab, category)] ?? cache[tab] ?? [];
  const rawCats = tab === "247" || tab === "radio" || isVod(tab);
  const bucketOf = (c: IPTVChannel) => (rawCats ? c.group || c.category || "other" : c.category);

  function cacheKey(which: Tab, cat: string) {
    return isVod(which) ? `${which}:${cat}` : which;
  }

  async function loadTab(which: Tab, customSrc?: string, cat = "__all__") {
    setTab(which);
    setError(null);

    if (isVod(which)) {
      if (!getSource()) {
        setHasSource(false);
        setError("nosource");
        setLoading(false);
        return;
      }
      setHasSource(true);
      const key = cacheKey(which, cat);
      if (cache[key] && vodCats[which]) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let cats = vodCats[which];
        if (!cats) {
          cats = await fetchVodCategories(which);
          setVodCats((v) => ({ ...v, [which]: cats! }));
        }
        // Carga por categoría (Xtream puede tener +10k títulos; no bajamos todo de golpe)
        const pick = cat !== "__all__" ? cat : cats[0]?.id ?? "__all__";
        setCategory(pick);
        const list = await fetchVodItems(which, pick);
        setCache((c) => ({ ...c, [cacheKey(which, pick)]: list }));
      } catch {
        setError("load");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (cache[which]) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list =
        which === "custom"
          ? await fetchPlaylist(customSrc ?? getSource() ?? "")
          : await fetchTab(which as "live" | "247" | "radio");
      setCache((c) => ({ ...c, [which]: list }));
    } catch {
      setError("load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setHasSource(!!getSource());
    loadTab("live");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchTab(which: Tab) {
    if (which === tab) return;
    setCategory("__all__");
    setQuery("");
    setSeriesPick(null);
    loadTab(which);
  }

  async function changeVodCategory(catId: string) {
    setCategory(catId);
    setQuery("");
    if (!isVod(tab)) return;
    const key = cacheKey(tab, catId);
    if (cache[key]) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchVodItems(tab, catId);
      setCache((c) => ({ ...c, [key]: list }));
    } catch {
      setError("load");
    } finally {
      setLoading(false);
    }
  }

  const vodCategoryList = isVod(tab) ? vodCats[tab] ?? [] : [];

  const categories = useMemo(() => {
    if (isVod(tab) && vodCategoryList.length) {
      return {
        list: vodCategoryList.map((c) => c.id),
        count: new Map(vodCategoryList.map((c) => [c.id, 0] as const)),
        names: new Map(vodCategoryList.map((c) => [c.id, c.name] as const)),
      };
    }
    const count = new Map<string, number>();
    channels.forEach((c) => {
      const k = bucketOf(c);
      count.set(k, (count.get(k) ?? 0) + 1);
    });
    const keys = Array.from(count.keys()).sort((a, b) => {
      if (a === "other") return 1;
      if (b === "other") return -1;
      return (count.get(b) ?? 0) - (count.get(a) ?? 0);
    });
    return { list: ["__all__", ...keys], count, names: new Map<string, string>() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, rawCats, tab, vodCategoryList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return channels.filter((c) => {
      if (isVod(tab)) return !q || c.name.toLowerCase().includes(q);
      return (
        (category === "__all__" || bucketOf(c) === category) &&
        (!q || c.name.toLowerCase().includes(q))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, category, query, rawCats, tab]);

  const visible = filtered.slice(0, MAX_VISIBLE);
  const showFeatured =
    !isVod(tab) && category === "__all__" && !query.trim() && tab !== "custom";
  const featured = useMemo(
    () => (showFeatured ? channels.filter((c) => c.logo).slice(0, FEATURED) : []),
    [channels, showFeatured]
  );

  const catLabel = (key: string) => {
    if (key === "__all__") return t("cat.all");
    if (categories.names.has(key)) return categories.names.get(key)!;
    return t.has(`cat.${key}`) ? t(`cat.${key}`) : key;
  };

  const titleForTab = () => {
    if (tab === "247") return t("tab247");
    if (tab === "radio") return t("tabRadio");
    if (tab === "custom") return t("myList");
    if (tab === "movies") return t("tabMovies");
    if (tab === "series") return t("tabSeries");
    return t("tabLive");
  };

  async function submitCustom() {
    const u = customUrl.trim();
    if (!u) return;
    saveSource(u);
    setHasSource(true);
    setAddOpen(false);
    // Invalida caches VOD / custom
    setCache({});
    setVodCats({});
    setCategory("__all__");
    // Si estábamos en pelis/series, recarga; si no, abre películas
    const next: Tab = isVod(tab) ? tab : "movies";
    await loadTab(next, u);
  }

  async function openSeries(c: IPTVChannel) {
    if (!c.seriesId) {
      // M3U serie con URL directa
      if (c.url) setCurrent(c);
      return;
    }
    setSeriesPick(c);
    setEpisodes([]);
    setEpLoading(true);
    setEpError(false);
    try {
      setEpisodes(await fetchEpisodes(c.seriesId));
    } catch {
      setEpError(true);
    } finally {
      setEpLoading(false);
    }
  }

  function onItemClick(c: IPTVChannel) {
    if (c.kind === "series" || tab === "series") openSeries(c);
    else setCurrent(c);
  }

  // ── Reproductor ──────────────────────────────────────────────
  const playItem = playingEp
    ? {
        title: `${seriesPick?.name ?? ""} · S${playingEp.season}E${playingEp.episode}`,
        subtitle: playingEp.title,
        url: playingEp.url,
        live: false,
      }
    : current
      ? {
          title: current.name,
          subtitle: catLabel(current.category),
          url: current.url,
          live: !isVod(tab) && current.kind !== "movie",
        }
      : null;

  if (playItem) {
    return (
      <div className="fixed inset-0 z-[60] bg-black">
        <VideoPlayer
          title={playItem.title}
          subtitle={playItem.subtitle}
          backHref="#"
          live={playItem.live}
          videoUrl={playItem.url}
          proxyUrl={proxied(playItem.url)}
          streamType={streamType(playItem.url)}
          onClose={() => {
            setCurrent(null);
            setPlayingEp(null);
          }}
        />
      </div>
    );
  }

  // ── Panel episodios ──────────────────────────────────────────
  if (seriesPick) {
    const bySeason = new Map<number, IPTVEpisode[]>();
    for (const ep of episodes) {
      const list = bySeason.get(ep.season) ?? [];
      list.push(ep);
      bySeason.set(ep.season, list);
    }
    const seasons = Array.from(bySeason.keys()).sort((a, b) => a - b);

    return (
      <main className="min-h-screen bg-bg px-4 pt-24 pb-16 md:px-8 tv:px-16 tv:pt-28">
        <div className="mx-auto max-w-[1100px]">
          <button
            data-dpad
            onClick={() => setSeriesPick(null)}
            className="mb-6 text-sm font-bold text-white/50 hover:text-white"
          >
            ← {t("back")}
          </button>
          <div className="mb-8 flex flex-col gap-6 sm:flex-row">
            {seriesPick.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={seriesPick.logo}
                alt=""
                className="h-64 w-44 flex-shrink-0 rounded-xl object-cover shadow-2xl"
              />
            )}
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{seriesPick.name}</h1>
              {(seriesPick.year || seriesPick.rating) && (
                <p className="mt-2 text-sm font-semibold text-white/45">
                  {[seriesPick.year, seriesPick.rating ? `★ ${seriesPick.rating}` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {seriesPick.plot && (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 line-clamp-6">
                  {seriesPick.plot}
                </p>
              )}
            </div>
          </div>

          {epLoading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
            </div>
          ) : epError ? (
            <p className="py-12 text-center text-white/50">{t("episodesError")}</p>
          ) : episodes.length === 0 ? (
            <p className="py-12 text-center text-white/50">{t("noEpisodes")}</p>
          ) : (
            seasons.map((s) => (
              <section key={s} className="mb-8">
                <h2 className="mb-3 text-sm font-extrabold uppercase tracking-[0.2em] text-white/40">
                  {t("season", { n: s })}
                </h2>
                <div className="grid gap-2">
                  {(bySeason.get(s) ?? []).map((ep) => (
                    <button
                      key={ep.id}
                      data-dpad
                      onClick={() => setPlayingEp(ep)}
                      className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-surface px-4 py-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="w-12 flex-shrink-0 text-sm font-extrabold tabular-nums text-white/35">
                        E{String(ep.episode).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-bold text-white/90">
                        {ep.title}
                      </span>
                      {ep.duration && (
                        <span className="text-xs font-semibold text-white/35">{ep.duration}</span>
                      )}
                      <IconPlayerPlayFilled
                        size={18}
                        className="text-primary opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    );
  }

  const tabs: [Tab, string, boolean][] = [
    ["live", t("tabLive"), true],
    ["247", t("tab247"), false],
    ["radio", t("tabRadio"), false],
    ["movies", t("tabMovies"), false],
    ["series", t("tabSeries"), false],
    ...(hasSource || cache.custom ? [["custom", t("myList"), false] as [Tab, string, boolean]] : []),
  ];

  return (
    <main className="min-h-screen bg-bg px-4 pt-24 pb-16 md:px-8 tv:px-16 tv:pt-28">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 12% -8%, rgba(229,9,20,.16), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(229,9,20,.07), transparent 55%)",
        }}
      />

      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex items-end gap-4">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-white/35">
              FilmSpace · TV
            </p>
            <h1 className="text-4xl font-black leading-none tracking-tight sm:text-5xl tv:text-6xl">
              {titleForTab()}
            </h1>
          </div>
          {channels.length > 0 && (
            <div className="ml-auto text-right">
              <div className="text-2xl font-extrabold text-primary tabular-nums tv:text-4xl">
                {filtered.length.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                {isVod(tab) ? t("titlesLabel") : tab === "radio" ? t("stationsLabel") : t("channelsLabel")}
              </div>
            </div>
          )}
        </header>

        <div className="mb-7 flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            className="inline-flex max-w-full flex-wrap rounded-full border border-white/10 bg-surface p-1.5"
          >
            {tabs.map(([key, label, dot]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                data-dpad
                onClick={() => switchTab(key)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold tracking-tight transition-all duration-150 sm:px-5",
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
              placeholder={isVod(tab) ? t("searchVod") : t("search")}
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

        {loading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-primary tv:h-16 tv:w-16" />
            <p className="text-sm text-white/50">{t("loading")}</p>
          </div>
        ) : error === "nosource" ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            {tab === "movies" ? (
              <IconMovie size={36} className="text-primary/80" />
            ) : (
              <IconDeviceTvOld size={36} className="text-primary/80" />
            )}
            <p className="max-w-md text-sm text-white/60">{t("needSource")}</p>
            <p className="max-w-sm text-xs text-white/35">{t("needSourceHint")}</p>
            <button
              data-dpad
              onClick={() => setAddOpen(true)}
              className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white active:scale-95"
            >
              {t("addList")}
            </button>
          </div>
        ) : error === "load" ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <IconAlertTriangle size={28} className="text-primary" />
            <p className="text-sm text-white/60">{t("error")}</p>
            <button
              onClick={() => {
                if (isVod(tab)) {
                  setCache((c) => {
                    const next = { ...c };
                    delete next[cacheKey(tab, category)];
                    return next;
                  });
                } else {
                  clearSource();
                  setCache((c) => ({ ...c, [tab]: undefined as unknown as IPTVChannel[] }));
                }
                loadTab(tab, undefined, category);
              }}
              className="mt-1 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white active:scale-95"
            >
              {t("load")}
            </button>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="mb-8">
                <p className="mb-3 ml-0.5 text-[11px] font-extrabold uppercase tracking-[0.25em] text-white/35">
                  {t("featured")}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((c, i) => (
                    <motion.button
                      key={`feat-${c.url}`}
                      onClick={() => onItemClick(c)}
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

            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(isVod(tab) ? categories.list : categories.list).map((key) => {
                const on = category === key;
                const n = isVod(tab)
                  ? undefined
                  : key === "__all__"
                    ? channels.length
                    : categories.count.get(key) ?? 0;
                return (
                  <button
                    key={key}
                    data-dpad
                    onClick={() => (isVod(tab) ? changeVodCategory(key) : setCategory(key))}
                    className={cn(
                      "flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      on
                        ? "border-white bg-white text-black"
                        : "border-white/[0.06] bg-surface text-white/60 hover:text-white"
                    )}
                  >
                    {catLabel(key)}
                    {n != null && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-px text-[11px] font-extrabold tabular-nums",
                          on ? "bg-black/10 text-black/55" : "bg-white/10 text-white/60"
                        )}
                      >
                        {n.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <p className="py-16 text-center text-white/40">
                {isVod(tab) ? t("noTitles") : t("noChannels")}
              </p>
            ) : isVod(tab) ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 tv:grid-cols-8 tv:gap-4">
                {visible.map((c, i) => (
                  <motion.button
                    key={`${c.seriesId ?? c.url}-${i}`}
                    onClick={() => onItemClick(c)}
                    data-dpad
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(i * 0.008, 0.25) }}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-xl border text-left",
                      "border-white/[0.06] bg-surface transition-all duration-150",
                      "hover:-translate-y-1 hover:border-primary/50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    )}
                  >
                    <div className="relative aspect-[2/3] bg-black/40">
                      {c.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.logo}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-3 text-center text-sm font-extrabold text-white/50">
                          {c.name}
                        </div>
                      )}
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <IconPlayerPlayFilled size={28} className="text-primary" />
                      </span>
                    </div>
                    <div className="px-2.5 py-2">
                      <span className="block truncate text-[12px] font-bold text-white/90">
                        {c.name}
                      </span>
                      {(c.year || c.rating) && (
                        <span className="mt-0.5 block text-[10px] font-semibold text-white/40">
                          {[c.year, c.rating ? `★ ${c.rating}` : ""].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 tv:grid-cols-8 tv:gap-4">
                {visible.map((c, i) => (
                  <motion.button
                    key={`${c.url}-${i}`}
                    onClick={() => onItemClick(c)}
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

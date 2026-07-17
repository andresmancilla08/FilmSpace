"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  IconPlayerPlayFilled,
  IconBroadcast,
  IconSearch,
  IconReload,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  fetchPlaylist,
  getSource,
  saveSource,
  clearSource,
  proxied,
  streamType,
} from "@/lib/iptv";
import type { IPTVChannel } from "@/types";
import { VideoPlayer } from "@/components/player/VideoPlayer";

const MAX_VISIBLE = 500; // ponytail: listas M3U pueden traer miles; el filtro por categoría acota. Techo por si acaso.

// Lista por defecto: la app carga sola al entrar; el usuario no pega nada (solo si quiere cambiarla).
const DEFAULT_SOURCE = "https://iptv-org.github.io/iptv/languages/spa.m3u";

export function LiveTV() {
  const t = useTranslations("live");

  const [url, setUrl] = useState("");
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [loading, setLoading] = useState(true); // arranca cargando: nunca se ve el form al entrar
  const [error, setError] = useState(false);
  const [category, setCategory] = useState("__all__");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<IPTVChannel | null>(null);

  async function load(u: string) {
    setLoading(true);
    setError(false);
    try {
      const list = await fetchPlaylist(u);
      setChannels(list);
      saveSource(u);
    } catch {
      setError(true);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }

  // Carga automática al entrar: lista guardada o la de por defecto (nunca vista vacía).
  useEffect(() => {
    const saved = getSource() || DEFAULT_SOURCE;
    setUrl(saved);
    load(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => set.add(c.group));
    return ["__all__", ...Array.from(set).sort()];
  }, [channels]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return channels.filter(
      (c) =>
        (category === "__all__" || c.group === category) &&
        (!q || c.name.toLowerCase().includes(q))
    );
  }, [channels, category, query]);

  const visible = filtered.slice(0, MAX_VISIBLE);

  // ── Reproductor a pantalla completa ──────────────────────────────
  if (current) {
    return (
      <div className="fixed inset-0 z-[60] bg-black">
        <VideoPlayer
          title={current.name}
          subtitle={current.group}
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

  // ── Cargando (automático al entrar): solo un loading, sin formulario ──
  if (!channels.length && loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4">
        <div className="h-12 w-12 rounded-full border-2 border-white/15 border-t-primary animate-spin tv:h-16 tv:w-16" />
        <p className="text-sm text-white/50 tv:text-base">{t("loading")}</p>
      </main>
    );
  }

  // ── Formulario: solo si falla la carga automática o el usuario pide cambiar la lista ──
  if (!channels.length) {
    return (
      <main className="min-h-screen bg-bg px-4 pt-24 pb-16 md:px-8 tv:px-16 tv:pt-32">
        <div className="mx-auto max-w-xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <IconBroadcast size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tv:text-4xl">{t("title")}</h1>
              <p className="text-sm text-white/50 tv:text-base">{t("addSource")}</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim()) load(url.trim());
            }}
            className="space-y-3"
          >
            <label className="block text-sm text-white/60">{t("sourceHint")}</label>
            <input
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("urlPlaceholder")}
              className={cn(
                "w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-white",
                "placeholder:text-white/25 focus:border-primary focus:outline-none tv:text-base"
              )}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white",
                "transition-transform duration-150 active:scale-95 disabled:opacity-40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary tv:text-base"
              )}
            >
              {loading ? (
                <IconReload size={18} className="animate-spin" />
              ) : (
                <IconBroadcast size={18} />
              )}
              {loading ? t("loading") : t("load")}
            </button>

            {error && (
              <p className="flex items-center gap-2 text-sm text-primary">
                <IconAlertTriangle size={16} />
                {t("error")}
              </p>
            )}
            <p className="pt-2 text-xs text-white/30">{t("legal")}</p>
          </form>
        </div>
      </main>
    );
  }

  // ── Explorador de canales ────────────────────────────────────────
  return (
    <main className="min-h-screen bg-bg px-4 pt-20 pb-16 md:px-8 tv:px-16 tv:pt-28">
      {/* Cabecera */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          {t("live")}
        </span>
        <h1 className="text-xl font-bold tv:text-3xl">{t("title")}</h1>
        <span className="text-sm text-white/40">{t("channels", { count: filtered.length })}</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="w-40 rounded-full border border-white/10 bg-surface py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/25 focus:border-primary focus:outline-none md:w-56"
            />
          </div>
          <button
            onClick={() => {
              clearSource();
              setChannels([]);
              setUrl("");
            }}
            className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 transition-colors hover:text-white"
          >
            {t("change")}
          </button>
        </div>
      </div>

      {/* Categorías */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setCategory(g)}
            data-dpad
            className={cn(
              "flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              category === g ? "bg-primary text-white" : "bg-surface text-white/55 hover:text-white"
            )}
          >
            {g === "__all__" ? t("all") : g}
          </button>
        ))}
      </div>

      {/* Grid de canales */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-white/40">{t("noChannels")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 tv:grid-cols-8 tv:gap-5">
          {visible.map((c, i) => (
            <motion.button
              key={`${c.url}-${i}`}
              onClick={() => setCurrent(c)}
              data-dpad
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: Math.min(i * 0.01, 0.3) }}
              className={cn(
                "group relative flex aspect-video flex-col items-center justify-center gap-2 overflow-hidden rounded-xl",
                "border border-white/5 bg-surface p-3 text-center transition-all duration-150",
                "hover:border-primary/50 hover:bg-surface-elevated",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
            >
              {c.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.logo}
                  alt=""
                  loading="lazy"
                  className="h-10 w-auto object-contain tv:h-14"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              ) : (
                <IconBroadcast size={28} className="text-white/25" />
              )}
              <span className="line-clamp-2 text-xs font-medium text-white/80 tv:text-sm">
                {c.name}
              </span>
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <IconPlayerPlayFilled size={28} className="text-primary" />
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </main>
  );
}

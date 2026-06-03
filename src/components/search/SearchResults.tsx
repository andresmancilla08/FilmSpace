"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconMoodSad } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { MediaCard } from "@/components/media/MediaCard";
import { cn } from "@/lib/utils";
import type { Media, ContentType } from "@/types";

type FilterType = "all" | ContentType;

interface SearchResultsProps {
  results: Media[];
  query: string;
  onHoverBackdrop: (url: string | null) => void;
}

const ease = [0.23, 1, 0.32, 1] as const;

export function SearchResults({ results, query, onHoverBackdrop }: SearchResultsProps) {
  const t = useTranslations("search");
  const [filter, setFilter] = useState<FilterType>("all");

  const FILTERS: { label: string; value: FilterType }[] = [
    { label: t("filterAll"), value: "all" },
    { label: t("filterMovies"), value: "movie" },
    { label: t("filterSeries"), value: "series" },
    { label: t("filterAnime"), value: "anime" },
  ];

  const filtered = filter === "all" ? results : results.filter((m) => m.type === filter);

  return (
    <div className="flex flex-col gap-8 px-4 pb-16 md:px-8 tv:px-0">
      {/* Results header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-white/35">
          {t("resultsFor", { query })}
        </p>

        {/* Filter tabs with sliding indicator */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                filter === f.value ? "text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {filter === f.value && (
                <motion.div
                  layoutId="search-filter-pill"
                  className="absolute inset-0 rounded-full bg-white/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="flex flex-col items-center gap-4 py-16"
          >
            <IconMoodSad size={48} className="text-white/15" />
            <p className="text-lg font-semibold text-white/40">{t("noResults")}</p>
            <p className="text-sm text-white/25">{t("noResultsHint")}</p>
          </motion.div>
        ) : (
          <motion.div
            key={`results-${filter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-3 tv:gap-4"
          >
            {filtered.map((media, index) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, delay: index * 0.04, ease }}
                onMouseEnter={() => onHoverBackdrop(media.backdrop)}
                onMouseLeave={() => onHoverBackdrop(null)}
              >
                <MediaCard media={media} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

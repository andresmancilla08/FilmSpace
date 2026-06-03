"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchEmpty } from "@/components/search/SearchEmpty";
import { SearchSkeleton } from "@/components/search/SearchSkeleton";
import { SearchResults } from "@/components/search/SearchResults";
import { useDebounce } from "@/hooks/useDebounce";
import type { Media } from "@/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredBackdrop, setHoveredBackdrop] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: Media[]) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Show loading skeleton while typing (before debounce fires)
  const isTyping = query !== debouncedQuery && query.trim().length > 0;
  const showSkeleton = loading || isTyping;
  const showResults = !showSkeleton && results.length > 0 && debouncedQuery.trim().length > 0;
  const showEmpty = !showSkeleton && !showResults;

  return (
    <div className="relative min-h-screen bg-[#0a0a0a]">
      {/* Ambient backdrop — THE WOW ELEMENT */}
      <AnimatePresence>
        {hoveredBackdrop && (
          <motion.div
            key={hoveredBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="pointer-events-none fixed inset-0 -z-10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hoveredBackdrop}
              alt=""
              className="h-full w-full scale-110 object-cover opacity-[0.07] blur-3xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-screen-xl">
        <SearchInput
          value={query}
          onChange={setQuery}
          loading={showSkeleton}
          compact={!!query}
        />

        <AnimatePresence mode="wait">
          {showEmpty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <SearchEmpty onChipClick={setQuery} />
            </motion.div>
          )}

          {showSkeleton && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SearchSkeleton />
            </motion.div>
          )}

          {showResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <SearchResults
                results={results}
                query={debouncedQuery}
                onHoverBackdrop={setHoveredBackdrop}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

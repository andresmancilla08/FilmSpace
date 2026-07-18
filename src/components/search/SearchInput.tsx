"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { IconSearch, IconX, IconArrowLeft } from "@tabler/icons-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  loading: boolean;
  compact: boolean;
}

export function SearchInput({ value, onChange, loading, compact }: SearchInputProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-center transition-all duration-500",
        compact ? "pt-20 pb-8" : "min-h-[40vh] justify-center pb-4"
      )}
    >
      {/* Logo — only when not compact */}
      <AnimatePresence>
        {!compact && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mb-12 select-none text-2xl font-bold tracking-tight"
          >
            Film<span className="text-primary">Space</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex w-full max-w-3xl items-center gap-3 px-4 md:px-8 tv:px-0">
        {/* Back */}
        <Link
          href={`/${locale}`}
          className="flex-shrink-0 rounded-full p-2 text-white/45 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconArrowLeft size={22} />
        </Link>

        {/* Field */}
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <IconSearch
              size={compact ? 20 : 26}
              className="flex-shrink-0 text-white/25 transition-all duration-300"
            />
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t("placeholder")}
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "min-w-0 flex-1 bg-transparent font-semibold text-white outline-none",
                "placeholder:text-white/20 transition-all duration-300",
                compact ? "text-xl sm:text-2xl md:text-3xl" : "text-2xl sm:text-4xl md:text-5xl"
              )}
            />
            <AnimatePresence>
              {value && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => { onChange(""); inputRef.current?.focus(); }}
                  className="flex-shrink-0 rounded-full p-1 text-white/35 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <IconX size={18} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom line */}
          <div className="relative mt-4 h-px w-full overflow-hidden bg-white/8">
            {/* Scanner sweep (idle) */}
            {!value && !loading && (
              <motion.div
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                animate={{ x: ["-100%", "400%"] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
              />
            )}
            {/* Loading sweep */}
            {loading && (
              <motion.div
                className="absolute inset-0 h-full bg-gradient-to-r from-transparent via-primary to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
            )}
            {/* Active line */}
            {value && !loading && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute inset-0 origin-left bg-primary/40"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

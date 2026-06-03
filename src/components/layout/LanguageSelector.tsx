"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", label: "EN", flag: "🇺🇸" },
  { code: "es", label: "ES", flag: "🇪🇸" },
] as const;

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function switchLocale(code: string) {
    const newPath = pathname.replace(/^\/[^/]+/, `/${code}`);
    router.push(newPath);
    router.refresh();
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger — solo flag, igual que Spendia */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-lg",
          "border border-white/10 bg-white/8 backdrop-blur-sm transition-all duration-150",
          "hover:border-white/25 hover:bg-white/15",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          open && "border-white/25 bg-white/15"
        )}
        aria-label="Select language"
      >
        {current.flag}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "absolute right-0 top-full z-50 mt-2 min-w-[130px]",
              "overflow-hidden rounded-2xl border border-white/12",
              "bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl shadow-black/60"
            )}
          >
            {LANGUAGES.map((lang, index) => {
              const active = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => switchLocale(lang.code)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors duration-100",
                    index < LANGUAGES.length - 1 && "border-b border-white/8",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-white/65 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span className="flex-1 text-sm font-semibold">{lang.label}</span>
                  {active && <IconCheck size={14} className="text-primary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

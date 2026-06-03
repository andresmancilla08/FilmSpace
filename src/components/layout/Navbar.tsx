"use client";
import Link from "next/link";
import { useState } from "react";
import { IconSearch, IconUser } from "@tabler/icons-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { LanguageSelector } from "./LanguageSelector";
import type { ContentType } from "@/types";

type Tab = ContentType | "all";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const scrolled = useScrolled();
  const [active, setActive] = useState<Tab>("all");

  const TABS: { label: string; value: Tab }[] = [
    { label: t("all"), value: "all" },
    { label: t("movies"), value: "movie" },
    { label: t("series"), value: "series" },
    { label: t("anime"), value: "anime" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-black/80 backdrop-blur-md border-b border-white/5"
          : "bg-gradient-to-b from-black/70 to-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 md:px-8 tv:h-20 tv:px-16">
        <Link
          href={`/${locale}`}
          className="mr-2 flex-shrink-0 text-xl font-bold tracking-tight select-none tv:text-2xl"
        >
          Film<span className="text-primary">Space</span>
        </Link>

        <div className="flex gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActive(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-black",
                "tv:px-4 tv:py-2 tv:text-base",
                active === tab.value ? "bg-white/10 text-white" : "text-white/55 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector />

          {/* Search — navega a /search */}
          <Link
            href={`/${locale}/search`}
            className={cn(
              "rounded-full p-2 text-white/60 transition-colors duration-150",
              "hover:bg-white/10 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
            aria-label={t("searchLabel")}
          >
            <IconSearch size={20} />
          </Link>

          <button
            className={cn(
              "rounded-full p-2 text-white/60 transition-colors duration-150",
              "hover:bg-white/10 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
            aria-label={t("profileLabel")}
          >
            <IconUser size={20} />
          </button>
        </div>
      </nav>
    </header>
  );
}

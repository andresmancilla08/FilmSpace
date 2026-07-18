"use client";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { IconSearch, IconUser, IconBroadcast } from "@tabler/icons-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { useAuth } from "@/context/AuthContext";
import { LanguageSelector } from "./LanguageSelector";
import type { ContentType } from "@/types";

type Tab = ContentType | "all";
const TAB_VALUES: Tab[] = ["all", "movie", "series", "anime"];

const TAB_CLASS =
  "flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-black tv:px-4 tv:py-2 tv:text-base";

// Presentacional: pinta los 4 tabs de filtro. `active` = home + filtro coincidente.
function TabLinks({
  home,
  onHome,
  labels,
  currentFilter,
}: {
  home: string;
  onHome: boolean;
  labels: Record<Tab, string>;
  currentFilter: Tab;
}) {
  return (
    <>
      {TAB_VALUES.map((value) => {
        const active = onHome && currentFilter === value;
        return (
          <Link
            key={value}
            href={value === "all" ? home : `${home}?t=${value}`}
            className={cn(TAB_CLASS, active ? "bg-white/10 text-white" : "text-white/55 hover:text-white")}
          >
            {labels[value]}
          </Link>
        );
      })}
    </>
  );
}

// useSearchParams necesita Suspense (Next 15) → aislado aquí.
function NavTabs({ home, onHome, labels }: { home: string; onHome: boolean; labels: Record<Tab, string> }) {
  const searchParams = useSearchParams();
  const currentFilter = (searchParams.get("t") as Tab | null) ?? "all";
  return <TabLinks home={home} onHome={onHome} labels={labels} currentFilter={currentFilter} />;
}

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const scrolled = useScrolled();
  const { user } = useAuth();
  const pathname = usePathname();

  const home = `/${locale}`;
  const onHome = pathname === home || pathname === `${home}/`;
  const onLive = pathname.startsWith(`${home}/live`);
  const labels: Record<Tab, string> = {
    all: t("all"),
    movie: t("movies"),
    series: t("series"),
    anime: t("anime"),
  };

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-black/80 backdrop-blur-md border-b border-white/5"
          : "bg-gradient-to-b from-black/70 to-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 md:gap-4 md:px-8 tv:h-20 tv:px-16">
        <Link
          href={home}
          className="flex-shrink-0 text-xl font-bold tracking-tight select-none tv:text-2xl"
        >
          Film<span className="text-primary">Space</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-none">
          <Suspense
            fallback={<TabLinks home={home} onHome={onHome} labels={labels} currentFilter="all" />}
          >
            <NavTabs home={home} onHome={onHome} labels={labels} />
          </Suspense>

          {/* En vivo (IPTV) — navega a /live */}
          <Link
            href={`${home}/live`}
            className={cn(
              "flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              "hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-black",
              "tv:px-4 tv:py-2 tv:text-base",
              onLive ? "bg-white/10 text-white" : "text-white/55"
            )}
          >
            <IconBroadcast size={16} className="text-primary" />
            {t("live")}
          </Link>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
          <LanguageSelector />

          {/* Search — navega a /search */}
          <Link
            href={`${home}/search`}
            className={cn(
              "rounded-full p-2 text-white/60 transition-colors duration-150",
              "hover:bg-white/10 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
            aria-label={t("searchLabel")}
          >
            <IconSearch size={20} />
          </Link>

          <Link
            href={user ? `${home}/profile` : `${home}/auth`}
            className={cn(
              "rounded-full p-2 text-white/60 transition-colors duration-150",
              "hover:bg-white/10 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              user && "text-primary/80"
            )}
            aria-label={t("profileLabel")}
          >
            <IconUser size={20} />
          </Link>
        </div>
      </nav>
    </header>
  );
}

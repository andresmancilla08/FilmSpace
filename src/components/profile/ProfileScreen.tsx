"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IconLogout, IconSettings, IconBookmark, IconMovie, IconClock } from "@tabler/icons-react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const ease = [0.23, 1, 0.32, 1] as const;

function item(delay: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease },
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

export function ProfileScreen() {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace(`/${locale}/auth`);
  }, [user, loading, locale, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const initials = getInitials(user.name);

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(229,9,20,0.07) 0%, transparent 70%)",
        }}
      />
      {/* Film grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Navbar back link */}
      <div className="absolute left-0 top-0 right-0 z-10 flex items-center justify-between px-6 py-5 md:px-12 tv:px-24">
        <Link
          href={`/${locale}`}
          data-dpad
          className={cn(
            "text-xl font-black tracking-tight select-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          )}
        >
          Film<span className="text-primary">Space</span>
        </Link>
        <button
          onClick={() => { signOut(); router.replace(`/${locale}`); }}
          data-dpad
          className={cn(
            "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65",
            "transition-all duration-150 hover:border-white/20 hover:bg-white/10 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "tv:px-6 tv:py-3 tv:text-base"
          )}
        >
          <IconLogout size={15} />
          {t("signOut")}
        </button>
      </div>

      {/* Main content */}
      <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-28 md:px-12 tv:py-32">

        {/* Avatar + info */}
        <motion.div {...item(0)} className="flex flex-col items-center gap-5 text-center">
          {/* Avatar */}
          <div className="relative">
            {/* Glow */}
            <div
              className="absolute -inset-3 rounded-full opacity-60"
              style={{
                background: "radial-gradient(circle, rgba(229,9,20,0.35) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 tv:h-32 tv:w-32"
              style={{
                background: "linear-gradient(135deg, #E50914 0%, #7a0008 100%)",
              }}
            >
              <span className="text-3xl font-black text-white tracking-tight tv:text-4xl">
                {initials}
              </span>
            </div>
          </div>

          {/* Name + email */}
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight capitalize tv:text-4xl">
              {user.name}
            </h1>
            <p className="mt-1 text-sm text-white/45 tv:text-base">{user.email}</p>
            <p className="mt-0.5 text-xs text-white/30 tv:text-sm">
              {t("memberSince")} {formatDate(user.createdAt)}
            </p>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div {...item(0.08)} className="flex gap-3 md:gap-5">
          {[
            { icon: <IconMovie size={18} />, label: t("moviesWatched"), value: "0" },
            { icon: <IconClock size={18} />, label: t("hoursWatched"), value: "0" },
            { icon: <IconBookmark size={18} />, label: t("myList"), value: "0" },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04]",
                "px-6 py-4 min-w-[90px] md:min-w-[110px] tv:min-w-[140px] tv:py-6"
              )}
            >
              <span className="text-white/35">{icon}</span>
              <span className="text-2xl font-black text-white tv:text-3xl">{value}</span>
              <span className="text-[10px] text-white/35 uppercase tracking-wider font-semibold tv:text-xs">
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Empty state: continue watching */}
        <motion.div {...item(0.14)} className="w-full max-w-lg">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/35 tv:text-base">
            {t("continueWatching")}
          </h2>
          <div
            className={cn(
              "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/[0.09] py-10 px-6",
              "bg-white/[0.02]"
            )}
          >
            <IconMovie size={28} className="text-white/25" />
            <p className="text-sm text-white/30 text-center max-w-xs tv:text-base">{t("noHistory")}</p>
            <Link
              href={`/${locale}`}
              data-dpad
              className={cn(
                "mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white",
                "transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                "tv:px-8 tv:py-3.5 tv:text-base"
              )}
            >
              {t("browseContent")}
            </Link>
          </div>
        </motion.div>

        {/* Settings link */}
        <motion.div {...item(0.18)}>
          <button
            data-dpad
            className={cn(
              "flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-5 py-2.5 text-sm text-white/45",
              "transition-all duration-150 hover:border-white/15 hover:text-white/70",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "tv:px-7 tv:py-4 tv:text-base"
            )}
          >
            <IconSettings size={15} />
            {t("settings")}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

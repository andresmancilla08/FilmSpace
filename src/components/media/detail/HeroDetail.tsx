"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  IconChevronLeft,
  IconPlayerPlayFilled,
  IconMovie,
  IconStarFilled,
  IconClock,
  IconCalendar,
  IconDeviceTv,
} from "@tabler/icons-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { MediaDetail } from "@/types";

interface HeroDetailProps {
  media: MediaDetail;
  onTrailerClick: () => void;
}

const ease = [0.23, 1, 0.32, 1] as const;

function item(delay: number) {
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease },
  };
}

function formatRuntime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function MetaPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-3.5 py-1.5 backdrop-blur-sm">
      {icon}
      <span className="text-sm font-semibold text-white">{label}</span>
    </div>
  );
}

export function HeroDetail({ media, onTrailerClick }: HeroDetailProps) {
  const t = useTranslations("detail");
  const tc = useTranslations("content");
  const locale = useLocale();

  const { scrollY } = useScroll();
  const backdropScale = useTransform(scrollY, [0, 700], [1, 1.12]);
  const backdropOpacity = useTransform(scrollY, [0, 600], [0.32, 0.12]);

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Parallax backdrop */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ scale: backdropScale, opacity: backdropOpacity }}
      >
        <Image
          src={media.backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* Gradient layers */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/55 to-[#0a0a0a]/15" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a0a0a]/80 via-[#0a0a0a]/20 to-transparent" />
      {/* Subtle red accent from left */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 15% 55%, rgba(229,9,20,0.09) 0%, transparent 55%)" }}
      />

      {/* Year watermark — UNIQUE ELEMENT */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 select-none text-[28vw] font-black leading-none text-white/[0.035]"
      >
        {media.year}
      </div>

      {/* Back button */}
      <div className="absolute left-6 top-20 z-20 md:left-12 tv:left-24">
        <Link
          href={`/${locale}`}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 backdrop-blur-sm px-4 py-2",
            "text-sm font-medium text-white/80 transition-all duration-150",
            "hover:bg-white/20 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
        >
          <IconChevronLeft size={16} />
          {t("back")}
        </Link>
      </div>

      {/* Main content */}
      <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 pb-16 pt-32 md:flex-row md:items-center md:gap-14 md:px-16 tv:gap-20 tv:px-24">

        {/* Poster with 3D glow effect */}
        <motion.div
          initial={{ opacity: 0, x: -48, rotateY: -12 }}
          animate={{ opacity: 1, x: 0, rotateY: -4 }}
          transition={{ duration: 0.75, ease }}
          className="flex-shrink-0"
          style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
        >
          <div className="relative">
            {/* Glow ring */}
            <div
              className="absolute -inset-4 rounded-2xl opacity-80"
              style={{
                background: "radial-gradient(ellipse at 50% 105%, rgba(229,9,20,0.55) 0%, transparent 60%)",
                filter: "blur(28px)",
              }}
            />
            {/* Poster */}
            <div className="relative w-44 overflow-hidden rounded-2xl border border-white/10 shadow-2xl md:w-60 tv:w-80">
              <Image
                src={media.poster}
                alt={media.title}
                width={320}
                height={480}
                className="h-auto w-full object-cover"
                priority
              />
              {/* Subtle gloss overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent" />
            </div>
          </div>
        </motion.div>

        {/* Info panel */}
        <div className="flex flex-col gap-5 md:max-w-xl tv:max-w-2xl">
          {/* Type badge */}
          <motion.div {...item(0)}>
            <span className="inline-block rounded-sm bg-primary px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              {tc(media.type)}
            </span>
          </motion.div>

          {/* Title — massive */}
          <motion.h1
            {...item(0.07)}
            className="text-4xl font-black leading-[0.92] tracking-tight text-white md:text-6xl tv:text-8xl"
          >
            {media.title}
          </motion.h1>

          {/* Tagline */}
          {media.tagline && (
            <motion.p {...item(0.12)} className="text-sm italic text-white/40 md:text-base">
              &ldquo;{media.tagline}&rdquo;
            </motion.p>
          )}

          {/* Meta badges */}
          <motion.div {...item(0.16)} className="flex flex-wrap gap-2">
            <MetaPill
              icon={<IconStarFilled size={13} className="text-yellow-400" />}
              label={media.rating.toFixed(1)}
            />
            {media.runtime != null && (
              <MetaPill
                icon={<IconClock size={13} className="text-white/55" />}
                label={formatRuntime(media.runtime)}
              />
            )}
            {media.seasons != null && (
              <MetaPill
                icon={<IconDeviceTv size={13} className="text-white/55" />}
                label={`${media.seasons}S · ${media.episodes}E`}
              />
            )}
            <MetaPill
              icon={<IconCalendar size={13} className="text-white/55" />}
              label={String(media.year)}
            />
          </motion.div>

          {/* Genres */}
          <motion.div {...item(0.20)} className="flex flex-wrap gap-2">
            {media.genres.map((g) => (
              <span
                key={g}
                className="rounded-full border border-white/15 px-3 py-0.5 text-xs text-white/60"
              >
                {g}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div {...item(0.24)} className="flex gap-3">
            <button
              className={cn(
                "flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-white",
                "transition-all duration-150 hover:bg-primary/90 active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                "tv:px-10 tv:py-4 tv:text-base"
              )}
            >
              <IconPlayerPlayFilled size={18} />
              {t("play")}
            </button>
            {media.trailer && (
              <button
                onClick={onTrailerClick}
                className={cn(
                  "flex items-center gap-2 rounded-xl border border-white/20 bg-white/8 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm",
                  "transition-all duration-150 hover:border-white/40 hover:bg-white/15 active:scale-[0.97]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  "tv:px-10 tv:py-4 tv:text-base"
                )}
              >
                <IconMovie size={18} />
                {t("trailer")}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { IconPlayerPlayFilled, IconInfoCircle, IconStarFilled } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { Media } from "@/types";

interface HeroFeaturedProps {
  media: Media;
}

const ease = [0.23, 1, 0.32, 1] as const;

function item(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease },
  };
}

export function HeroFeatured({ media }: HeroFeaturedProps) {
  return (
    <section className="relative h-[85vh] min-h-[520px] w-full overflow-hidden tv:h-screen">
      {/* Backdrop */}
      <Image
        src={media.backdrop}
        alt={media.title}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/85 via-[#0a0a0a]/25 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-20 md:px-12 md:pb-24 tv:px-24 tv:pb-32">
        <div className="max-w-xl tv:max-w-3xl">
          {/* Badge row */}
          <motion.div {...item(0)} className="mb-3 flex items-center gap-2.5">
            <span className="rounded-sm bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              {media.type}
            </span>
            <span className="flex items-center gap-1 text-sm text-white/70">
              <IconStarFilled size={13} className="text-yellow-400" />
              {media.rating.toFixed(1)}
            </span>
            <span className="text-sm text-white/45">{media.year}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            {...item(0.08)}
            className="mb-3 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl tv:text-7xl"
          >
            {media.title}
          </motion.h1>

          {/* Genres */}
          <motion.div {...item(0.14)} className="mb-4 flex flex-wrap gap-2">
            {media.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-white/20 px-3 py-0.5 text-xs text-white/65"
              >
                {genre}
              </span>
            ))}
          </motion.div>

          {/* Overview */}
          <motion.p
            {...item(0.18)}
            className="mb-7 line-clamp-3 text-sm leading-relaxed text-white/65 md:text-base tv:text-lg tv:leading-relaxed"
          >
            {media.overview}
          </motion.p>

          {/* Buttons */}
          <motion.div {...item(0.23)} className="flex gap-3">
            <button
              className={cn(
                "flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white",
                "transition-all duration-150 hover:bg-primary/90 active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                "tv:px-8 tv:py-4 tv:text-base"
              )}
            >
              <IconPlayerPlayFilled size={18} />
              Play
            </button>
            <button
              className={cn(
                "flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm",
                "transition-all duration-150 hover:border-white/45 hover:bg-white/18 active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                "tv:px-8 tv:py-4 tv:text-base"
              )}
            >
              <IconInfoCircle size={18} />
              More Info
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

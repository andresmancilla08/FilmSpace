"use client";
import { motion } from "framer-motion";
import {
  IconSword, IconHeart, IconRocket, IconGhost,
  IconMovie, IconDeviceTv, IconStars, IconBolt,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

// Genre names are TMDB search terms (data), not UI copy — not i18n'd
const GENRE_CHIPS = [
  { term: "Action", icon: IconSword },
  { term: "Drama", icon: IconHeart },
  { term: "Sci-Fi", icon: IconRocket },
  { term: "Horror", icon: IconGhost },
  { term: "Anime", icon: IconStars },
  { term: "Thriller", icon: IconBolt },
  { term: "Movie", icon: IconMovie },
  { term: "Series", icon: IconDeviceTv },
] as const;

const ease = [0.23, 1, 0.32, 1] as const;

interface SearchEmptyProps {
  onChipClick: (term: string) => void;
}

export function SearchEmpty({ onChipClick }: SearchEmptyProps) {
  const t = useTranslations("search");

  return (
    <div className="flex flex-col items-center gap-8 px-4 pb-16">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease }}
        className="text-xs font-bold uppercase tracking-[0.2em] text-white/25"
      >
        {t("trending")}
      </motion.p>

      <div className="flex flex-wrap justify-center gap-2.5">
        {GENRE_CHIPS.map((chip, i) => {
          const Icon = chip.icon;
          return (
            <motion.button
              key={chip.term}
              initial={{ opacity: 0, y: 10, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.12 + i * 0.04, ease }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChipClick(chip.term)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm transition-colors hover:border-primary/35 hover:bg-primary/8 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon size={14} className="text-white/40 group-hover:text-primary" />
              <span className="text-sm font-medium text-white/60">{chip.term}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

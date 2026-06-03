"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

interface TrailerPlayerProps {
  videoId: string;
  backdrop: string;
}

export function TrailerPlayer({ videoId, backdrop }: TrailerPlayerProps) {
  const t = useTranslations("detail");
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
      <div className="relative aspect-video">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            title={t("trailer")}
          />
        ) : (
          <>
            {/* Thumbnail */}
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={t("trailer")}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Play button */}
            <motion.button
              onClick={() => setPlaying(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="absolute inset-0 flex items-center justify-center focus-visible:outline-none"
              aria-label={t("trailer")}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40 tv:h-20 tv:w-20">
                <IconPlayerPlayFilled size={28} className="translate-x-0.5 text-white" />
              </div>
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}

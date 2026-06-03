"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { HeroDetail } from "./HeroDetail";
import { TrailerPlayer } from "./TrailerPlayer";
import { CastGrid } from "./CastGrid";
import { SimilarRow } from "./SimilarRow";
import type { MediaDetail } from "@/types";

interface DetailPageProps {
  media: MediaDetail;
}

const ease = [0.23, 1, 0.32, 1] as const;

export function DetailPage({ media }: DetailPageProps) {
  const trailerRef = useRef<HTMLDivElement>(null);

  function scrollToTrailer() {
    trailerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeroDetail media={media} onTrailerClick={scrollToTrailer} />

      {/* Below-fold content — glass panels on dark */}
      <div className="space-y-16 pb-24 tv:space-y-20">

        {/* Overview + Trailer side by side */}
        <section className="px-6 md:px-12 tv:px-24">
          <div className="grid gap-10 md:grid-cols-2 md:gap-14">

            {/* Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease }}
            >
              <p className="text-base leading-8 text-white/65 md:text-lg md:leading-9">
                {media.overview}
              </p>
            </motion.div>

            {/* Trailer */}
            {media.trailer && (
              <motion.div
                ref={trailerRef}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1, ease }}
              >
                <TrailerPlayer videoId={media.trailer} backdrop={media.backdrop} />
              </motion.div>
            )}
          </div>
        </section>

        {/* Cast */}
        <CastGrid cast={media.cast} />

        {/* Similar */}
        <SimilarRow items={media.similar} />
      </div>
    </div>
  );
}

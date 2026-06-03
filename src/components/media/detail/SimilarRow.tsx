"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MediaCard } from "@/components/media/MediaCard";
import type { Media } from "@/types";

interface SimilarRowProps {
  items: Media[];
}

const ease = [0.23, 1, 0.32, 1] as const;

export function SimilarRow({ items }: SimilarRowProps) {
  const t = useTranslations("detail");
  if (items.length === 0) return null;

  return (
    <section className="px-6 md:px-12 tv:px-24">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease }}
        className="mb-6 text-xl font-bold text-white tv:text-2xl"
      >
        {t("similar")}
      </motion.h2>

      <div
        className="flex gap-3 overflow-x-auto pb-3 tv:gap-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((media, index) => (
          <motion.div
            key={media.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: index * 0.05, ease }}
          >
            <MediaCard media={media} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

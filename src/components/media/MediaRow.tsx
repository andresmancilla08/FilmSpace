"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MediaCard } from "./MediaCard";
import type { Media } from "@/types";

interface MediaRowProps {
  title: string;
  items: Media[];
}

const ease = [0.23, 1, 0.32, 1] as const;

export function MediaRow({ title, items }: MediaRowProps) {
  const t = useTranslations("home");

  return (
    <section className="px-4 md:px-8 tv:px-16">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white tv:text-xl">{title}</h2>
        <button className="text-sm text-primary transition-colors duration-150 hover:text-primary/75 focus-visible:outline-none focus-visible:underline">
          {t("seeAll")}
        </button>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-3 tv:gap-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((media, index) => (
          <motion.div
            key={media.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.04, ease }}
          >
            <MediaCard media={media} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

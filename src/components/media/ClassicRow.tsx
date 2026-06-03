"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import { IconArchive } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { ClassicCard } from "./ClassicCard";
import { cn } from "@/lib/utils";
import type { ArchiveMedia } from "@/lib/archive";

interface ClassicRowProps {
  title: string;
  items: ArchiveMedia[];
}

export function ClassicRow({ title, items }: ClassicRowProps) {
  const t = useTranslations("classics");
  const rowRef = useRef<HTMLDivElement>(null);

  if (!items.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="px-4 md:px-8 tv:px-16"
    >
      {/* Row header */}
      <div className="mb-3 flex items-center gap-2.5">
        <h2 className="text-base font-bold text-white tv:text-xl">{title}</h2>
        {/* Internet Archive badge */}
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
          <IconArchive size={10} className="text-white/40" />
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
            {t("source").replace("Source: ", "").replace("Fuente: ", "")}
          </span>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={rowRef}
        className={cn(
          "flex gap-3 overflow-x-auto pb-2 scrollbar-none",
          "snap-x snap-mandatory"
        )}
      >
        {items.map((item, i) => (
          <motion.div
            key={item.archiveId}
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
            className="snap-start"
          >
            <ClassicCard item={item} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

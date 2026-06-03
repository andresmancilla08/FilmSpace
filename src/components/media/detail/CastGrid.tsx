"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { IconUser } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import type { CastMember } from "@/types";

interface CastGridProps {
  cast: CastMember[];
}

const ease = [0.23, 1, 0.32, 1] as const;

export function CastGrid({ cast }: CastGridProps) {
  const t = useTranslations("detail");
  if (cast.length === 0) return null;

  return (
    <section className="px-6 md:px-12 tv:px-24">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease }}
        className="mb-6 text-xl font-bold text-white tv:text-2xl"
      >
        {t("cast")}
      </motion.h2>

      <div
        className="flex gap-4 overflow-x-auto pb-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {cast.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: index * 0.05, ease }}
            className="flex-shrink-0"
          >
            <CardSpotlight className="w-28 cursor-default rounded-xl border border-white/8 bg-surface-card/60 p-3 backdrop-blur-sm tv:w-36">
              {/* Photo */}
              <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-surface-elevated">
                {member.profile ? (
                  <Image
                    src={member.profile}
                    alt={member.name}
                    fill
                    sizes="112px"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <IconUser size={32} />
                  </div>
                )}
              </div>
              {/* Name */}
              <p className="text-xs font-semibold leading-tight text-white line-clamp-2">
                {member.name}
              </p>
              {/* Character */}
              <p className="mt-0.5 text-[10px] leading-tight text-white/45 line-clamp-2">
                {member.character}
              </p>
            </CardSpotlight>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ArchiveMedia } from "@/lib/archive";

interface ClassicCardProps {
  item: ArchiveMedia;
  className?: string;
}

export function ClassicCard({ item, className }: ClassicCardProps) {
  const locale = useLocale();
  const t = useTranslations("classics");
  const href = `/${locale}/classic/${item.archiveId}`;

  return (
    <Link
      href={href}
      className={cn("group flex-shrink-0 block", "w-36 md:w-44 tv:w-56", className)}
    >
      <div
        className={cn(
          "h-full cursor-pointer rounded-lg overflow-hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        )}
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] w-full bg-surface-card rounded-lg overflow-hidden">
          <Image
            src={item.poster}
            alt={item.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 144px, (max-width: 1920px) 176px, 224px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            draggable={false}
          />

          {/* FREE badge */}
          <div className="absolute top-2 left-2 z-10">
            <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
              {t("freeLabel")}
            </span>
          </div>

          {/* Hover overlay */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-end p-3",
              "bg-gradient-to-t from-black via-black/40 to-transparent",
              "opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            )}
          >
            {/* Play button center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40 transition-transform duration-150 group-hover:scale-110">
                <IconPlayerPlayFilled size={18} className="translate-x-0.5 text-white" />
              </div>
            </div>

            <h3 className="text-sm font-semibold leading-tight text-white line-clamp-2 relative z-10">
              {item.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-white/65 relative z-10">
              {item.year > 0 && <span>{item.year}</span>}
              {item.year > 0 && <span>·</span>}
              <span className="text-white/45">{t("publicDomain")}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

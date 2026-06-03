"use client";
import Image from "next/image";
import Link from "next/link";
import { IconStarFilled } from "@tabler/icons-react";
import { useLocale } from "next-intl";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { cn } from "@/lib/utils";
import type { Media } from "@/types";

interface MediaCardProps {
  media: Media;
  className?: string;
}

export function MediaCard({ media, className }: MediaCardProps) {
  const locale = useLocale();
  const href = `/${locale}/${media.type}/${media.id}`;

  return (
    <Link
      href={href}
      className={cn("group flex-shrink-0 block", "w-36 md:w-44 tv:w-56", className)}
    >
      <CardSpotlight
        className={cn(
          "h-full cursor-pointer rounded-lg",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        )}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-card">
          <Image
            src={media.poster}
            alt={media.title}
            fill
            sizes="(max-width: 768px) 144px, (max-width: 1920px) 176px, 224px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            draggable={false}
          />

          {/* Hover overlay */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-end p-3",
              "bg-gradient-to-t from-black via-black/40 to-transparent",
              "opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            )}
          >
            <h3 className="text-sm font-semibold leading-tight text-white line-clamp-2">
              {media.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-white/65">
              <span>{media.year}</span>
              <span>·</span>
              <IconStarFilled size={11} className="text-yellow-400" />
              <span>{media.rating.toFixed(1)}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {media.genres.slice(0, 2).map((g) => (
                <span key={g} className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardSpotlight>
    </Link>
  );
}

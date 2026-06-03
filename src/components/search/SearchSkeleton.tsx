"use client";
import { motion } from "framer-motion";

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="w-36 flex-shrink-0 md:w-44 tv:w-56"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-card">
        {/* Shimmer */}
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ["−100%", "200%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay }}
          style={{ transform: "translateX(-100%)" }}
        />
      </div>
    </motion.div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="px-4 md:px-8 tv:px-0">
      <div className="flex gap-3 overflow-hidden tv:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} delay={i * 0.06} />
        ))}
      </div>
    </div>
  );
}

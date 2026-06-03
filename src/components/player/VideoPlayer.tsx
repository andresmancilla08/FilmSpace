"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconChevronLeft,
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
  IconMinimize,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const DEMO_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

interface VideoPlayerProps {
  title: string;
  subtitle?: string;
  backHref: string;
  videoUrl?: string;
  backdrop?: string;
}

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function VideoPlayer({
  title,
  subtitle,
  backHref,
  videoUrl = DEMO_VIDEO,
  backdrop,
}: VideoPlayerProps) {
  const t = useTranslations("player");
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(true);
  const [feedback, setFeedback] = useState<"play" | "pause" | null>(null);
  const [dragging, setDragging] = useState(false);

  // Auto-hide controls after 3s
  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const showAndScheduleHide = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (playing) scheduleHide();
    else {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setShowControls(true);
    }
  }, [playing, scheduleHide]);

  // Fullscreen change listener
  useEffect(() => {
    function onFsChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Keyboard shortcuts — handled inside the player
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          v.currentTime = Math.min(v.duration, v.currentTime + 10);
          showAndScheduleHide();
          break;
        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          showAndScheduleHide();
          break;
        case "ArrowUp":
          e.preventDefault();
          v.volume = Math.min(1, v.volume + 0.1);
          setVolume(v.volume);
          showAndScheduleHide();
          break;
        case "ArrowDown":
          e.preventDefault();
          v.volume = Math.max(0, v.volume - 0.1);
          setVolume(v.volume);
          showAndScheduleHide();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "Escape":
          if (!fullscreen) {
            e.preventDefault();
            router.back();
          }
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, fullscreen, showAndScheduleHide]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
    setFeedback(v.paused ? "play" : "pause");
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const el = progressRef.current;
    const v = videoRef.current;
    if (!el || !v || !v.duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct =
    videoRef.current && duration > 0 && videoRef.current.buffered.length > 0
      ? (videoRef.current.buffered.end(videoRef.current.buffered.length - 1) / duration) * 100
      : 0;

  return (
    <div
      ref={containerRef}
      data-player="true"
      className={cn(
        "relative w-full bg-black overflow-hidden select-none",
        fullscreen ? "fixed inset-0 z-[9999]" : "h-screen"
      )}
      onMouseMove={showAndScheduleHide}
      onTouchStart={showAndScheduleHide}
      style={{ cursor: showControls ? "default" : "none" }}
    >
      {/* Backdrop placeholder while loading */}
      {backdrop && buffering && (
        <img
          src={backdrop}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}

      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-contain"
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(videoRef.current?.duration ?? 0)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onVolumeChange={() => {
          const v = videoRef.current;
          if (!v) return;
          setMuted(v.muted);
          setVolume(v.volume);
        }}
      />

      {/* Buffering spinner */}
      <AnimatePresence>
        {buffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-primary animate-spin tv:h-16 tv:w-16" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/pause center feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback}
            initial={{ scale: 0.7, opacity: 0.9 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onAnimationComplete={() => setFeedback(null)}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 tv:h-28 tv:w-28">
              {feedback === "play" ? (
                <IconPlayerPlayFilled size={36} className="text-white translate-x-0.5" />
              ) : (
                <IconPlayerPauseFilled size={36} className="text-white" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex flex-col justify-between pointer-events-none"
          >
            {/* Top bar */}
            <div className="bg-gradient-to-b from-black/75 to-transparent px-4 py-4 pointer-events-auto tv:px-10 tv:py-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(backHref)}
                  data-dpad
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-sm px-3.5 py-2",
                    "text-sm font-medium text-white/80 transition-all duration-150",
                    "hover:bg-white/20 hover:text-white",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "tv:px-5 tv:py-3 tv:text-base"
                  )}
                >
                  <IconChevronLeft size={16} className="tv:hidden" />
                  <IconChevronLeft size={20} className="hidden tv:block" />
                  {t("back")}
                </button>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white truncate tv:text-lg">{title}</span>
                  {subtitle && (
                    <span className="text-xs text-white/50 tv:text-sm">{subtitle}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Demo note */}
            <div className="flex justify-center pointer-events-none">
              <span className="rounded-full bg-black/40 backdrop-blur-sm px-3 py-1 text-[10px] text-white/30 border border-white/5">
                {t("demoNote")}
              </span>
            </div>

            {/* Bottom controls */}
            <div className="bg-gradient-to-t from-black/85 to-transparent px-4 pb-5 pt-8 pointer-events-auto tv:px-10 tv:pb-8 tv:pt-14">
              {/* Progress bar */}
              <div
                ref={progressRef}
                role="slider"
                aria-label="Seek"
                aria-valuenow={Math.floor(currentTime)}
                aria-valuemin={0}
                aria-valuemax={Math.floor(duration)}
                tabIndex={0}
                data-dpad
                className="relative mb-3 h-5 cursor-pointer flex items-center group"
                onClick={seek}
                onPointerDown={(e) => {
                  setDragging(true);
                  e.currentTarget.setPointerCapture(e.pointerId);
                  seek(e as unknown as React.MouseEvent<HTMLDivElement>);
                }}
                onPointerUp={(e) => {
                  setDragging(false);
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (dragging) seek(e as unknown as React.MouseEvent<HTMLDivElement>);
                }}
              >
                {/* Track */}
                <div className="absolute inset-y-0 flex items-center w-full">
                  <div className="relative w-full h-[3px] rounded-full bg-white/15 tv:h-1.5">
                    {/* Buffered */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                      style={{ width: `${bufferedPct}%` }}
                    />
                    {/* Played */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                    {/* Thumb */}
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-white shadow-md transition-transform",
                        "opacity-0 group-hover:opacity-100",
                        "tv:h-4 tv:w-4 tv:opacity-100"
                      )}
                      style={{ left: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Buttons row */}
              <div className="flex items-center gap-3 tv:gap-5">
                {/* Play/pause */}
                <button
                  onClick={togglePlay}
                  data-dpad
                  aria-label={playing ? t("pause") : t("play")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-white transition-all duration-100",
                    "hover:bg-white/10 active:scale-90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "tv:h-12 tv:w-12"
                  )}
                >
                  {playing ? (
                    <>
                      <IconPlayerPauseFilled size={20} className="tv:hidden" />
                      <IconPlayerPauseFilled size={28} className="hidden tv:block" />
                    </>
                  ) : (
                    <>
                      <IconPlayerPlayFilled size={20} className="translate-x-0.5 tv:hidden" />
                      <IconPlayerPlayFilled size={28} className="translate-x-0.5 hidden tv:block" />
                    </>
                  )}
                </button>

                {/* Time */}
                <span className="text-xs tabular-nums text-white/65 tv:text-sm">
                  {fmt(currentTime)}
                  <span className="mx-1 text-white/30">/</span>
                  {fmt(duration)}
                </span>

                <div className="ml-auto flex items-center gap-2 tv:gap-4">
                  {/* Mute */}
                  <button
                    onClick={toggleMute}
                    data-dpad
                    aria-label={muted ? t("unmute") : t("mute")}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-white/75 transition-all duration-100",
                      "hover:bg-white/10 hover:text-white active:scale-90",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      "tv:h-12 tv:w-12"
                    )}
                  >
                    {muted || volume === 0 ? (
                      <>
                        <IconVolumeOff size={18} className="tv:hidden" />
                        <IconVolumeOff size={24} className="hidden tv:block" />
                      </>
                    ) : (
                      <>
                        <IconVolume size={18} className="tv:hidden" />
                        <IconVolume size={24} className="hidden tv:block" />
                      </>
                    )}
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    data-dpad
                    aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-white/75 transition-all duration-100",
                      "hover:bg-white/10 hover:text-white active:scale-90",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      "tv:h-12 tv:w-12"
                    )}
                  >
                    {fullscreen ? (
                      <>
                        <IconMinimize size={18} className="tv:hidden" />
                        <IconMinimize size={24} className="hidden tv:block" />
                      </>
                    ) : (
                      <>
                        <IconMaximize size={18} className="tv:hidden" />
                        <IconMaximize size={24} className="hidden tv:block" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

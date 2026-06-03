"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IconMail, IconLock, IconUser, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const POSTER_SEEDS = [
  [3, 7, 11, 15, 19, 23],
  [5, 9, 13, 17, 21, 25],
  [2, 6, 10, 14, 18, 22],
];

const ease = [0.23, 1, 0.32, 1] as const;

export function AuthScreen() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.replace(`/${locale}/profile`);
  }, [user, locale, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "up" && !name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setLoading(true);
    try {
      if (mode === "in") {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      router.replace(`/${locale}`);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      {/* Poster mosaic */}
      <div className="absolute inset-0 flex gap-2 md:gap-3 pointer-events-none" aria-hidden>
        {POSTER_SEEDS.map((seeds, ci) => (
          <div
            key={ci}
            className="flex-1 flex flex-col gap-2 md:gap-3 will-change-transform"
            style={{
              animation: `scrollPoster ${22 + ci * 5}s linear infinite`,
              animationDirection: ci === 1 ? "reverse" : "normal",
            }}
          >
            {[...seeds, ...seeds].map((seed, i) => (
              <div
                key={i}
                className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-surface-card flex-shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/auth${seed}/240/360`}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-[#0a0a0a]/75 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]/80 pointer-events-none" />
      {/* Red cinematic glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 900,
          height: 600,
          background: "radial-gradient(ellipse, rgba(229,9,20,0.22) 0%, rgba(229,9,20,0.06) 40%, transparent 70%)",
          mixBlendMode: "screen",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        <div
          className="rounded-2xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl p-8"
          style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)" }}
        >
          {/* Logo */}
          <Link
            href={`/${locale}`}
            data-dpad
            className="flex flex-col items-center mb-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <span className="text-2xl font-black tracking-tight">
              Film<span className="text-primary">Space</span>
            </span>
            <span className="mt-1 text-xs text-white/35 font-medium">{t("tagline")}</span>
          </Link>

          {/* Mode toggle */}
          <div className="flex gap-1 mb-6 bg-white/[0.06] rounded-xl p-1">
            {(["in", "up"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                data-dpad
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  mode === m
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-white/45 hover:text-white/80"
                )}
              >
                {m === "in" ? t("signIn") : t("createAccount")}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <AnimatePresence initial={false}>
              {mode === "up" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <AuthField
                    icon={<IconUser size={15} />}
                    type="text"
                    placeholder={t("name")}
                    value={name}
                    onChange={setName}
                    required
                    autoComplete="name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AuthField
              icon={<IconMail size={15} />}
              type="email"
              placeholder={t("email")}
              value={email}
              onChange={setEmail}
              required
              autoComplete={mode === "in" ? "email" : "email"}
            />

            <div className="relative">
              <AuthField
                icon={<IconLock size={15} />}
                type={showPwd ? "text" : "password"}
                placeholder={t("password")}
                value={password}
                onChange={setPassword}
                required
                minLength={6}
                autoComplete={mode === "in" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
              >
                {showPwd ? <IconEyeOff size={15} /> : <IconEye size={15} />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-400 text-center py-1"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              data-dpad
              className={cn(
                "mt-1 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white",
                "transition-all duration-150 hover:bg-[#cc0812] active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-lg shadow-primary/20"
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("loading")}
                </span>
              ) : mode === "in" ? (
                t("signIn")
              ) : (
                t("createAccount")
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-white/25 leading-relaxed">
            {t("demoNote")}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function AuthField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
  minLength,
  autoComplete,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        data-dpad
        className={cn(
          "w-full rounded-xl border border-white/[0.09] bg-white/[0.05] pl-10 pr-4 py-3.5 text-sm text-white",
          "placeholder:text-white/30 transition-all duration-150",
          "focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] focus:ring-1 focus:ring-primary/30"
        )}
      />
    </div>
  );
}

import { useEffect, useState, type ReactNode } from "react";
import { avatarColor, initials } from "./data";
import { useI18n, type Lang } from "./i18n";
import { IX } from "./icons";

/* ---------------- logo ---------------- */

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#F0B24E" />
      <path
        d="M20 41c0 6 5.5 8.5 12 8.5S44 47 44 41c0-11-24-7.5-24-18 0-6 5.5-8.5 12-8.5S44 17 44 23"
        stroke="#0B281E"
        strokeWidth="5.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <LogoMark size={compact ? 30 : 36} />
      <div className="leading-none">
        <div
          className={`font-display font-bold tracking-tight ${compact ? "text-[15px]" : "text-[17px]"} ${light ? "text-[#f2f7f0]" : "text-ink"}`}
        >
          StaffHub <span className="text-marigold-500">360</span>
        </div>
        {!compact && (
          <div className={`text-[10px] font-medium tracking-[0.14em] uppercase mt-1 ${light ? "text-pine-200/70" : "text-mute"}`}>
            Hospitality OS
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- avatar ---------------- */

export function Avatar({ name, size = 34, ring = false }: { name: string; size?: number; ring?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full font-display font-semibold text-white shrink-0 ${ring ? "ring-2 ring-white shadow-sm" : ""}`}
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

/* ---------------- pill ---------------- */

const TONES: Record<string, { bg: string; fg: string; dot: string }> = {
  pine: { bg: "#e2efe7", fg: "#1b5a43", dot: "#256b52" },
  amber: { bg: "#f8eed6", fg: "#9d6212", dot: "#e89f2e" },
  clay: { bg: "#f8e3dc", fg: "#b04327", dot: "#ce5638" },
  slate: { bg: "#e5eaf3", fg: "#42536f", dot: "#54688c" },
  sea: { bg: "#dfeef1", fg: "#1f5d6a", dot: "#2e7d8c" },
};

export function Pill({
  tone = "pine",
  children,
  pulse = false,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  pulse?: boolean;
}) {
  const c = TONES[tone] ?? TONES.pine;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${pulse ? "blink" : ""}`} style={{ background: c.dot }} />
      {children}
    </span>
  );
}

/* ---------------- section head ---------------- */

export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
      <div>
        <h3 className="font-display font-bold text-[15.5px] text-ink leading-tight">{title}</h3>
        {sub && <p className="text-[12px] text-mute mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------------- modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(7,29,21,0.55)", backdropFilter: "blur(3px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card anim-pop w-full overflow-hidden flex flex-col"
        style={{ maxWidth: width, maxHeight: "88vh" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-line">
          <div>
            <h3 className="font-display font-bold text-[17px] text-ink">{title}</h3>
            {sub && <p className="text-[12px] text-mute mt-0.5">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mute hover:text-ink hover:bg-pine-50 transition-colors cursor-pointer"
            aria-label="close"
          >
            <IX size={17} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- language switch ---------------- */

const LANGS: { code: Lang; label: string }[] = [
  { code: "es", label: "ES" },
  { code: "pt", label: "PT" },
  { code: "en", label: "EN" },
];

export function LangSwitch({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={`inline-flex items-center rounded-full p-[3px] gap-[2px] ${dark ? "bg-white/10" : "bg-pine-50 border border-line"}`}
    >
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
            lang === l.code
              ? dark
                ? "bg-marigold-400 text-pine-950 shadow-sm"
                : "bg-pine-600 text-white shadow-sm"
              : dark
                ? "text-pine-200/80 hover:text-white"
                : "text-inksoft hover:text-pine-700"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- hooks ---------------- */

export function useCountUp(target: number, dur = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(target * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* ---------------- form field ---------------- */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label-xs block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

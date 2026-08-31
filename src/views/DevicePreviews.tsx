import { useEffect, useState } from "react";
import { nowTime } from "../data";
import { useI18n } from "../i18n";
import { IBattery, ICamera, ICheck, IFingerprint, IWifi, IX } from "../icons";
import { LogoMark } from "../ui";

function Overlay({ onClose, children, wide = false }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(7,29,21,0.62)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`relative anim-pop ${wide ? "w-full max-w-[720px]" : ""}`}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-marigold-400 text-pine-950 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
          aria-label="close"
        >
          <IX size={17} sw={2.2} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ================= kiosk screen (shared) ================= */

export function KioskScreen({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<"in" | "out">("in");
  const [auth, setAuth] = useState<"finger" | "pin">("finger");
  const [phase, setPhase] = useState<"idle" | "scan" | "ok">("idle");
  const [pin, setPin] = useState("");
  const [flash, setFlash] = useState(0);
  const [capturedAt, setCapturedAt] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const succeed = () => {
    setCapturedAt(nowTime());
    setFlash((f) => f + 1);
    setPhase("ok");
    setTimeout(() => {
      setPhase("idle");
      setPin("");
    }, 3400);
  };

  const pressFinger = () => {
    if (phase !== "idle") return;
    setPhase("scan");
    setTimeout(succeed, 1150);
  };

  const pressKey = (d: string) => {
    if (phase !== "idle") return;
    if (d === "C") return setPin("");
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      setPhase("scan");
      setTimeout(succeed, 700);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0"];

  return (
    <div className="sidebar-bg text-white grid grid-cols-1 sm:grid-cols-[1fr_1.25fr] relative overflow-hidden">
      {/* flash on capture */}
      {flash > 0 && <div key={flash} className="absolute inset-0 bg-white anim-flash z-20 pointer-events-none" />}

      {/* left: brand + clock */}
      <div className={`${compact ? "p-5" : "p-8"} flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-white/10`}>
        <div className="flex items-center gap-2.5">
          <LogoMark size={compact ? 26 : 30} />
          <span className={`font-display font-bold ${compact ? "text-[13px]" : "text-[15px]"}`}>
            StaffHub <span className="text-marigold-300">360</span>
          </span>
          <span className="ml-auto flex items-center gap-3 text-pine-200/80">
            <IWifi size={15} />
            <IBattery size={17} />
          </span>
        </div>
        <div className={compact ? "py-3" : "py-6"}>
          <div className={`font-mono font-semibold tabular-nums text-marigold-300 ${compact ? "text-[34px]" : "text-[52px]"} leading-none`}>
            {now.toLocaleTimeString(lang === "en" ? "en-US" : "es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </div>
          <div className={`text-pine-200/80 mt-3 capitalize ${compact ? "text-[11.5px]" : "text-[13px]"}`}>
            {now.toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "en" ? "en-US" : "es-MX", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div className="mt-5 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-widest text-pine-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-marigold-400 blink" />
            {t("venue")} · Kiosk 01
          </div>
        </div>
        <p className={`text-pine-200/50 ${compact ? "text-[9.5px]" : "text-[11px]"}`}>Android Enterprise · Lock Task Mode</p>
      </div>

      {/* right: clock-in UI */}
      <div className={`${compact ? "p-5" : "p-8"} flex flex-col`}>
        {phase === "ok" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center anim-pop">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-full bg-pine-500 text-white flex items-center justify-center anim-float">
                <ICheck size={26} sw={2.4} />
              </span>
              {/* captured polaroid */}
              <div className="bg-white p-1.5 pb-4 rounded-md shadow-xl -rotate-3 anim-pop">
                <div className="w-[74px] h-[74px] rounded-sm bg-gradient-to-b from-pine-800 to-pine-950 relative overflow-hidden">
                  <div className="absolute left-1/2 top-[24%] -translate-x-1/2 w-6 h-6 rounded-full bg-pine-200/70" />
                  <div className="absolute left-1/2 top-[52%] -translate-x-1/2 w-12 h-8 rounded-t-full bg-pine-200/70" />
                </div>
                <div className="font-mono text-[8.5px] text-pine-900 mt-1 font-semibold">{capturedAt}</div>
              </div>
            </div>
            <div className="font-display font-extrabold text-[22px] mt-4 text-marigold-300">
              {mode === "in" ? t("eco.kioskOk") : t("eco.kioskOutOk")}
            </div>
            <div className="font-mono text-[12px] text-pine-200/80 mt-1">
              {t("eco.kioskPhoto")} · {capturedAt}
            </div>
          </div>
        ) : (
          <>
            {/* ENTRADA / SALIDA */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.06] p-1.5">
              <button
                onClick={() => setMode("in")}
                className={`py-3 rounded-xl font-display font-extrabold tracking-wide transition-all cursor-pointer ${
                  mode === "in" ? "bg-pine-500 text-white shadow-lg scale-[1.02]" : "text-pine-200/60 hover:text-white"
                }`}
              >
                {t("eco.kioskIn")}
              </button>
              <button
                onClick={() => setMode("out")}
                className={`py-3 rounded-xl font-display font-extrabold tracking-wide transition-all cursor-pointer ${
                  mode === "out" ? "bg-clay-500 text-white shadow-lg scale-[1.02]" : "text-pine-200/60 hover:text-white"
                }`}
              >
                {t("eco.kioskOut")}
              </button>
            </div>

            {/* camera preview */}
            <div className="mt-3 rounded-xl bg-black/50 border border-white/10 relative overflow-hidden" style={{ height: compact ? 74 : 96 }}>
              <div className="absolute left-1/2 top-[30%] -translate-x-1/2 w-9 h-9 rounded-full bg-pine-200/25" />
              <div className="absolute left-1/2 top-[58%] -translate-x-1/2 w-16 h-10 rounded-t-full bg-pine-200/25" />
              {/* corner brackets */}
              {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2", "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map((c) => (
                <span key={c} className={`absolute w-3.5 h-3.5 border-marigold-400/80 rounded-[2px] ${c}`} />
              ))}
              {phase === "scan" && <span className="scanline" />}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-white/80 uppercase">
                <ICamera size={11} /> {t("eco.kioskCam")}
              </span>
              <span className="absolute bottom-2 right-2.5 flex items-center gap-1 text-[9px] font-mono font-bold text-clay-500">
                <span className="w-1.5 h-1.5 rounded-full bg-clay-500 blink" /> REC
              </span>
            </div>

            {/* auth */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex rounded-lg bg-white/[0.06] p-1 gap-1">
                {(["finger", "pin"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAuth(a)}
                    className={`px-3 py-1 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                      auth === a ? "bg-marigold-400 text-pine-950" : "text-pine-200/60 hover:text-white"
                    }`}
                  >
                    {a === "finger" ? t("eco.kioskFingerTab") : t("eco.kioskPinTab")}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-[10px] text-pine-200/50 font-mono">
                {phase === "scan" ? t("eco.kioskScanning") : "USB · BLE reader"}
              </span>
            </div>

            {auth === "finger" ? (
              <button
                onClick={pressFinger}
                disabled={phase !== "idle"}
                className={`mt-3 flex-1 min-h-[64px] rounded-2xl border flex items-center justify-center gap-3 font-display font-bold transition-all cursor-pointer ${
                  phase === "scan"
                    ? "bg-marigold-400/20 border-marigold-400 text-marigold-300 pulse-dot"
                    : "bg-white/[0.07] border-white/15 hover:border-marigold-400/60 hover:bg-white/[0.1] text-white"
                }`}
              >
                <IFingerprint size={26} className={phase === "scan" ? "blink" : ""} />
                <span className="text-[15px]">{phase === "scan" ? t("eco.kioskScanning") : t("eco.kioskFinger")}</span>
              </button>
            ) : (
              <div className="mt-3 flex-1 flex flex-col items-center justify-center">
                <div className="flex gap-2.5 mb-3">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`w-3 h-3 rounded-full border-2 transition-all ${
                        i < pin.length ? "bg-marigold-400 border-marigold-400 scale-110" : "border-pine-200/40"
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-6 gap-1.5 w-full max-w-[300px]">
                  {keys.map((k) => (
                    <button
                      key={k}
                      onClick={() => (k === "OK" ? undefined : pressKey(k))}
                      disabled={phase === "scan"}
                      className={`h-9 rounded-lg font-mono font-semibold text-[13px] transition-all cursor-pointer active:scale-95 ${
                        k === "C" ? "bg-white/5 text-pine-200/60 text-[11px]" : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      {k === "OK" ? "" : k}
                    </button>
                  ))}
                </div>
                <p className="text-[9.5px] text-pine-200/40 mt-2">{t("dev.pinHint")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ================= framed overlay (sidebar entry) ================= */

export function KioskPreview({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Overlay onClose={onClose} wide>
      <div className="mx-auto rounded-[30px] border-[12px] border-pine-950 bg-pine-950 shadow-2xl overflow-hidden">
        <KioskScreen />
      </div>
      <p className="text-center text-[12px] text-pine-200 mt-4 font-semibold">
        {t("dev.kioskTitle")} · <span className="text-pine-200/70 font-normal">{t("dev.interactive")}</span>
      </p>
    </Overlay>
  );
}

import { useEffect, useState } from "react";
import { nowTime } from "../data";
import { useI18n } from "../i18n";
import { IBattery, ICalendar, IChat, IClock, IFingerprint, IGrid, IWifi, IX } from "../icons";
import { Avatar, LogoMark } from "../ui";

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
      <div className={`relative anim-pop ${wide ? "w-full max-w-[680px]" : ""}`}>
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

/* ================= phone preview ================= */

export function PhonePreview({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "scanning" | "onShift">("idle");
  const [markedAt, setMarkedAt] = useState("");

  const punch = () => {
    if (state === "scanning") return;
    if (state === "onShift") {
      setState("idle");
      return;
    }
    setState("scanning");
    setTimeout(() => {
      setMarkedAt(nowTime());
      setState("onShift");
    }, 1000);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="mx-auto w-[300px] rounded-[40px] border-[10px] border-pine-950 bg-pine-950 shadow-2xl overflow-hidden">
        {/* notch */}
        <div className="h-7 bg-pine-950 flex items-center justify-center relative">
          <div className="w-24 h-4 bg-black rounded-full" />
          <span className="absolute right-4 text-[10px] font-mono text-pine-200">{nowTime()}</span>
        </div>

        <div className="bg-canvas min-h-[540px] flex flex-col">
          {/* header */}
          <div className="sidebar-bg text-white px-5 pt-4 pb-6 rounded-b-[22px]">
            <div className="flex items-center gap-2.5">
              <LogoMark size={26} />
              <span className="font-display font-bold text-[14px]">StaffHub <span className="text-marigold-300">360</span></span>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-marigold-400 blink" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name="Lucía Fernández" size={40} ring />
              <div>
                <div className="font-display font-bold text-[17px] leading-tight">{t("dev.hello")}, Lucía</div>
                <div className="text-[11px] text-pine-200/80">{t("venue")}</div>
              </div>
            </div>
          </div>

          <div className="px-4 -mt-3 space-y-3 flex-1">
            {/* hours balance */}
            <div className="card p-4">
              <div className="flex justify-between text-[11.5px] font-semibold">
                <span className="text-inksoft">{t("dev.balance")}</span>
                <span className="font-mono text-pine-700">72h {t("dev.of")} 160h</span>
              </div>
              <div className="h-[8px] rounded-full bg-line/70 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-pine-500 bar-grow" style={{ width: "45%" }} />
              </div>
            </div>

            {/* next shift */}
            <div className="card p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-marigold-200/60 text-marigold-700 flex items-center justify-center">
                <ICalendar size={18} />
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-ink">{t("dev.myShifts")}</div>
                <div className="text-[11.5px] text-mute font-mono">13:00 – 21:00 · {t("dept.hall")}</div>
              </div>
              <span className="ml-auto text-[10.5px] font-bold text-marigold-700 bg-marigold-200/50 rounded-full px-2.5 py-1 whitespace-nowrap">
                {t("dev.nextShift")}
              </span>
            </div>

            {/* punch button */}
            <button
              onClick={punch}
              disabled={state === "scanning"}
              className={`w-full rounded-2xl py-5 font-display font-bold text-[16px] transition-all cursor-pointer shadow-lg active:scale-[0.98] ${
                state === "onShift"
                  ? "bg-marigold-400 text-pine-950 border border-marigold-500"
                  : "bg-pine-600 text-white border border-pine-700 pulse-dot"
              }`}
            >
              {state === "scanning" ? (
                <span className="flex items-center justify-center gap-2">
                  <IFingerprint size={20} className="blink" />
                  {t("dev.biometric")}…
                </span>
              ) : state === "onShift" ? (
                <>
                  {t("dev.onShiftSince")} <span className="font-mono">{markedAt}</span>
                  <span className="block text-[11px] font-sans font-semibold mt-1 opacity-80">{t("dev.clockOut")}</span>
                </>
              ) : (
                <>
                  <IClock size={20} className="inline -mt-1 mr-2" />
                  {t("dev.clockIn")}
                </>
              )}
            </button>

            {state === "onShift" && (
              <div className="card p-3 flex items-center gap-2.5 anim-pop border-pine-200 bg-pine-50">
                <span className="w-7 h-7 rounded-full bg-pine-600 text-white flex items-center justify-center">
                  <IFingerprint size={14} />
                </span>
                <div className="text-[11.5px] font-semibold text-pine-700">
                  {t("dev.biometric")} · {t("dev.marked")} {markedAt}
                </div>
              </div>
            )}
          </div>

          {/* bottom nav */}
          <div className="flex items-center justify-around px-6 py-3 border-t border-line bg-surface">
            {[IGrid, ICalendar, IChat].map((Icon, i) => (
              <Icon key={i} size={19} className={i === 0 ? "text-pine-600" : "text-mute"} />
            ))}
          </div>
        </div>
      </div>
      <p className="text-center text-[12px] text-pine-200 mt-4 font-semibold">
        {t("dev.appTitle")} · <span className="text-pine-200/70 font-normal">{t("dev.interactive")}</span>
      </p>
    </Overlay>
  );
}

/* ================= kiosk preview ================= */

export function KioskPreview({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const [pin, setPin] = useState("");
  const [phase, setPhase] = useState<"pin" | "checking" | "done">("pin");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const press = (d: string) => {
    if (phase !== "pin") return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      setPhase("checking");
      setTimeout(() => {
        setPhase("done");
        setTimeout(() => {
          setPin("");
          setPhase("pin");
        }, 2800);
      }, 900);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"];

  return (
    <Overlay onClose={onClose} wide>
      <div className="mx-auto rounded-[30px] border-[12px] border-pine-950 bg-pine-950 shadow-2xl overflow-hidden">
        <div className="sidebar-bg text-white grid grid-cols-1 sm:grid-cols-2 min-h-[400px]">
          {/* left: brand + clock */}
          <div className="p-8 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-white/10">
            <div className="flex items-center gap-2.5">
              <LogoMark size={30} />
              <span className="font-display font-bold text-[15px]">StaffHub <span className="text-marigold-300">360</span></span>
              <span className="ml-auto flex items-center gap-3 text-pine-200/80">
                <IWifi size={15} />
                <IBattery size={17} />
              </span>
            </div>
            <div className="py-6">
              <div className="font-mono font-semibold text-[52px] leading-none tabular-nums text-marigold-300">
                {now.toLocaleTimeString(lang === "en" ? "en-US" : "es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </div>
              <div className="text-[13px] text-pine-200/80 mt-3 capitalize">
                {now.toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "en" ? "en-US" : "es-MX", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-pine-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-marigold-400 blink" />
                {t("venue")} · Kiosk 01
              </div>
            </div>
            <p className="text-[11px] text-pine-200/50">Android Enterprise · Lock Task Mode</p>
          </div>

          {/* right: PIN pad / success */}
          <div className="p-8 flex flex-col items-center justify-center">
            {phase === "done" ? (
              <div className="text-center anim-pop">
                <div className="mx-auto w-16 h-16 rounded-full bg-marigold-400 text-pine-950 flex items-center justify-center anim-float">
                  <IFingerprint size={30} sw={1.5} />
                </div>
                <div className="font-display font-extrabold text-[26px] mt-4 text-marigold-300">
                  {t("dev.welcome")}, Carla!
                </div>
                <div className="font-mono text-[13px] text-pine-200/80 mt-1">
                  {t("dev.marked")} {nowTime()} · {t("dept.reception")}
                </div>
              </div>
            ) : (
              <>
                <div className="text-[13.5px] font-semibold text-pine-100 mb-4 text-center">
                  {phase === "checking" ? t("dev.biometric") + "…" : t("dev.pin")}
                </div>
                <div className="flex gap-3 mb-6">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        i < pin.length ? "bg-marigold-400 border-marigold-400 scale-110" : "border-pine-200/40"
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
                  {keys.map((k) => (
                    <button
                      key={k}
                      onClick={() => (k === "C" ? setPin("") : k === "OK" ? undefined : press(k))}
                      disabled={phase === "checking"}
                      className={`h-12 rounded-xl font-mono font-semibold text-[17px] transition-all cursor-pointer active:scale-95 ${
                        k === "OK"
                          ? "bg-marigold-400 text-pine-950 hover:bg-marigold-300"
                          : k === "C"
                            ? "bg-white/5 text-pine-200/70 hover:bg-white/10 text-[13px]"
                            : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <p className="text-[10.5px] text-pine-200/50 mt-4">{t("dev.pinHint")}</p>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="text-center text-[12px] text-pine-200 mt-4 font-semibold">
        {t("dev.kioskTitle")} · <span className="text-pine-200/70 font-normal">{t("dev.interactive")}</span>
      </p>
    </Overlay>
  );
}


import { useEffect, useRef, useState } from "react";
import { LESSONS, SHIFT_META, VENUES, nowTime, todayIndex, weekDates, fmtDate, type ShiftType } from "../data";
import { useI18n, type Lang } from "../i18n";
import {
  IBattery,
  ICalendar,
  ICheck,
  IClock,
  ICoffee,
  IFingerprint,
  IGrid,
  IHeart,
  ILogout,
  IPlay,
  ISend,
  IStar,
  IUsers,
  IWifi,
  IZap,
} from "../icons";
import { Avatar, LogoMark, Pill, useNow } from "../ui";

type Screen = "home" | "schedule" | "training" | "profile";

/* ================= architecture tree ================= */

interface TreeNode {
  name: string;
  type: "dir" | "file";
  screen?: Screen;
  note?: string;
  children?: TreeNode[];
}

const TREE: TreeNode = {
  name: "staffhub-mobile/",
  type: "dir",
  note: "Expo SDK 52 · TypeScript",
  children: [
    {
      name: "app/",
      type: "dir",
      note: "Expo Router",
      children: [
        {
          name: "(tabs)/",
          type: "dir",
          children: [
            { name: "index.tsx", type: "file", screen: "home", note: "Inicio + fichaje" },
            { name: "schedule.tsx", type: "file", screen: "schedule", note: "Mis turnos" },
            { name: "training.tsx", type: "file", screen: "training", note: "Feed TikTok" },
            { name: "profile.tsx", type: "file", screen: "profile", note: "Perfil + i18n" },
          ],
        },
        { name: "clock-in.tsx", type: "file", note: "expo-local-authentication" },
        { name: "video-call.tsx", type: "file", note: "react-native-webrtc" },
      ],
    },
    {
      name: "src/",
      type: "dir",
      children: [
        { name: "components/", type: "dir", note: "ShiftCard · PunchButton · Avatar", children: [] },
        { name: "stores/", type: "dir", note: "Zustand", children: [
          { name: "authStore.ts", type: "file" },
          { name: "shiftStore.ts", type: "file" },
          { name: "notifStore.ts", type: "file" },
        ]},
        { name: "services/", type: "dir", children: [
          { name: "api.ts", type: "file", note: "REST + GraphQL" },
          { name: "socket.ts", type: "file", note: "Socket.io" },
          { name: "webrtc.ts", type: "file" },
        ]},
        { name: "i18n/", type: "dir", note: "i18n-js", children: [
          { name: "es.ts", type: "file" },
          { name: "pt.ts", type: "file" },
          { name: "en.ts", type: "file" },
        ]},
      ],
    },
    { name: "eas.json", type: "file", note: "EAS Build · iOS / Android" },
  ],
};

function TreeRow({ node, depth, onPick, activeScreen }: { node: TreeNode; depth: number; onPick: (s: Screen) => void; activeScreen: Screen | null }) {
  const isDir = node.type === "dir";
  const clickable = !!node.screen;
  const active = clickable && node.screen === activeScreen;
  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-lg px-2 py-[5px] group ${clickable ? "cursor-pointer hover:bg-white/[0.07]" : ""} ${active ? "bg-marigold-400/15" : ""}`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => clickable && onPick(node.screen!)}
      >
        {isDir ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f0b24e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7Z" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={active ? "#f0b24e" : "#7fa392"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V5A1.5 1.5 0 0 1 6.5 3.5Z" />
            <path d="M14 3.5V8h4.5" />
          </svg>
        )}
        <span className={`font-mono text-[12px] ${isDir ? "text-pine-100 font-semibold" : clickable ? "text-pine-200 group-hover:text-white" : "text-pine-200/70"}`}>
          {node.name}
        </span>
        {node.note && (
          <span className={`text-[10px] font-mono ${active ? "text-marigold-300" : "text-pine-200/40"}`}>
            {clickable ? "→ " : "· "}{node.note}
          </span>
        )}
        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-marigold-400 blink shrink-0" />}
      </div>
      {node.children?.map((c) => (
        <TreeRow key={c.name} node={c} depth={depth + 1} onPick={onPick} activeScreen={activeScreen} />
      ))}
    </div>
  );
}

/* ================= phone screen data ================= */

const LUCIA_SHIFTS: { day: number; start: string; end: string; type: ShiftType }[] = [
  { day: 0, start: "07:00", end: "15:00", type: "morning" },
  { day: 1, start: "07:00", end: "15:00", type: "morning" },
  { day: 3, start: "13:00", end: "21:00", type: "afternoon" },
  { day: 4, start: "13:00", end: "21:00", type: "afternoon" },
  { day: 5, start: "13:00", end: "22:00", type: "night" },
];

const STACK = ["Expo SDK 52", "Expo Router", "Zustand", "i18n-js", "expo-camera", "expo-local-authentication", "react-native-webrtc", "MMKV", "EAS Build"];

const PUSHES_ES = [
  "Turno del lunes confirmado · 07:00–15:00",
  "Nuevo micro-curso disponible: Higiene y alérgenos",
];

export default function MobileLab({ onExit }: { onExit: () => void }) {
  const { t, lang, setLang } = useI18n();
  const now = useNow(1000);
  const today = todayIndex();
  const dates = weekDates(0);

  const [splash, setSplash] = useState(true);
  const [screen, setScreen] = useState<Screen>("home");
  const [selDay, setSelDay] = useState(today);
  const [punch, setPunch] = useState<"idle" | "scan" | "on">("idle");
  const [markedAt, setMarkedAt] = useState("");
  const [push, setPush] = useState<string | null>(null);
  const [pushCount, setPushCount] = useState(0);
  const [miniToast, setMiniToast] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  const pushIdx = useRef(0);
  const miniTimer = useRef<number | null>(null);

  /* splash */
  useEffect(() => {
    const id = setTimeout(() => setSplash(false), 1600);
    return () => clearTimeout(id);
  }, []);

  /* simulated pushes */
  useEffect(() => {
    const fire = () => {
      setPush(PUSHES_ES[pushIdx.current % PUSHES_ES.length]);
      pushIdx.current += 1;
      setPushCount((c) => c + 1);
    };
    const a = setTimeout(fire, 5000);
    const b = setInterval(fire, 24000);
    return () => {
      clearTimeout(a);
      clearInterval(b);
    };
  }, []);

  const showMini = (msg: string) => {
    setMiniToast(msg);
    if (miniTimer.current) window.clearTimeout(miniTimer.current);
    miniTimer.current = window.setTimeout(() => setMiniToast(null), 2200);
  };

  const doPunch = () => {
    if (punch === "scan") return;
    if (punch === "on") {
      setPunch("idle");
      showMini(t("dev.clockOut") + " · " + nowTime());
      return;
    }
    setPunch("scan");
    setTimeout(() => {
      setMarkedAt(nowTime());
      setPunch("on");
    }, 1100);
  };

  const pick = (s: Screen) => {
    setScreen(s);
    setFlash((f) => f + 1);
    setTimeout(() => setFlash(0), 900);
  };

  const myShifts = LUCIA_SHIFTS.filter((s) => s.day === selDay);
  const weekH = LUCIA_SHIFTS.reduce((acc, s) => {
    const [h1, m1] = s.start.split(":").map(Number);
    const [h2, m2] = s.end.split(":").map(Number);
    return acc + (h2 * 60 + m2 - h1 * 60 - m1) / 60;
  }, 0);

  const hour = now.getHours();
  const greetKey = hour < 12 ? "dash.greet.morning" : hour < 19 ? "dash.greet.afternoon" : "dash.greet.evening";

  const TABS: { id: Screen; icon: typeof IGrid; label: string }[] = [
    { id: "home", icon: IGrid, label: t("mob.tab.home") },
    { id: "schedule", icon: ICalendar, label: t("mob.tab.schedule") },
    { id: "training", icon: IPlay, label: t("mob.tab.training") },
    { id: "profile", icon: IUsers, label: t("mob.tab.profile") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("mob.title")}</h1>
          <p className="text-[13.5px] text-mute mt-1.5 flex items-center gap-2">
            {t("mob.sub")}
            <Pill tone="amber"><IZap size={11} /> {t("dev.interactive")}</Pill>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="pine" pulse>{t("mob.socket")}</Pill>
          <Pill tone="slate">{t("mob.push")}</Pill>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[430px_1fr] gap-4">
        {/* ================= phone stage ================= */}
        <div
          className="relative rounded-[26px] p-6 flex flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(120% 80% at 80% -10%, rgba(240,178,78,0.14), transparent 55%), radial-gradient(90% 60% at 0% 110%, rgba(61,133,103,0.3), transparent 55%), linear-gradient(178deg,#0d2f23,#071d15)",
            minHeight: 700,
          }}
        >
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(#f0b24e 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

          {/* floating spec chips */}
          <span className="absolute top-5 left-5 text-[10px] font-mono font-semibold text-pine-200/70 border border-white/10 rounded-full px-2.5 py-1 bg-white/[0.04] anim-float">
            v2.4.1 · build 88
          </span>
          <span className="absolute bottom-5 right-5 text-[10px] font-mono font-semibold text-marigold-300/90 border border-marigold-400/25 rounded-full px-2.5 py-1 bg-marigold-400/[0.07] anim-float" style={{ animationDelay: "1.2s" }}>
            iOS 17 · Android 14
          </span>

          {/* phone */}
          <div
            className={`relative w-[292px] rounded-[42px] border-[10px] border-pine-950 bg-pine-950 shadow-2xl overflow-hidden transition-shadow ${flash ? "ring-4 ring-marigold-400/70" : ""}`}
            style={{ boxShadow: "0 40px 80px -30px rgba(0,0,0,0.75)" }}
          >
            {/* side buttons */}
            <span className="absolute -left-[13px] top-24 w-[3px] h-10 rounded-l bg-pine-800" />
            <span className="absolute -left-[13px] top-40 w-[3px] h-16 rounded-l bg-pine-800" />
            <span className="absolute -right-[13px] top-32 w-[3px] h-14 rounded-r bg-pine-800" />

            {/* status bar */}
            <div className="h-8 bg-pine-950 flex items-center justify-between px-5 relative z-20">
              <span className="font-mono text-[10.5px] font-semibold text-pine-100 tabular-nums">
                {now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
              <div className="w-20 h-[18px] bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-[6px]" />
              <span className="flex items-center gap-1.5 text-pine-100">
                <span className="flex items-end gap-[2px]">
                  <span className="w-[3px] h-[5px] bg-pine-100 rounded-[1px]" />
                  <span className="w-[3px] h-[7px] bg-pine-100 rounded-[1px]" />
                  <span className="w-[3px] h-[9px] bg-pine-100 rounded-[1px]" />
                  <span className="w-[3px] h-[11px] bg-pine-100/40 rounded-[1px]" />
                </span>
                <IWifi size={12} />
                <IBattery size={15} />
              </span>
            </div>

            {/* push banner */}
            {push && !splash && (
              <button
                onClick={() => setPush(null)}
                className="absolute top-9 left-2.5 right-2.5 z-30 anim-push-down cursor-pointer"
              >
                <div className="rounded-2xl bg-pine-950/95 backdrop-blur border border-white/15 px-3.5 py-2.5 flex items-center gap-2.5 shadow-xl text-left">
                  <span className="w-8 h-8 rounded-[9px] bg-marigold-400 flex items-center justify-center shrink-0">
                    <LogoMark size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] font-bold text-marigold-300 uppercase tracking-wider">StaffHub Go · push</div>
                    <div className="text-[11.5px] text-white leading-snug mt-0.5">{push}</div>
                  </div>
                  <span className="w-4.5 h-4.5 rounded-full bg-marigold-400 text-pine-950 text-[9px] font-bold flex items-center justify-center shrink-0">
                    {pushCount}
                  </span>
                </div>
              </button>
            )}

            {/* splash */}
            {splash ? (
              <div className="sidebar-bg min-h-[560px] flex flex-col items-center justify-center gap-4">
                <div className="anim-pop"><LogoMark size={64} /></div>
                <div className="font-display font-bold text-[17px] text-white anim-fade-up" style={{ animationDelay: "0.25s" }}>
                  StaffHub <span className="text-marigold-300">Go</span>
                </div>
                <div className="w-28 h-[3px] rounded-full bg-white/10 overflow-hidden anim-fade-up" style={{ animationDelay: "0.4s" }}>
                  <div className="h-full bg-marigold-400 bar-grow" style={{ animationDuration: "1.3s" }} />
                </div>
                <div className="text-[10.5px] text-pine-200/60 font-mono">{t("mob.splash")}</div>
              </div>
            ) : (
              <div className="bg-canvas min-h-[560px] flex flex-col">
                {/* screens */}
                <div className="flex-1 overflow-y-auto">
                  {/* ---------- HOME ---------- */}
                  {screen === "home" && (
                    <div key={"home" + flash} className="anim-slide-in pb-2">
                      <div className="sidebar-bg text-white px-4 pt-3 pb-6 rounded-b-[22px]">
                        <div className="flex items-center gap-2.5">
                          <Avatar name="Lucía Fernández" size={36} ring />
                          <div className="min-w-0">
                            <div className="font-display font-bold text-[15px] leading-tight truncate">{t(greetKey)}, Lucía</div>
                            <div className="text-[10.5px] text-pine-200/75">{VENUES[0].name}</div>
                          </div>
                          <span className="ml-auto relative">
                            <IUsers size={17} className="text-pine-200/80" />
                            {pushCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-marigold-400 text-[8px] font-bold text-pine-950 flex items-center justify-center">{pushCount}</span>
                            )}
                          </span>
                        </div>
                        <div className="font-mono font-bold text-[30px] leading-none mt-4 tabular-nums text-marigold-300">
                          {now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                        </div>
                        <div className="text-[10.5px] text-pine-200/70 mt-1.5 capitalize">
                          {now.toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "en" ? "en-US" : "es-MX", { weekday: "long", day: "numeric", month: "long" })}
                        </div>
                      </div>

                      <div className="px-3.5 -mt-3.5 space-y-2.5">
                        {/* punch card */}
                        <div className="card p-3.5">
                          <button
                            onClick={doPunch}
                            disabled={punch === "scan"}
                            className={`w-full rounded-xl py-3.5 font-display font-bold text-[14.5px] transition-all cursor-pointer active:scale-[0.98] ${
                              punch === "on" ? "bg-marigold-400 text-pine-950" : punch === "scan" ? "bg-pine-700 text-pine-200" : "bg-pine-600 text-white pulse-dot"
                            }`}
                          >
                            {punch === "scan" ? (
                              <span className="flex items-center justify-center gap-2"><IFingerprint size={18} className="blink" /> {t("dev.biometric")}…</span>
                            ) : punch === "on" ? (
                              <span>{t("dev.onShiftSince")} <span className="font-mono">{markedAt}</span> · {t("dev.clockOut")}</span>
                            ) : (
                              <span className="flex items-center justify-center gap-2"><IClock size={17} /> {t("dev.clockIn")}</span>
                            )}
                          </button>
                          {punch === "on" && (
                            <div className="flex items-center gap-2 mt-2.5 text-[10.5px] font-semibold text-pine-700 anim-pop">
                              <IFingerprint size={13} /> {t("dev.biometric")} ✓ · {t("dev.marked")} {markedAt}
                            </div>
                          )}
                        </div>

                        {/* today shift */}
                        <div className="card p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-ink">{t("mob.todayShift")}</span>
                            <span className="font-mono text-[10.5px] font-semibold text-pine-700">{LUCIA_SHIFTS.filter((s) => s.day === today).length ? "13:00 – 21:00" : "—"}</span>
                          </div>
                          <div className="h-[6px] rounded-full bg-line/70 mt-2 overflow-hidden">
                            <div className="h-full rounded-full bg-pine-500 bar-grow" style={{ width: today >= 3 ? "55%" : "20%", animationDelay: "0.3s" }} />
                          </div>
                          <div className="flex items-center gap-2 mt-2.5">
                            <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 text-white" style={{ background: SHIFT_META.afternoon.solid }}>
                              {t("shift.afternoon")}
                            </span>
                            <span className="text-[10.5px] text-mute">{t("dept.hall")} · 8h</span>
                          </div>
                        </div>

                        {/* quick actions */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <button onClick={() => showMini(t("mob.breakSent"))} className="card p-3 text-left hover:border-pine-400 transition-colors cursor-pointer active:scale-[0.98]">
                            <ICoffee size={16} className="text-marigold-600" />
                            <div className="text-[11.5px] font-bold text-ink mt-1.5">{t("mob.break")}</div>
                          </button>
                          <button onClick={() => showMini(t("mob.lateSent"))} className="card p-3 text-left hover:border-pine-400 transition-colors cursor-pointer active:scale-[0.98]">
                            <ISend size={16} className="text-sea-500" />
                            <div className="text-[11.5px] font-bold text-ink mt-1.5">{t("mob.late")}</div>
                          </button>
                        </div>

                        {/* balance */}
                        <div className="card p-3.5">
                          <div className="flex justify-between text-[10.5px] font-bold">
                            <span className="text-ink">{t("dev.balance")}</span>
                            <span className="font-mono text-pine-700">72h {t("dev.of")} 160h</span>
                          </div>
                          <div className="h-[6px] rounded-full bg-line/70 mt-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-marigold-400 bar-grow" style={{ width: "45%", animationDelay: "0.45s" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---------- SCHEDULE ---------- */}
                  {screen === "schedule" && (
                    <div key={"sch" + flash} className="anim-slide-in p-3.5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-display font-bold text-[16px] text-ink">{t("mob.tab.schedule")}</span>
                        <span className="font-mono text-[11px] font-bold text-pine-700">{Math.round(weekH)}h / {t("common.week").toLowerCase()}</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mt-3">
                        {dates.map((d, i) => (
                          <button
                            key={i}
                            onClick={() => setSelDay(i)}
                            className={`rounded-xl py-2 text-center transition-all cursor-pointer ${
                              selDay === i ? "bg-pine-600 text-white shadow-sm scale-105" : "bg-surface border border-line text-inksoft hover:border-pine-400"
                            }`}
                          >
                            <div className={`text-[8.5px] font-bold uppercase ${selDay === i ? "text-pine-200" : "text-mute"}`}>{t("day." + i)}</div>
                            <div className="font-mono text-[11px] font-bold mt-0.5">{d.getDate()}</div>
                            <div className={`mx-auto mt-1 w-1 h-1 rounded-full ${LUCIA_SHIFTS.some((s) => s.day === i) ? (selDay === i ? "bg-marigold-300" : "bg-marigold-500") : "bg-transparent"}`} />
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 space-y-2">
                        {myShifts.length === 0 && (
                          <div className="card p-6 text-center">
                            <ICoffee size={20} className="mx-auto text-mute" />
                            <div className="text-[12.5px] font-semibold text-ink mt-2">{t("sched.empty")}</div>
                            <div className="text-[10.5px] text-mute mt-0.5">{fmtDate(dates[selDay], lang)}</div>
                          </div>
                        )}
                        {myShifts.map((s, i) => {
                          const sm = SHIFT_META[s.type];
                          return (
                            <div key={i} className="card overflow-hidden anim-fade-up" style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
                              <div className="flex">
                                <div className="w-1.5" style={{ background: sm.solid }} />
                                <div className="flex-1 p-3 flex items-center gap-3">
                                  <div>
                                    <div className="font-mono font-bold text-[15px] text-ink">{s.start}–{s.end}</div>
                                    <div className="text-[10.5px] text-mute mt-0.5">{fmtDate(dates[s.day], lang)} · {t("dept.hall")}</div>
                                  </div>
                                  <span className="ml-auto text-[10px] font-bold rounded-full px-2.5 py-1 text-white" style={{ background: sm.solid }}>
                                    {t("shift." + s.type)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ---------- TRAINING ---------- */}
                  {screen === "training" && (
                    <div key={"trn" + flash} className="anim-slide-in p-3.5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-display font-bold text-[16px] text-ink">{t("mob.tab.training")}</span>
                        <span className="font-mono text-[11px] font-bold text-pine-700">68%</span>
                      </div>
                      <div className="h-[5px] rounded-full bg-line/70 mt-2 overflow-hidden">
                        <div className="h-full rounded-full bg-marigold-400 bar-grow" style={{ width: "68%" }} />
                      </div>
                      <div className="flex gap-2.5 overflow-x-auto mt-3 pb-1 snap-x" style={{ scrollSnapType: "x mandatory" }}>
                        {LESSONS.slice(0, 4).map((l) => {
                          const isPlay = playing === l.id;
                          return (
                            <button
                              key={l.id}
                              onClick={() => setPlaying((p) => (p === l.id ? null : l.id))}
                              className="relative shrink-0 w-[128px] rounded-2xl overflow-hidden cursor-pointer group snap-start text-left"
                              style={{ aspectRatio: "9/15" }}
                            >
                              <img src={l.cover} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                              <div className="absolute inset-0 bg-gradient-to-b from-pine-950/40 via-transparent to-pine-950/85" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                {isPlay ? (
                                  <span className="flex items-end gap-[2.5px] h-5 anim-pop">
                                    <span className="eq-bar h-5" /><span className="eq-bar h-5" /><span className="eq-bar h-5" />
                                  </span>
                                ) : (
                                  <span className="w-9 h-9 rounded-full bg-white/15 backdrop-blur border border-white/30 flex items-center justify-center text-white group-hover:bg-marigold-400 group-hover:text-pine-950 transition-colors">
                                    <IPlay size={14} className="translate-x-[1px]" />
                                  </span>
                                )}
                              </div>
                              <div className="absolute bottom-2 left-2 right-2">
                                <div className="text-[10px] font-bold text-white leading-tight line-clamp-2">{t(l.title)}</div>
                                <div className="font-mono text-[8.5px] text-white/70 mt-0.5">{l.duration}</div>
                              </div>
                              {isPlay && <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/20"><div className="h-full bg-marigold-400 bar-grow" style={{ animationDuration: "10s", animationIterationCount: "infinite", animationTimingFunction: "linear" }} /></div>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="card p-3 mt-2.5 flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-marigold-200/60 text-marigold-700 flex items-center justify-center"><IStar size={15} /></span>
                        <div className="min-w-0">
                          <div className="text-[11.5px] font-bold text-ink">{t("mob.streak")}</div>
                          <div className="text-[10px] text-mute">{t("mob.streakSub")}</div>
                        </div>
                        <span className="ml-auto font-mono font-bold text-[14px] text-marigold-600">12d</span>
                      </div>
                    </div>
                  )}

                  {/* ---------- PROFILE ---------- */}
                  {screen === "profile" && (
                    <div key={"prf" + flash} className="anim-slide-in p-3.5">
                      <div className="card p-4 text-center">
                        <Avatar name="Lucía Fernández" size={56} />
                        <div className="font-display font-bold text-[15.5px] text-ink mt-2">Lucía Fernández</div>
                        <div className="text-[10.5px] text-mute">Camarera · {VENUES[0].name}</div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {[
                            { v: "72h", l: t("mob.month") },
                            { v: "4.8", l: t("mob.score") },
                            { v: "12d", l: t("mob.streakS") },
                          ].map((k) => (
                            <div key={k.l} className="rounded-xl bg-canvas border border-line py-2">
                              <div className="font-mono font-bold text-[13.5px] text-pine-700">{k.v}</div>
                              <div className="text-[9px] font-semibold text-mute uppercase tracking-wide mt-0.5">{k.l}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card p-3.5 mt-2.5">
                        <div className="text-[11px] font-bold text-ink mb-2">{t("mob.langs")}</div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["es", "pt", "en"] as Lang[]).map((l) => (
                            <button
                              key={l}
                              onClick={() => setLang(l)}
                              className={`rounded-lg py-2 text-[11.5px] font-bold uppercase transition-all cursor-pointer ${
                                lang === l ? "bg-pine-600 text-white" : "bg-canvas border border-line text-inksoft hover:border-pine-400"
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                        <p className="text-[9.5px] text-mute mt-2 leading-snug">{t("mob.langsNote")}</p>
                      </div>

                      <div className="card p-3.5 mt-2.5">
                        <div className="text-[11px] font-bold text-ink mb-2">{t("mob.badges")}</div>
                        <div className="flex gap-1.5 flex-wrap">
                          {[
                            { icon: <ICheck size={11} />, l: t("mob.badge1") },
                            { icon: <IStar size={11} />, l: t("mob.badge2") },
                            { icon: <IZap size={11} />, l: t("mob.badge3") },
                          ].map((b) => (
                            <span key={b.l} className="inline-flex items-center gap-1.5 rounded-full bg-marigold-200/50 border border-marigold-300/60 text-marigold-700 px-2.5 py-1 text-[10px] font-bold">
                              {b.icon} {b.l}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button onClick={onExit} className="w-full mt-2.5 rounded-xl border border-clay-500/40 text-clay-600 py-3 text-[12.5px] font-bold flex items-center justify-center gap-2 hover:bg-clay-100 transition-colors cursor-pointer active:scale-[0.98]">
                        <ILogout size={15} /> {t("nav.logout")}
                      </button>
                    </div>
                  )}
                </div>

                {/* mini toast */}
                {miniToast && (
                  <div className="absolute bottom-[74px] left-1/2 -translate-x-1/2 z-30 anim-pop">
                    <div className="rounded-full bg-pine-950 text-white text-[11px] font-semibold px-4 py-2 shadow-xl flex items-center gap-1.5 whitespace-nowrap">
                      <ICheck size={12} className="text-marigold-300" sw={2.4} /> {miniToast}
                    </div>
                  </div>
                )}

                {/* bottom tabs */}
                <div className="flex items-center justify-around px-3 py-2.5 border-t border-line bg-surface relative z-10">
                  {TABS.map((tab) => {
                    const active = screen === tab.id;
                    return (
                      <button key={tab.id} onClick={() => setScreen(tab.id)} className="flex flex-col items-center gap-1 cursor-pointer group">
                        <span className={`px-3.5 py-1.5 rounded-full transition-all ${active ? "bg-pine-600 text-white shadow-sm" : "text-mute group-hover:text-pine-600"}`}>
                          <tab.icon size={16} sw={active ? 2 : 1.7} />
                        </span>
                        <span className={`text-[8.5px] font-bold ${active ? "text-pine-700" : "text-mute"}`}>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* home indicator */}
                <div className="h-[18px] bg-surface flex items-end justify-center pb-1.5">
                  <span className="w-24 h-[4px] rounded-full bg-line" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= structure ================= */}
        <div className="space-y-4 min-w-0">
          <div className="card overflow-hidden anim-fade-up" style={{ animationDelay: "0.08s" }}>
            <div className="sidebar-bg px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-[16px] text-white">{t("mob.structure")}</h3>
                <p className="text-[11.5px] text-pine-200/70 mt-0.5">{t("mob.structureSub")}</p>
              </div>
              <span className="text-[10px] font-mono font-semibold text-marigold-300 border border-marigold-400/30 rounded-full px-2.5 py-1 bg-marigold-400/[0.08]">
                tree -L 3
              </span>
            </div>
            <div className="bg-pine-950 px-3 py-4 font-mono">
              <TreeRow node={TREE} depth={0} onPick={pick} activeScreen={screen} />
            </div>
          </div>

          <div className="card p-5 anim-fade-up" style={{ animationDelay: "0.14s" }}>
            <div className="label-xs mb-3">{t("mob.stack")}</div>
            <div className="flex flex-wrap gap-2">
              {STACK.map((s, i) => (
                <span
                  key={s}
                  className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-[12px] font-mono font-semibold text-inksoft hover:border-pine-400 hover:text-pine-700 hover:-translate-y-0.5 transition-all anim-fade-up"
                  style={{ animationDelay: `${0.2 + i * 0.04}s` }}
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {[
                { icon: <IFingerprint size={16} />, title: t("mob.feature1"), desc: t("mob.feature1d") },
                { icon: <IWifi size={16} />, title: t("mob.feature2"), desc: t("mob.feature2d") },
                { icon: <IHeart size={16} />, title: t("mob.feature3"), desc: t("mob.feature3d") },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-line bg-canvas/60 p-3.5 hover:border-marigold-400/60 transition-colors">
                  <span className="text-marigold-600">{f.icon}</span>
                  <div className="text-[12.5px] font-bold text-ink mt-2">{f.title}</div>
                  <div className="text-[11px] text-mute leading-snug mt-1">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

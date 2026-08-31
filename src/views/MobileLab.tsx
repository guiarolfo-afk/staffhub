import { useEffect, useMemo, useRef, useState } from "react";
import { EXPENSES, LESSONS, fmtDate, makePayslips, nowTime, type AttRecord, type Employee } from "../data";
import { useI18n } from "../i18n";
import {
  IArrowR,
  IBanknote,
  IBattery,
  ICalendar,
  IChat,
  ICheck,
  IChevL,
  IChevR,
  IClock,
  IFile,
  IFingerprint,
  IFolder,
  IGrid,
  ILayers,
  ILogout,
  IPlay,
  IReceipt,
  ISend,
  IStar,
  IUser,
  IWifi,
  IX,
  IZap,
} from "../icons";
import { Avatar, LangSwitch, Pill } from "../ui";

/* ------------------------------------------------------------------ */
/* types                                                               */
/* ------------------------------------------------------------------ */

type Screen =
  | "splash"
  | "onboarding"
  | "login"
  | "home"
  | "schedule"
  | "training"
  | "profile"
  | "mgrTeam"
  | "mgrApprovals";

type Role = "employee" | "manager";

interface Approval {
  id: string;
  kind: "payroll" | "expense";
  label: string;
  meta: string;
  amount: number;
}

/* ------------------------------------------------------------------ */
/* file tree (mirrors the Expo repo)                                   */
/* ------------------------------------------------------------------ */

interface Node {
  name: string;
  folder?: boolean;
  comment?: string;
  screen?: Screen | "kiosk";
  children?: Node[];
}

const TREE: Node[] = [
  {
    name: "app",
    folder: true,
    comment: "Rutas (Expo Router)",
    children: [
      {
        name: "(auth)",
        folder: true,
        comment: "Login, registro, onboarding",
        children: [
          { name: "onboarding.tsx", screen: "onboarding" },
          { name: "login.tsx", screen: "login" },
          { name: "register.tsx", screen: "login" },
        ],
      },
      {
        name: "(employee)",
        folder: true,
        comment: "Portal del empleado",
        children: [
          {
            name: "(tabs)",
            folder: true,
            children: [
              { name: "index.tsx", screen: "home" },
              { name: "schedule.tsx", screen: "schedule" },
              { name: "training.tsx", screen: "training" },
              { name: "profile.tsx", screen: "profile" },
            ],
          },
        ],
      },
      {
        name: "(manager)",
        folder: true,
        comment: "Portal del gerente",
        children: [
          {
            name: "(tabs)",
            folder: true,
            children: [
              { name: "index.tsx", screen: "mgrTeam" },
              { name: "approvals.tsx", screen: "mgrApprovals" },
            ],
          },
        ],
      },
      {
        name: "(tablet)",
        folder: true,
        comment: "Modo Kiosk tablet",
        children: [{ name: "kiosk.tsx", screen: "kiosk" }],
      },
    ],
  },
  {
    name: "components",
    folder: true,
    children: [
      {
        name: "ui",
        folder: true,
        comment: "Componentes base",
        children: [{ name: "Button.tsx" }, { name: "Pill.tsx" }, { name: "Modal.tsx" }],
      },
      { name: "chat", folder: true, children: [{ name: "MessageBubble.tsx" }] },
      { name: "tasks", folder: true, children: [{ name: "ChecklistCard.tsx" }] },
      { name: "expenses", folder: true, children: [{ name: "ReceiptCard.tsx" }] },
      { name: "training", folder: true, children: [{ name: "LessonCard.tsx" }] },
    ],
  },
  { name: "hooks", folder: true, children: [{ name: "useClock.ts" }, { name: "useSocket.ts" }, { name: "useBiometrics.ts" }] },
  { name: "services", folder: true, comment: "API calls", children: [{ name: "api.ts" }, { name: "socket.ts" }, { name: "webrtc.ts" }, { name: "storage.ts" }] },
  { name: "stores", folder: true, comment: "Estado global", children: [{ name: "useSession.ts" }, { name: "useShifts.ts" }, { name: "useChat.ts" }, { name: "useApprovals.ts" }] },
  {
    name: "i18n",
    folder: true,
    comment: "Traducciones",
    children: [{ name: "es", folder: true }, { name: "pt", folder: true }, { name: "en", folder: true }, { name: "index.ts" }],
  },
  { name: "utils", folder: true, children: [{ name: "time.ts" }, { name: "money.ts" }, { name: "format.ts" }] },
  { name: "types", folder: true, children: [{ name: "index.d.ts" }] },
];

const ROUTE: Record<Screen, string> = {
  splash: "Expo Router · arranque",
  onboarding: "app/(auth)/onboarding.tsx",
  login: "app/(auth)/login.tsx",
  home: "app/(employee)/(tabs)/index.tsx",
  schedule: "app/(employee)/(tabs)/schedule.tsx",
  training: "app/(employee)/(tabs)/training.tsx",
  profile: "app/(employee)/(tabs)/profile.tsx",
  mgrTeam: "app/(manager)/(tabs)/index.tsx",
  mgrApprovals: "app/(manager)/(tabs)/approvals.tsx",
};

const APP_SCREENS: Screen[] = ["home", "schedule", "training", "profile", "mgrTeam", "mgrApprovals"];

const MON = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

/* ------------------------------------------------------------------ */
/* file tree renderer                                                  */
/* ------------------------------------------------------------------ */

function Tree({
  nodes,
  depth,
  onFile,
  active,
}: {
  nodes: Node[];
  depth: number;
  onFile: (n: Node) => void;
  active: Screen | null;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nodes.map((n) => [n.name, depth < 2])),
  );
  return (
    <div>
      {nodes.map((n) => {
        const isFile = !n.folder;
        const expanded = open[n.name];
        return (
          <div key={n.name + depth}>
            <button
              onClick={() => (isFile ? onFile(n) : setOpen((o) => ({ ...o, [n.name]: !o[n.name] })))}
              className={`w-full flex items-center gap-1.5 py-[5px] rounded-md text-[12px] transition-all cursor-pointer ${
                isFile
                  ? n.screen !== undefined && n.screen !== "kiosk" && active === n.screen
                    ? "bg-marigold-400/20 text-marigold-300 font-semibold"
                    : "text-emerald-100/75 hover:bg-white/[0.06] hover:text-white"
                  : "text-white font-semibold hover:bg-white/[0.06]"
              }`}
              style={{ paddingLeft: depth * 14 + 6 }}
            >
              {n.folder ? (
                <>
                  <IFolder size={12} className={expanded ? "text-marigold-300" : "text-emerald-100/50"} />
                  {n.name}
                  {n.comment && <span className="text-emerald-100/35 font-normal text-[10.5px] ml-1 truncate"># {n.comment}</span>}
                </>
              ) : (
                <>
                  <IFile size={12} className="text-emerald-100/40" />
                  <span className="font-mono">{n.name}</span>
                  {n.screen && n.screen !== "kiosk" && (
                    <span className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-marigold-300/70">↗</span>
                  )}
                  {n.screen === "kiosk" && (
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-marigold-300 border border-marigold-400/40 rounded-full px-1.5">
                      tablet
                    </span>
                  )}
                </>
              )}
            </button>
            {n.folder && expanded && n.children && (
              <Tree nodes={n.children} depth={depth + 1} onFile={onFile} active={active} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

export default function MobileLab({
  onExit,
  notify,
  onKiosk,
  employees,
  attendance,
}: {
  onExit: () => void;
  notify: (m: string) => void;
  onKiosk: () => void;
  employees: Employee[];
  attendance: AttRecord[];
}) {
  const { t, lang } = useI18n();
  const [screen, setScreen] = useState<Screen>("splash");
  const [role, setRole] = useState<Role>("employee");
  const [obIdx, setObIdx] = useState(0);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "lucia@labrasa.mx", pass: "demo-123" });
  const [authErr, setAuthErr] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [punch, setPunch] = useState<"idle" | "scanning" | "on">("idle");
  const [markedAt, setMarkedAt] = useState("");
  const [breakReq, setBreakReq] = useState(false);
  const [lateReq, setLateReq] = useState(false);
  const [playing, setPlaying] = useState<string | null>("l1");
  const [weekOff, setWeekOff] = useState(0);
  const [approvals, setApprovals] = useState<Approval[]>(() => {
    const empById = new Map(employees.map((e) => [e.id, e]));
    const pay = makePayslips(employees)
      .filter((p) => p.status === "pending")
      .map((p) => {
        const e = empById.get(p.empId);
        return {
          id: "ap-" + p.id,
          kind: "payroll" as const,
          label: e?.name ?? "—",
          meta: `${e?.role ?? ""} · ${t("pay.period")}`,
          amount: p.net,
        };
      });
    const exp = EXPENSES.filter((x) => x.status === "pending").map((x) => ({
      id: "ae-" + x.id,
      kind: "expense" as const,
      label: x.concept,
      meta: t("exp.cat." + x.category) + " · " + x.source.toUpperCase(),
      amount: x.amount,
    }));
    return [...pay.slice(0, 2), ...exp.slice(0, 2)];
  });
  const [flash, setFlash] = useState(0);
  const [push, setPush] = useState<{ id: number; title: string; body: string } | null>(null);
  const pushN = useRef(0);

  /* splash → onboarding */
  useEffect(() => {
    if (screen !== "splash") return;
    const id = setTimeout(() => setScreen("onboarding"), 1500);
    return () => clearTimeout(id);
  }, [screen]);

  /* simulated pushes while inside the app */
  useEffect(() => {
    if (!APP_SCREENS.includes(screen)) return;
    const id = setInterval(() => {
      pushN.current += 1;
      const bodies = [t("dev.nextShift"), t("notif.welcome"), t("tsk.done"), t("trn.title") + " · " + t("common.new")];
      const body = bodies[pushN.current % bodies.length];
      setPush({ id: Date.now(), title: "StaffHub Go", body });
      setTimeout(() => setPush(null), 4200);
    }, 20000);
    return () => clearInterval(id);
  }, [screen, t]);

  const go = (s: Screen) => {
    setScreen(s);
    setFlash((f) => f + 1);
    if (s === "mgrTeam" || s === "mgrApprovals") setRole("manager");
    if (["home", "schedule", "training", "profile"].includes(s)) setRole("employee");
  };

  const onFile = (n: Node) => {
    if (!n.screen) return;
    if (n.screen === "kiosk") {
      onKiosk();
      return;
    }
    go(n.screen);
  };

  /* ---------- manager stats ---------- */
  const onShift = attendance.filter((a) => !a.clockOut && a.status !== "absent").length;
  const lates = attendance.filter((a) => a.status === "late").length;
  const absents = attendance.filter((a) => a.status === "absent").length;
  const empStatus = useMemo(() => new Map(attendance.map((a) => [a.empId, a])), [attendance]);
  const activeEmps = employees.filter((e) => e.status === "active");

  /* ---------- days ---------- */
  const monday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + weekOff * 7);
    return d;
  }, [weekOff]);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const shiftFor = (d: Date) => {
    const wd = d.getDay();
    if (wd === 0) return null;
    if (wd === 5 || wd === 6) return { h: "16:00 – 00:00", type: "night" as const };
    return wd % 2 === 1 ? { h: "09:00 – 17:00", type: "morning" as const } : { h: "13:00 – 21:00", type: "afternoon" as const };
  };
  const TYPE_SOLID = { morning: "#256b52", afternoon: "#e89f2e", night: "#2e7d8c" } as const;
  const totalH = days.reduce((s, d) => s + (shiftFor(d) ? 8 : 0), 0);

  /* ---------- auth ---------- */
  const submitAuth = () => {
    const ok =
      authTab === "login"
        ? authForm.email.trim() && authForm.pass.trim()
        : authForm.name.trim() && authForm.email.trim() && authForm.pass.trim();
    if (!ok) {
      setAuthErr(true);
      setTimeout(() => setAuthErr(false), 700);
      return;
    }
    setAuthLoading(true);
    setTimeout(() => {
      setAuthLoading(false);
      go("home");
      notify(t("mob.loginOk"));
    }, 1000);
  };

  const punchTap = () => {
    if (punch === "scanning") return;
    if (punch === "on") {
      setPunch("idle");
      notify(t("notif.out"));
      return;
    }
    setPunch("scanning");
    setTimeout(() => {
      setMarkedAt(nowTime());
      setPunch("on");
      notify(`${t("dev.marked")} ${nowTime()}`);
    }, 1000);
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? "dash.greet.morning" : hour < 19 ? "dash.greet.afternoon" : "dash.greet.evening";
  const obSlides = [
    { icon: IFingerprint, tk: "mob.onb1t", dk: "mob.onb1d" },
    { icon: IChat, tk: "mob.onb2t", dk: "mob.onb2d" },
    { icon: IPlay, tk: "mob.onb3t", dk: "mob.onb3d" },
  ];

  const tabDefs =
    role === "employee"
      ? ([
          { s: "home" as Screen, icon: IGrid, label: t("mob.tab.home") },
          { s: "schedule" as Screen, icon: ICalendar, label: t("mob.tab.schedule") },
          { s: "training" as Screen, icon: IPlay, label: t("mob.tab.training") },
          { s: "profile" as Screen, icon: IUser, label: t("mob.tab.profile") },
        ] as const)
      : ([
          { s: "mgrTeam" as Screen, icon: IUsers2, label: t("mob.mgrTeam") },
          { s: "mgrApprovals" as Screen, icon: ICheck, label: t("mob.mgrApprovals") },
        ] as const);

  const inApp = APP_SCREENS.includes(screen);

  /* --------------------------------------------------------------- */

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("mob.title")}</h1>
          <p className="text-[13.5px] text-mute mt-1.5">{t("mob.sub")}</p>
        </div>
        <button className="btn-ghost" onClick={onExit}>
          <IChevL size={15} /> {t("nav.dashboard")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[430px_1fr] gap-6 items-start">
        {/* ================= phone stage ================= */}
        <div className="sidebar-bg rounded-[30px] relative overflow-hidden p-6 flex flex-col items-center anim-fade-up" style={{ animationDelay: "0.06s" }}>
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(#f0b24e 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
          {/* floating build chips */}
          <div className="absolute left-5 top-8 hidden md:flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-white/10 px-3 py-1.5 text-[10.5px] font-bold text-pine-100 anim-float">
            <span className="w-1.5 h-1.5 rounded-full bg-marigold-400 blink" /> v2.4.1 · build 86
          </div>
          <div className="absolute right-5 top-24 hidden md:block rounded-full bg-white/[0.07] border border-white/10 px-3 py-1.5 text-[10.5px] font-bold text-pine-100 anim-float" style={{ animationDelay: "1.2s" }}>
            iOS 17 · Android 14
          </div>
          <div className="absolute left-6 bottom-40 hidden md:flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-white/10 px-3 py-1.5 text-[10.5px] font-bold text-pine-100 anim-float" style={{ animationDelay: "2.1s" }}>
            <IZap size={11} className="text-marigold-300" /> {t("mob.socket")}
          </div>

          {/* route chip */}
          <div className="relative w-full max-w-[300px] mb-4 flex items-center gap-2 rounded-lg bg-black/40 border border-white/10 px-3 py-2">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-marigold-300">{t("mob.route")}</span>
            <span key={ROUTE[screen]} className="font-mono text-[11px] text-emerald-100/90 truncate anim-fade-up">{ROUTE[screen]}</span>
          </div>

          {/* device */}
          <div key={flash} className={`relative w-[300px] rounded-[42px] border-[11px] border-[#101d17] bg-[#101d17] shadow-2xl ${flash ? "anim-pop" : "anim-fade-up"}`}>
            <div className="absolute -right-[3px] top-24 w-[3px] h-12 rounded-r bg-[#2a3b32]" />
            <div className="absolute -left-[3px] top-20 w-[3px] h-8 rounded-l bg-[#2a3b32]" />
            <div className="absolute -left-[3px] top-32 w-[3px] h-8 rounded-l bg-[#2a3b32]" />

            {/* status bar */}
            <div className="h-8 bg-pine-950 flex items-center justify-between px-5 relative z-20">
              <span className="font-mono text-[10.5px] text-pine-200">{nowTime()}</span>
              <div className="w-20 h-[18px] bg-black rounded-full" />
              <span className="flex items-center gap-1.5 text-pine-200">
                <IWifi size={11} />
                <IBattery size={14} />
              </span>
            </div>

            {/* push banner */}
            {push && inApp && (
              <div
                key={push.id}
                onClick={() => setPush(null)}
                className="absolute top-9 left-3 right-3 z-30 anim-push-down cursor-pointer"
              >
                <div className="rounded-2xl bg-pine-950/95 border border-white/15 shadow-2xl px-3.5 py-3 flex items-start gap-2.5" style={{ backdropFilter: "blur(8px)" }}>
                  <span className="w-8 h-8 rounded-[10px] bg-marigold-400 text-pine-950 flex items-center justify-center font-display font-bold text-[13px] shrink-0">S</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] font-bold text-white">{push.title}</span>
                      <span className="text-[9.5px] text-pine-200/60 font-mono">{t("common.today")}</span>
                    </div>
                    <div className="text-[11px] text-pine-100/85 leading-snug mt-0.5">{push.body}</div>
                  </div>
                  <IX size={12} className="text-pine-200/50 shrink-0 mt-0.5" />
                </div>
              </div>
            )}

            <div className="bg-canvas h-[560px] flex flex-col overflow-hidden rounded-b-[31px]">
              {/* ---------------- splash ---------------- */}
              {screen === "splash" && (
                <div className="flex-1 sidebar-bg flex flex-col items-center justify-center text-white">
                  <div className="w-16 h-16 rounded-[20px] bg-marigold-400 text-pine-950 flex items-center justify-center font-display font-extrabold text-[26px] anim-float">
                    S
                  </div>
                  <div className="font-display font-bold text-[19px] mt-4">
                    StaffHub <span className="text-marigold-300">Go</span>
                  </div>
                  <div className="w-32 h-[5px] rounded-full bg-white/15 mt-5 overflow-hidden">
                    <div className="h-full bg-marigold-400 bar-grow" style={{ animationDuration: "1.3s" }} />
                  </div>
                  <div className="text-[11px] text-pine-200/70 mt-3">{t("mob.splash")}</div>
                </div>
              )}

              {/* ---------------- onboarding ---------------- */}
              {screen === "onboarding" && (
                <div className="flex-1 flex flex-col p-5">
                  <button className="self-end text-[11.5px] font-semibold text-mute hover:text-ink cursor-pointer" onClick={() => go("login")}>
                    {t("mob.skip")} →
                  </button>
                  <div key={obIdx} className="flex-1 flex flex-col items-center justify-center text-center anim-fade-up">
                    <span className="w-20 h-20 rounded-[26px] bg-pine-50 border border-pine-200 text-pine-600 flex items-center justify-center">
                      {(() => {
                        const I = obSlides[obIdx].icon;
                        return <I size={34} sw={1.5} />;
                      })()}
                    </span>
                    <h3 className="font-display font-bold text-[19px] text-ink mt-5 leading-tight">{t(obSlides[obIdx].tk)}</h3>
                    <p className="text-[12.5px] text-mute mt-2 leading-relaxed max-w-[230px]">{t(obSlides[obIdx].dk)}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    {obSlides.map((_, i) => (
                      <span key={i} className={`h-[6px] rounded-full transition-all ${i === obIdx ? "w-5 bg-pine-600" : "w-[6px] bg-line"}`} />
                    ))}
                  </div>
                  <button
                    className="btn-primary w-full mb-1"
                    onClick={() => (obIdx < 2 ? setObIdx(obIdx + 1) : go("login"))}
                  >
                    {obIdx < 2 ? t("mob.next") : t("mob.start")} <IArrowR size={15} />
                  </button>
                </div>
              )}

              {/* ---------------- login / register ---------------- */}
              {screen === "login" && (
                <div className="flex-1 flex flex-col p-5 overflow-y-auto">
                  <div className="flex items-center gap-2.5 mt-2">
                    <span className="w-10 h-10 rounded-xl bg-marigold-400 text-pine-950 flex items-center justify-center font-display font-extrabold text-[17px]">S</span>
                    <div>
                      <div className="font-display font-bold text-[17px] text-ink leading-tight">{t("mob.loginTitle")}</div>
                      <div className="text-[10.5px] text-mute">{t("mob.loginSub")}</div>
                    </div>
                  </div>

                  <div className="flex rounded-full bg-line/50 p-[3px] mt-5">
                    {(["login", "register"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setAuthTab(tab)}
                        className={`flex-1 py-1.5 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                          authTab === tab ? "bg-surface text-pine-700 shadow-sm" : "text-mute"
                        }`}
                      >
                        {t(tab === "login" ? "mob.tabLogin" : "mob.tabRegister")}
                      </button>
                    ))}
                  </div>

                  <div className={`space-y-3 mt-4 ${authErr ? "anim-shake" : ""}`}>
                    {authTab === "register" && (
                      <input className="input-base !text-[12.5px]" placeholder={t("mob.namePh")} value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />
                    )}
                    <input className="input-base !text-[12.5px]" placeholder={t("mob.emailPh")} value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
                    <input className="input-base !text-[12.5px]" type="password" placeholder={t("mob.passPh")} value={authForm.pass} onChange={(e) => setAuthForm({ ...authForm, pass: e.target.value })} />
                    {authErr && <p className="text-[11px] font-semibold text-clay-600">⚠ {t("mob.errFields")}</p>}
                  </div>

                  <button className="btn-primary w-full mt-4" onClick={submitAuth} disabled={authLoading}>
                    {authLoading ? (
                      <span className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        {t("mob.loggingIn")}
                      </span>
                    ) : (
                      <>{t(authTab === "login" ? "mob.signIn" : "mob.signUp")} <IArrowR size={15} /></>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 mt-4">
                    <IFingerprint size={16} className="text-pine-500" />
                    <span className="text-[11px] text-mute">{t("mob.feature1d")}</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-line flex items-center justify-between">
                    <span className="text-[10px] text-mute">i18n-js</span>
                    <LangSwitch />
                  </div>
                </div>
              )}

              {/* ---------------- employee: home ---------------- */}
              {screen === "home" && (
                <div className="flex-1 overflow-y-auto">
                  <div className="sidebar-bg text-white px-4 pt-3 pb-5 rounded-b-[22px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-pine-200/75">{t(greet)}</div>
                        <div className="font-display font-bold text-[17px] leading-tight">Lucía Fernández</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-[19px] text-marigold-300 tabular-nums">{nowTime()}</div>
                        <div className="text-[9.5px] text-pine-200/60 uppercase tracking-wider">{t("venue")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 -mt-3 space-y-3 pb-4">
                    <div className="card p-4 text-center">
                      <button
                        onClick={punchTap}
                        disabled={punch === "scanning"}
                        className={`w-full rounded-2xl py-3.5 font-display font-bold text-[14.5px] transition-all cursor-pointer active:scale-[0.98] shadow-md ${
                          punch === "on" ? "bg-marigold-400 text-pine-950" : "bg-pine-600 text-white pulse-dot"
                        }`}
                      >
                        {punch === "scanning" ? (
                          <span className="flex items-center justify-center gap-2">
                            <IFingerprint size={18} className="blink" /> {t("dev.biometric")}…
                          </span>
                        ) : punch === "on" ? (
                          <>
                            {t("dev.onShiftSince")} <span className="font-mono">{markedAt}</span>
                            <span className="block font-sans text-[10.5px] font-semibold mt-0.5 opacity-75">{t("dev.clockOut")}</span>
                          </>
                        ) : (
                          <>{t("dev.clockIn")} <IFingerprint size={15} className="inline -mt-0.5 ml-1" /></>
                        )}
                      </button>
                      <div className="flex justify-center gap-2 mt-3">
                        <button
                          onClick={() => {
                            setBreakReq(true);
                            notify(t("mob.breakSent"));
                          }}
                          disabled={breakReq}
                          className="text-[11px] font-semibold text-pine-700 bg-pine-50 border border-pine-200 rounded-full px-3 py-1.5 transition-all cursor-pointer disabled:opacity-60 hover:bg-pine-100"
                        >
                          {breakReq ? t("mob.breakSent") : "☕ " + t("mob.break")}
                        </button>
                        <button
                          onClick={() => {
                            setLateReq(true);
                            notify(t("mob.lateSent"));
                          }}
                          disabled={lateReq}
                          className="text-[11px] font-semibold text-marigold-700 bg-marigold-200/50 border border-marigold-300 rounded-full px-3 py-1.5 transition-all cursor-pointer disabled:opacity-60 hover:bg-marigold-200"
                        >
                          {lateReq ? t("mob.lateSent") : "⏱ " + t("mob.late")}
                        </button>
                      </div>
                    </div>

                    <div className="card p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-bold text-ink">{t("mob.todayShift")}</span>
                        <span className="font-mono text-[11px] font-semibold text-marigold-700">13:00 – 21:00</span>
                      </div>
                      <div className="h-[6px] rounded-full bg-line/70 mt-2 overflow-hidden">
                        <div className="h-full bg-marigold-400 bar-grow" style={{ width: "38%" }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-mute mt-1.5 font-mono">
                        <span>13:00</span>
                        <span>38% {t("dash.of")}</span>
                        <span>21:00</span>
                      </div>
                    </div>

                    <div className="card p-3.5">
                      <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                        <span className="text-inksoft">{t("dev.balance")}</span>
                        <span className="font-mono text-pine-700">72h {t("dev.of")} 160h</span>
                      </div>
                      <div className="h-[7px] rounded-full bg-line/70 overflow-hidden">
                        <div className="h-full bg-pine-500 bar-grow" style={{ width: "45%", animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- employee: schedule ---------------- */}
              {screen === "schedule" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <button className="btn-ghost !p-1.5" onClick={() => setWeekOff((w) => w - 1)}><IChevL size={14} /></button>
                    <span className="text-[12.5px] font-bold text-ink">
                      {fmtDate(days[0], lang)} — {fmtDate(days[6], lang)}
                    </span>
                    <button className="btn-ghost !p-1.5" onClick={() => setWeekOff((w) => w + 1)}><IChevR size={14} /></button>
                  </div>
                  <div className="flex gap-1.5">
                    {days.map((d, i) => {
                      const sh = shiftFor(d);
                      const isToday = new Date().toDateString() === d.toDateString();
                      return (
                        <div key={i} className={`flex-1 rounded-lg border py-1.5 text-center ${isToday ? "border-marigold-400 bg-marigold-200/40" : "border-line bg-surface"}`}>
                          <div className="text-[9px] font-bold uppercase text-mute">{t("day." + i)}</div>
                          <div className="font-mono text-[11px] font-semibold text-ink">{d.getDate()}</div>
                          <span className={`block mx-auto mt-1 w-1.5 h-1.5 rounded-full ${sh ? "bg-pine-500" : "bg-line"}`} />
                        </div>
                      );
                    })}
                  </div>
                  {days.map((d, i) => {
                    const sh = shiftFor(d);
                    return (
                      <div key={i} className={`card p-3 flex items-center gap-3 ${sh ? "" : "opacity-50"}`}>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold text-[12px] shrink-0" style={{ background: sh ? TYPE_SOLID[sh.type] : "#c9d2c6" }}>
                          {t("day." + i).slice(0, 2)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-bold text-ink capitalize">{fmtDate(d, lang)}</div>
                          <div className="text-[10.5px] text-mute">{sh ? t("shift." + sh.type) + " · " + t("dept.hall") : t("sched.empty")}</div>
                        </div>
                        {sh && <span className="font-mono text-[11px] font-semibold text-ink">{sh.h}</span>}
                      </div>
                    );
                  })}
                  <div className="text-center font-mono text-[11.5px] font-bold text-pine-700">{t("sched.total")}: {totalH}h</div>
                </div>
              )}

              {/* ---------------- employee: training ---------------- */}
              {screen === "training" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="card sidebar-bg text-white p-3.5 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-marigold-400 text-pine-950 flex items-center justify-center"><IZap size={17} /></span>
                    <div>
                      <div className="text-[12px] font-bold">{t("mob.streak")}</div>
                      <div className="text-[10.5px] text-pine-200/75">{t("mob.streakSub")}</div>
                    </div>
                    <span className="ml-auto font-display font-extrabold text-[20px] text-marigold-300">12🔥</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                    {LESSONS.slice(0, 5).map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setPlaying((p) => (p === l.id ? null : l.id))}
                        className="relative shrink-0 w-[110px] rounded-2xl overflow-hidden cursor-pointer group"
                        style={{ aspectRatio: "9/14" }}
                      >
                        <img src={l.cover} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-pine-950/85" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          {playing === l.id ? (
                            <span className="flex items-end gap-[2.5px] h-4">
                              <span className="eq-bar h-4" /><span className="eq-bar h-4" /><span className="eq-bar h-4" />
                            </span>
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white group-hover:bg-marigold-400 group-hover:text-pine-950 transition-all">
                              <IPlay size={12} className="translate-x-[1px]" />
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-1.5 left-2 right-2 text-left">
                          <div className="text-[10px] font-bold text-white leading-tight line-clamp-2">{t(l.title)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="card p-3.5">
                    <div className="flex justify-between text-[11.5px] font-semibold mb-1.5">
                      <span className="text-inksoft">{t("trn.progress")}</span>
                      <span className="font-mono text-pine-700">68%</span>
                    </div>
                    <div className="h-[7px] rounded-full bg-line/70 overflow-hidden">
                      <div className="h-full bg-pine-500 bar-grow" style={{ width: "68%", animationDelay: "0.15s" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- employee: profile ---------------- */}
              {screen === "profile" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="card p-4 flex items-center gap-3">
                    <Avatar name="Lucía Fernández" size={46} />
                    <div>
                      <div className="font-display font-bold text-[15px] text-ink leading-tight">Lucía Fernández</div>
                      <div className="text-[11px] text-mute">Captain · {t("dept.hall")}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <IStar key={i} size={11} className={i <= 4 ? "text-marigold-500" : "text-line"} sw={2} />
                        ))}
                        <span className="font-mono text-[10.5px] font-bold text-inksoft ml-1">4.8</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "72h", l: t("mob.month") },
                      { v: "4.8", l: t("mob.score") },
                      { v: "12🔥", l: t("mob.streakS") },
                    ].map((k) => (
                      <div key={k.l} className="card p-2.5 text-center">
                        <div className="font-display font-extrabold text-[17px] text-ink">{k.v}</div>
                        <div className="text-[10px] text-mute mt-0.5">{k.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* role switch */}
                  <div className="card p-3.5">
                    <div className="label-xs mb-2">{t("mob.mgrRole")}</div>
                    <div className="flex rounded-full bg-line/50 p-[3px]">
                      {(["employee", "manager"] as Role[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => (r === "manager" ? go("mgrTeam") : go("home"))}
                          className={`flex-1 py-1.5 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                            role === r ? "bg-pine-600 text-white shadow-sm" : "text-mute hover:text-ink"
                          }`}
                        >
                          {t(r === "employee" ? "mob.mgrRoleEmp" : "mob.mgrRoleMgr")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="card p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="label-xs">{t("mob.langs")}</span>
                      <LangSwitch />
                    </div>
                    <p className="text-[10.5px] text-mute leading-snug">{t("mob.langsNote")}</p>
                  </div>

                  <div className="card p-3.5">
                    <div className="label-xs mb-2">{t("mob.badges")}</div>
                    <div className="flex gap-2">
                      {[t("mob.badge1"), t("mob.badge2"), t("mob.badge3")].map((b, i) => (
                        <span key={b} className={`text-[10px] font-bold rounded-full px-2.5 py-1.5 ${i === 0 ? "bg-marigold-200/60 text-marigold-700" : "bg-pine-50 text-pine-700 border border-pine-200"}`}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-clay-500/40 text-clay-600 font-semibold text-[12.5px] py-2.5 hover:bg-clay-100 transition-colors cursor-pointer" onClick={() => go("login")}>
                    <ILogout size={14} /> {t("mob.mgrLogout")}
                  </button>
                </div>
              )}

              {/* ---------------- manager: team ---------------- */}
              {screen === "mgrTeam" && (
                <div className="flex-1 overflow-y-auto">
                  <div className="sidebar-bg text-white px-4 pt-3 pb-4 rounded-b-[22px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10.5px] text-pine-200/70 uppercase tracking-wider">{t("mob.mgrTitle")}</div>
                        <div className="font-display font-bold text-[16px]">{t("venue")}</div>
                      </div>
                      <Avatar name="Valentina Ríos" size={36} ring />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[
                        { v: onShift, l: t("mob.mgrOnShift"), c: "text-marigold-300" },
                        { v: lates, l: t("mob.mgrLate"), c: "text-clay-100" },
                        { v: absents, l: t("mob.mgrAbsent"), c: "text-pine-200/80" },
                      ].map((k) => (
                        <div key={k.l} className="rounded-xl bg-white/[0.08] border border-white/10 py-2 text-center">
                          <div className={`font-display font-extrabold text-[18px] leading-none ${k.c}`}>{k.v}</div>
                          <div className="text-[9.5px] text-pine-200/65 mt-1">{k.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {activeEmps.slice(0, 8).map((e) => {
                      const att = empStatus.get(e.id);
                      const working = att && !att.clockOut && att.status !== "absent";
                      return (
                        <div key={e.id} className="card !rounded-xl px-3 py-2 flex items-center gap-2.5">
                          <div className="relative">
                            <Avatar name={e.name} size={30} />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${working ? "bg-pine-500 blink" : "bg-line"}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11.5px] font-bold text-ink truncate">{e.name}</div>
                            <div className="text-[10px] text-mute">{e.role}</div>
                          </div>
                          <Pill tone={working ? "pine" : att?.status === "late" ? "amber" : att?.status === "absent" ? "clay" : "slate"}>
                            {working ? t("st.onShift") : att ? t("st." + att.status) : t("st.off")}
                          </Pill>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ---------------- manager: approvals ---------------- */}
              {screen === "mgrApprovals" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-ink">{t("mob.mgrApprovals")}</span>
                    <Pill tone={approvals.length ? "amber" : "pine"} pulse={approvals.length > 0}>
                      {approvals.length} {t("mob.mgrPending").split(" ")[0]}
                    </Pill>
                  </div>
                  {approvals.length === 0 && (
                    <div className="card p-6 text-center">
                      <span className="mx-auto w-11 h-11 rounded-full bg-pine-50 text-pine-600 flex items-center justify-center"><ICheck size={20} /></span>
                      <p className="text-[12px] text-mute mt-2.5">{t("mob.mgrEmpty")}</p>
                    </div>
                  )}
                  {approvals.map((a) => (
                    <div key={a.id} className="card !rounded-xl p-3 anim-fade-up">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.kind === "payroll" ? "bg-pine-50 text-pine-600" : "bg-marigold-200/60 text-marigold-700"}`}>
                          {a.kind === "payroll" ? <IBanknote size={17} /> : <IReceipt size={17} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-bold text-ink truncate">{a.label}</div>
                          <div className="text-[10px] text-mute truncate">{a.meta}</div>
                        </div>
                        <span className="font-mono font-bold text-[13px] text-ink">${a.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2 mt-2.5">
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-pine-600 text-white text-[11.5px] font-bold py-2 hover:bg-pine-500 transition-colors cursor-pointer"
                          onClick={() => {
                            setApprovals((prev) => prev.filter((x) => x.id !== a.id));
                            notify(t("mob.mgrApproved"));
                          }}
                        >
                          <ICheck size={13} sw={2.4} /> {t("exp.approve")}
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-clay-500/40 text-clay-600 text-[11.5px] font-bold py-2 hover:bg-clay-100 transition-colors cursor-pointer"
                          onClick={() => {
                            setApprovals((prev) => prev.filter((x) => x.id !== a.id));
                            notify(t("mob.mgrRejected"));
                          }}
                        >
                          <IX size={13} sw={2.4} /> {t("exp.reject")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* bottom tab bar */}
              {inApp && (
                <div className="flex items-center justify-around px-4 py-2 border-t border-line bg-surface shrink-0">
                  {tabDefs.map((tab) => {
                    const isActive = screen === tab.s;
                    return (
                      <button
                        key={tab.s}
                        onClick={() => go(tab.s)}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${isActive ? "text-pine-700" : "text-mute hover:text-ink"}`}
                      >
                        <tab.icon size={18} className={isActive ? "text-pine-600" : ""} />
                        <span className={`text-[9px] font-bold ${isActive ? "text-pine-700" : ""}`}>{tab.label}</span>
                        <span className={`h-[3px] rounded-full bg-marigold-400 transition-all ${isActive ? "w-4" : "w-0"}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* caption */}
          <div className="relative mt-5 text-center">
            <div className="font-display font-bold text-[15px] text-white">{t("dev.appTitle")} · StaffHub Go</div>
            <div className="text-[11.5px] text-pine-200/65 mt-0.5">{t("dev.interactive")}</div>
          </div>
        </div>

        {/* ================= right: structure + stack ================= */}
        <div className="space-y-4 min-w-0">
          <div className="card overflow-hidden anim-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between px-4 py-2.5 bg-pine-950 border-b border-linedark">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-clay-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-marigold-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-pine-400/80" />
                <span className="ml-2 font-mono text-[11px] text-pine-200/70">staffhub-mobile — {t("mob.structure")}</span>
              </div>
              <span className="font-mono text-[10px] text-pine-200/40 hidden sm:block">Expo SDK 51 · TS</span>
            </div>
            <div className="sidebar-bg p-3 max-h-[460px] overflow-y-auto group">
              <div className="font-mono text-[11px] text-pine-200/50 px-1.5 pb-2">$ tree src/ --dirs-first</div>
              <Tree nodes={TREE} depth={0} onFile={onFile} active={screen} />
            </div>
            <p className="text-[11.5px] text-mute px-4 py-2.5 border-t border-line bg-pine-50/40">{t("mob.structureSub")}</p>
          </div>

          {/* stack + native capabilities */}
          <div className="card p-4 anim-fade-up" style={{ animationDelay: "0.16s" }}>
            <div className="label-xs mb-2.5">{t("mob.stack")}</div>
            <div className="flex flex-wrap gap-1.5">
              {["React Native", "Expo SDK 51", "Expo Router", "TypeScript", "Zustand", "react-native-webrtc", "expo-local-authentication", "expo-camera", "i18n-js", "MMKV", "Socket.io", "EAS Build"].map((chip) => (
                <span key={chip} className="font-mono text-[11px] font-medium text-pine-700 bg-pine-50 border border-pine-200 rounded-md px-2 py-1 hover:bg-pine-100 hover:border-pine-400 transition-colors cursor-default">
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                { icon: IFingerprint, tk: "mob.feature1", dk: "mob.feature1d" },
                { icon: IZap, tk: "mob.feature2", dk: "mob.feature2d" },
                { icon: ILayers, tk: "mob.feature3", dk: "mob.feature3d" },
              ].map((f) => (
                <div key={f.tk} className="flex items-start gap-3 rounded-xl border border-line px-3.5 py-3 hover:border-pine-400 hover:bg-pine-50/50 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-pine-50 text-pine-600 flex items-center justify-center shrink-0">
                    <f.icon size={16} />
                  </span>
                  <div>
                    <div className="text-[12.5px] font-bold text-ink">{t(f.tk)}</div>
                    <div className="text-[11.5px] text-mute leading-snug mt-0.5">{t(f.dk)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* inline users icon for manager tab (avoids extra import churn) */
function IUsers2(p: { size?: number; className?: string }) {
  return (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden="true">
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 20c.7-3.2 3.2-5 6.2-5s5.5 1.8 6.2 5" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 5.6" />
      <path d="M18.4 15.4c1.6.8 2.6 2.3 2.9 4.6" />
    </svg>
  );
}

/* keep ISend referenced for potential chat-in-phone extension */
export const __sendIcon = ISend;

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ATTENDANCE,
  EMPLOYEES,
  SHIFTS,
  VENUES,
  nowTime,
  type AttRecord,
  type Employee,
  type LiveEvent,
  type Shift,
  type Venue,
} from "./data";
import { LangProvider, useI18n } from "./i18n";
import {
  IBanknote,
  IBell,
  IBuilding,
  ICalendar,
  IChart,
  IChat,
  ICheck,
  IChevD,
  IClipboard,
  IClock,
  IGrid,
  ILogout,
  IPhone2,
  IPlay,
  IReceipt,
  ISearch,
  IShield,
  ISign,
  IStore,
  ITablet,
  IUsers,
  IX,
  IZap,
} from "./icons";
import { Avatar, LangSwitch, Wordmark, useNow } from "./ui";
import Attendance from "./views/Attendance";
import ChatView from "./views/ChatView";
import Dashboard from "./views/Dashboard";
import { KioskPreview } from "./views/DevicePreviews";
import Documents from "./views/Documents";
import Employees from "./views/Employees";
import Expenses from "./views/Expenses";
import Incidents from "./views/Incidents";
import Login from "./views/Login";
import MobileLab from "./views/MobileLab";
import Payroll from "./views/Payroll";
import Reports from "./views/Reports";
import Schedule from "./views/Schedule";
import TasksView from "./views/TasksView";
import Training from "./views/Training";

type View =
  | "dashboard"
  | "employees"
  | "schedule"
  | "attendance"
  | "payroll"
  | "expenses"
  | "tasks"
  | "chat"
  | "training"
  | "documents"
  | "incidents"
  | "reports"
  | "mobile";
interface Toast {
  id: number;
  msg: string;
  kind: "ok" | "warn";
}
interface Notif {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

const EVENT_KINDS: LiveEvent["kind"][] = ["in", "out", "breakStart", "breakEnd"];

function initialEvents(): LiveEvent[] {
  const base = [
    { empId: "e7", kind: "breakStart" as const, mins: 4 },
    { empId: "e14", kind: "in" as const, mins: 9 },
    { empId: "e10", kind: "in" as const, mins: 21 },
    { empId: "e5", kind: "in" as const, mins: 34 },
    { empId: "e13", kind: "out" as const, mins: 52 },
  ];
  const now = Date.now();
  return base.map((b, i) => {
    const d = new Date(now - b.mins * 60000);
    return {
      id: "ev-init-" + i,
      empId: b.empId,
      kind: b.kind,
      time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      ts: now - b.mins * 60000,
    };
  });
}

function Shell({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  const now = useNow(1000);
  const [view, setView] = useState<View>("dashboard");
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [shifts, setShifts] = useState<Shift[]>(SHIFTS);
  const [attendance, setAttendance] = useState<AttRecord[]>(ATTENDANCE);
  const [events, setEvents] = useState<LiveEvent[]>(initialEvents);
  const [notifs, setNotifs] = useState<Notif[]>([
    { id: "n1", text: t("notif.conflict"), time: "08:12", read: false },
    { id: "n2", text: t("notif.welcome"), time: "07:58", read: false },
  ]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [q, setQ] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [kioskOpen, setKioskOpen] = useState(false);
  const [venue, setVenue] = useState<Venue>(VENUES[0]);
  const [venueOpen, setVenueOpen] = useState(false);
  const toastId = useRef(0);
  const tickCount = useRef(0);

  const notify = (msg: string, kind: "ok" | "warn" = "ok") => {
    const id = ++toastId.current;
    setToasts((ts) => [...ts, { id, msg, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3800);
  };

  /* ---------- live event engine ---------- */
  useEffect(() => {
    const id = setInterval(() => {
      tickCount.current += 1;
      const active = employees.filter((e) => e.status === "active");
      const emp = active[Math.floor(Math.random() * active.length)];
      const kind = EVENT_KINDS[Math.floor(Math.random() * EVENT_KINDS.length)];
      const time = nowTime();
      const ev: LiveEvent = { id: "ev-" + Date.now(), empId: emp.id, kind, time, ts: Date.now() };
      setEvents((prev) => [ev, ...prev].slice(0, 14));
      setNotifs((prev) => [{ id: "n-" + Date.now(), text: `${emp.name} ${t("notif." + kind)}`, time, read: false }, ...prev].slice(0, 20));
      if (kind === "in") {
        setAttendance((prev) => {
          const existing = prev.find((a) => a.empId === emp.id);
          const rec: AttRecord = existing
            ? { ...existing, clockIn: time, clockOut: null, status: "onShift" }
            : { id: "a-" + Date.now(), empId: emp.id, clockIn: time, clockOut: null, status: "onShift" };
          return existing ? prev.map((a) => (a.empId === emp.id ? rec : a)) : [rec, ...prev];
        });
      }
      if (tickCount.current % 2 === 0) notify(`${emp.name} · ${t("notif." + kind)}`);
    }, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, t]);

  const unread = notifs.filter((n) => !n.read).length;

  const results = useMemo(
    () => (q.trim() ? employees.filter((e) => (e.name + " " + e.role).toLowerCase().includes(q.toLowerCase())).slice(0, 6) : []),
    [q, employees],
  );

  const NAV: { section: string; items: { id: View; icon: typeof IGrid; label: string; badge?: number }[] }[] = [
    {
      section: t("nav.operation"),
      items: [
        { id: "dashboard", icon: IGrid, label: t("nav.dashboard") },
        { id: "employees", icon: IUsers, label: t("nav.employees") },
        { id: "schedule", icon: ICalendar, label: t("nav.schedule") },
        { id: "attendance", icon: IClock, label: t("nav.attendance") },
      ],
    },
    {
      section: t("nav.admin"),
      items: [
        { id: "payroll", icon: IBanknote, label: t("nav.payroll") },
        { id: "expenses", icon: IReceipt, label: t("nav.expenses") },
        { id: "tasks", icon: IClipboard, label: t("nav.tasks") },
      ],
    },
    {
      section: t("nav.comms"),
      items: [
        { id: "chat", icon: IChat, label: t("nav.chat"), badge: 3 },
        { id: "training", icon: IPlay, label: t("nav.training") },
      ],
    },
    {
      section: t("nav.compliance"),
      items: [
        { id: "documents", icon: ISign, label: t("nav.documents") },
        { id: "incidents", icon: IShield, label: t("nav.incidents") },
      ],
    },
    { section: t("nav.analysis"), items: [{ id: "reports", icon: IChart, label: t("nav.reports") }] },
  ];

  const saveEmployee = (e: Employee, isNew: boolean) => {
    setEmployees((prev) => (isNew ? [e, ...prev] : prev.map((x) => (x.id === e.id ? e : x))));
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* ================= sidebar ================= */}
      <aside className="sidebar-bg hidden lg:flex flex-col w-[228px] shrink-0 text-white">
        <div className="px-5 pt-5 pb-4">
          <Wordmark light compact />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-5 pb-4">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="label-xs !text-pine-200/50 px-2.5 mb-1.5">{group.section}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = view === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer ${
                        isActive ? "bg-white/10 text-white" : "text-pine-200/75 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-marigold-400 transition-all ${
                          isActive ? "h-5 opacity-100" : "h-0 opacity-0"
                        }`}
                      />
                      <item.icon size={16} className={isActive ? "text-marigold-300" : ""} />
                      {item.label}
                      {item.badge ? (
                        <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-marigold-400 text-pine-950 text-[10px] font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <div className="label-xs !text-pine-200/50 px-2.5 mb-1.5">{t("nav.ecosystem")}</div>
            <div className="space-y-0.5">
              <button
                onClick={() => setView("mobile")}
                className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer ${
                  view === "mobile" ? "bg-white/10 text-white" : "text-pine-200/75 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-marigold-400 transition-all ${
                    view === "mobile" ? "h-5 opacity-100" : "h-0 opacity-0"
                  }`}
                />
                <IPhone2 size={16} className={view === "mobile" ? "text-marigold-300" : ""} />
                {t("nav.employeeApp")}
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-marigold-300/90 border border-marigold-400/40 rounded-full px-1.5 py-0.5">
                  {t("login.mobile")}
                </span>
              </button>
              <button
                onClick={() => setKioskOpen(true)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-semibold text-pine-200/75 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                <ITablet size={16} />
                {t("nav.kiosk")}
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-marigold-300/90 border border-marigold-400/40 rounded-full px-1.5 py-0.5">
                  {t("login.tablet")}
                </span>
              </button>
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar name="Valentina Ríos" size={34} />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-bold truncate">Valentina Ríos</div>
              <div className="text-[10.5px] text-pine-200/60">{t("nav.role")}</div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-pine-200/60 hover:text-marigold-300 hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={t("nav.logout")}
              title={t("nav.logout")}
            >
              <ILogout size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= main ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* topbar */}
        <header className="bg-surface/90 backdrop-blur border-b border-line px-4 lg:px-6 py-3 flex items-center gap-3 shrink-0 relative z-30">
          <div className="lg:hidden">
            <Wordmark compact />
          </div>
          <div className="relative hidden md:block">
            <button
              onClick={() => setVenueOpen((o) => !o)}
              className={`flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3 py-1.5 border transition-all cursor-pointer ${
                venueOpen ? "bg-pine-600 text-white border-pine-700" : "text-inksoft bg-pine-50 border-line hover:border-pine-400"
              }`}
            >
              <IStore size={13} className={venueOpen ? "text-marigold-300" : "text-pine-600"} />
              {venue.name}
              <IChevD size={12} className="opacity-70" />
            </button>
            {venueOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setVenueOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-[250px] card shadow-2xl z-50 anim-pop overflow-hidden">
                  <div className="label-xs px-3.5 pt-2.5 pb-1">{t("login.appAdmin")} · 3 venues</div>
                  {VENUES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setVenue(v);
                        setVenueOpen(false);
                        notify(`${t("ven.switched")} ${v.name}`);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-pine-50 transition-colors cursor-pointer ${
                        v.id === venue.id ? "bg-pine-50/70" : ""
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${v.id === venue.id ? "bg-pine-600 text-white" : "bg-pine-50 text-pine-600"}`}>
                        <IBuilding size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold text-ink truncate">{v.name}</div>
                        <div className="text-[10.5px] text-mute">{v.type} · {v.city} · {v.staff} staff</div>
                      </div>
                      {v.id === venue.id && <ICheck size={14} className="text-pine-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* search */}
          <div className="relative flex-1 max-w-[380px] ml-auto lg:ml-6">
            <ISearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input
              className="input-base !pl-9 !py-2 !bg-canvas"
              placeholder={t("topbar.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => setTimeout(() => setQ(""), 180)}
            />
            {q.trim() && (
              <div className="absolute top-full mt-1.5 left-0 right-0 card overflow-hidden anim-pop shadow-xl">
                <div className="label-xs px-3.5 pt-2.5 pb-1">{t("topbar.results")}</div>
                {results.length === 0 && <div className="px-3.5 pb-3 text-[12.5px] text-mute">{t("topbar.noResults")}</div>}
                {results.map((e) => (
                  <button
                    key={e.id}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-pine-50 transition-colors cursor-pointer text-left"
                    onMouseDown={() => {
                      setView("employees");
                      setFocusId(e.id);
                      setQ("");
                    }}
                  >
                    <Avatar name={e.name} size={28} />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-ink truncate">{e.name}</div>
                      <div className="text-[11px] text-mute truncate">{e.role} · {t("dept." + e.dept)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <LangSwitch />

          <span className="hidden md:block font-mono text-[13px] font-semibold text-inksoft tabular-nums w-[74px] text-center">
            {now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </span>

          {/* notifications */}
          <div className="relative">
            <button
              onClick={() => setBellOpen((o) => !o)}
              className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                bellOpen ? "bg-pine-600 text-white border-pine-700" : "bg-surface border-line text-inksoft hover:border-pine-400"
              }`}
              aria-label={t("topbar.notif")}
            >
              <IBell size={17} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-clay-500 text-white text-[9.5px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-[330px] card shadow-2xl z-50 anim-pop overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-pine-50/50">
                    <span className="font-display font-bold text-[14px] text-ink">{t("topbar.notif")}</span>
                    <button
                      className="text-[11.5px] font-semibold text-pine-600 hover:text-pine-700 cursor-pointer"
                      onClick={() => setNotifs((ns) => ns.map((n) => ({ ...n, read: true })))}
                    >
                      {t("topbar.markRead")}
                    </button>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifs.length === 0 && <div className="px-4 py-8 text-center text-[12.5px] text-mute">{t("topbar.empty")}</div>}
                    {notifs.map((n, i) => (
                      <div key={n.id} className={`flex gap-2.5 px-4 py-2.5 border-b border-line/60 last:border-0 ${i === 0 ? "anim-slide-in" : ""} ${n.read ? "opacity-55" : ""}`}>
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-line" : "bg-marigold-400"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] text-ink leading-snug">{n.text}</div>
                          <div className="font-mono text-[10.5px] text-mute mt-0.5">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button onClick={onLogout} className="lg:hidden p-2.5 rounded-xl border border-line text-inksoft cursor-pointer" aria-label={t("nav.logout")}>
            <ILogout size={16} />
          </button>
        </header>

        {/* mobile nav */}
        <nav className="lg:hidden flex gap-1 px-3 py-2 bg-surface border-b border-line overflow-x-auto shrink-0">
          {NAV.flatMap((g) => g.items).map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                view === item.id ? "bg-pine-600 text-white" : "text-inksoft hover:bg-pine-50"
              }`}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setView("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              view === "mobile" ? "bg-pine-600 text-white" : "text-inksoft hover:bg-pine-50"
            }`}
          >
            <IPhone2 size={14} /> {t("nav.employeeApp")}
          </button>
          <button onClick={() => setKioskOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-inksoft hover:bg-pine-50 whitespace-nowrap cursor-pointer">
            <ITablet size={14} /> {t("nav.kiosk")}
          </button>
        </nav>

        {/* content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
          <div className="max-w-[1240px] mx-auto">
            {view === "dashboard" && <Dashboard employees={employees} shifts={shifts} attendance={attendance} events={events} />}
            {view === "employees" && (
              <Employees employees={employees} onSave={saveEmployee} notify={notify} focusId={focusId} onFocusDone={() => setFocusId(null)} />
            )}
            {view === "schedule" && (
              <Schedule
                employees={employees}
                shifts={shifts}
                onAdd={(s) => setShifts((prev) => [...prev, s])}
                onRemove={(id) => setShifts((prev) => prev.filter((s) => s.id !== id))}
                notify={notify}
              />
            )}
            {view === "attendance" && <Attendance employees={employees} attendance={attendance} notify={notify} />}
            {view === "payroll" && <Payroll employees={employees} notify={notify} />}
            {view === "expenses" && <Expenses employees={employees} notify={notify} />}
            {view === "tasks" && <TasksView notify={notify} />}
            {view === "chat" && <ChatView />}
            {view === "training" && <Training />}
            {view === "documents" && <Documents notify={notify} />}
            {view === "incidents" && <Incidents notify={notify} />}
            {view === "reports" && <Reports employees={employees} notify={notify} />}
            {view === "mobile" && <MobileLab onExit={() => setView("dashboard")} />}
          </div>
        </main>
      </div>

      {/* device previews */}
      {kioskOpen && <KioskPreview onClose={() => setKioskOpen(false)} />}

      {/* toasts */}
      <div className="fixed bottom-5 right-5 z-[70] space-y-2 w-[300px]">
        {toasts.map((toast) => (
          <div key={toast.id} className="card anim-slide-in shadow-xl flex items-center gap-2.5 px-3.5 py-3 border-pine-200">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${toast.kind === "ok" ? "bg-pine-600 text-white" : "bg-marigold-400 text-pine-950"}`}>
              {toast.kind === "ok" ? <IZap size={14} /> : <IX size={14} />}
            </span>
            <span className="text-[12.5px] font-semibold text-ink leading-snug">{toast.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Gate() {
  const [authed, setAuthed] = useState(() => {
    try {
      return localStorage.getItem("sh360-auth") === "1";
    } catch {
      return false;
    }
  });

  const login = () => {
    setAuthed(true);
    try {
      localStorage.setItem("sh360-auth", "1");
    } catch {
      /* noop */
    }
  };
  const logout = () => {
    setAuthed(false);
    try {
      localStorage.removeItem("sh360-auth");
    } catch {
      /* noop */
    }
  };

  return authed ? <Shell onLogout={logout} /> : <Login onLogin={login} />;
}

export default function App() {
  return (
    <LangProvider>
      <Gate />
    </LangProvider>
  );
}

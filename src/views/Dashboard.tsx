import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  COVERS_WEEK,
  DEPT_META,
  findConflicts,
  minutes,
  nowTime,
  shiftHours,
  todayIndex,
  type AttRecord,
  type Dept,
  type Employee,
  type LiveEvent,
  type Shift,
} from "../data";
import { useI18n } from "../i18n";
import { IAlert, ICoffee, IClock, IUsers, IZap } from "../icons";
import { Avatar, Pill, SectionHead, useCountUp, useNow } from "../ui";

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card !rounded-lg px-3 py-2 text-[12px] shadow-lg">
      <div className="font-semibold text-ink mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-inksoft">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          {p.name}: <b className="text-ink font-mono">{p.value}</b>
        </div>
      ))}
    </div>
  );
}

const EVENT_ICON = { in: IClock, out: IClock, breakStart: ICoffee, breakEnd: IZap } as const;

export default function Dashboard({
  employees,
  shifts,
  attendance,
  events,
}: {
  employees: Employee[];
  shifts: Shift[];
  attendance: AttRecord[];
  events: LiveEvent[];
}) {
  const { t, lang } = useI18n();
  const now = useNow(1000);
  const today = todayIndex();
  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  /* ----- KPIs ----- */
  const onShiftNow = attendance.filter((a) => !a.clockOut && a.status !== "absent").length;
  const absents = attendance.filter((a) => a.status === "absent").length;
  const lates = attendance.filter((a) => a.status === "late").length;
  const attPct = attendance.length ? ((attendance.length - absents - lates * 0.5) / attendance.length) * 100 : 0;
  const weekHours = useMemo(() => Math.round(shifts.reduce((s, x) => s + shiftHours(x), 0)), [shifts]);
  const avgRate = employees.reduce((s, e) => s + e.rate, 0) / Math.max(1, employees.length);
  const laborK = (weekHours * avgRate) / 1000;

  const kOnShift = useCountUp(onShiftNow);
  const kAtt = useCountUp(attPct);
  const kHours = useCountUp(weekHours);
  const kLabor = useCountUp(laborK);

  /* ----- today shifts with progress ----- */
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayShifts = useMemo(
    () =>
      shifts
        .filter((s) => s.day === today)
        .sort((a, b) => minutes(a.start) - minutes(b.start)),
    [shifts, today],
  );

  /* ----- dept distribution ----- */
  const deptData = useMemo(() => {
    const m = new Map<Dept, number>();
    employees.forEach((e) => m.set(e.dept, (m.get(e.dept) ?? 0) + 1));
    return [...m.entries()].map(([dept, count]) => ({ dept, count, fill: DEPT_META[dept].solid }));
  }, [employees]);

  const conflicts = useMemo(() => findConflicts(shifts), [shifts]);
  const conflictShift = shifts.find((s) => conflicts.has(s.id));
  const conflictEmp = conflictShift ? empById.get(conflictShift.empId) : undefined;
  const onVacation = employees.filter((e) => e.status === "vacation").length;

  const hour = now.getHours();
  const greetKey = hour < 12 ? "dash.greet.morning" : hour < 19 ? "dash.greet.afternoon" : "dash.greet.evening";
  const dateStr = now.toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "en" ? "en-US" : "es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const chartData = COVERS_WEEK.map((c) => ({ ...c, d: t(c.d) }));

  return (
    <div className="space-y-5">
      {/* greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <p className="label-xs mb-1.5">{dateStr}</p>
          <h1 className="font-display font-extrabold text-[30px] md:text-[34px] tracking-tight text-ink leading-none">
            {t(greetKey)}, Valentina
          </h1>
          <p className="text-[13.5px] text-mute mt-2">
            {t("dash.sub")} <b className="text-pine-700">{t("venue")}</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="pine" pulse>
            {t("dash.onShift")}: {onShiftNow}
          </Pill>
          <Pill tone="amber">{todayShifts.length} {t("dash.todayShifts").toLowerCase()}</Pill>
        </div>
      </div>

      {/* KPI band */}
      <div className="card anim-fade-up overflow-hidden" style={{ animationDelay: "0.06s" }}>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <div className="p-5 sidebar-bg text-white relative overflow-hidden md:col-span-1 col-span-2">
            <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-marigold-400/15" />
            <div className="label-xs !text-pine-200/70">{t("dash.onShift")}</div>
            <div className="font-display font-extrabold text-[42px] leading-none mt-2 text-marigold-300">
              {Math.round(kOnShift)}
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-[11.5px] text-pine-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-marigold-400 blink" />
              {nowTime()} · {t("venue")}
            </div>
          </div>
          {[
            { label: t("dash.attendance"), v: kAtt.toFixed(1) + "%", note: `${lates} ${t("att.late").toLowerCase()} · ${absents} ${t("att.absent").toLowerCase()}` },
            { label: t("dash.hours"), v: Math.round(kHours).toLocaleString(), note: `${shifts.length} shifts` },
            { label: t("dash.labor"), v: "$" + kLabor.toFixed(1) + "k", note: `${(laborK / 4.3).toFixed(1)}k / ${t("common.week").toLowerCase()}` },
            { label: t("dash.open"), v: "3", note: "Sous-chef · Barback · Host" },
          ].map((k) => (
            <div key={k.label} className="p-5 border-t md:border-t-0 border-line [&:not(:first-child)]:border-l">
              <div className="label-xs">{k.label}</div>
              <div className="font-display font-bold text-[27px] leading-none mt-2 text-ink tabular-nums">{k.v}</div>
              <div className="text-[11.5px] text-mute mt-2.5">{k.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* left column */}
        <div className="xl:col-span-2 space-y-5">
          {/* chart */}
          <div className="card anim-fade-up" style={{ animationDelay: "0.12s" }}>
            <SectionHead title={t("dash.chartTitle")} sub={t("dash.chartSub")} />
            <div className="px-3 pb-4 h-[248px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e8df" vertical={false} />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: "#7d8b81" }} dy={6} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7d8b81" }} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(37,107,82,0.06)" }} />
                  <Bar dataKey="covers" name={t("dash.covers")} fill="#256b52" radius={[5, 5, 0, 0]} maxBarSize={34} />
                  <Line dataKey="hours" name={t("dash.hoursLeg")} stroke="#e89f2e" strokeWidth={2.5} dot={{ r: 3.5, fill: "#e89f2e", strokeWidth: 2, stroke: "#fff" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-5 px-5 pb-4 -mt-1">
              <span className="flex items-center gap-2 text-[11.5px] font-semibold text-inksoft">
                <span className="w-2.5 h-2.5 rounded-sm bg-pine-500" /> {t("dash.covers")}
              </span>
              <span className="flex items-center gap-2 text-[11.5px] font-semibold text-inksoft">
                <span className="w-2.5 h-2.5 rounded-full bg-marigold-500" /> {t("dash.hoursLeg")}
              </span>
            </div>
          </div>

          {/* today shifts */}
          <div className="card anim-fade-up" style={{ animationDelay: "0.18s" }}>
            <SectionHead
              title={t("dash.todayShifts")}
              sub={t("dash.todayShiftsSub")}
              right={
                <Pill tone={conflicts.size ? "clay" : "pine"}>
                  {conflicts.size ? `${conflicts.size} ${t("sched.conflicts")}` : t("sched.noConflicts")}
                </Pill>
              }
            />
            <div className="px-2 pb-3">
              {todayShifts.length === 0 && (
                <p className="text-[13px] text-mute px-4 pb-4">{t("dash.noShifts")}</p>
              )}
              {todayShifts.map((s, i) => {
                const emp = empById.get(s.empId);
                if (!emp) return null;
                const dur = shiftHours(s) * 60;
                const prog = Math.max(0, Math.min(1, (nowMin - minutes(s.start)) / dur));
                const started = nowMin >= minutes(s.start);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-pine-50/70 transition-colors group anim-fade-up"
                    style={{ animationDelay: `${0.2 + i * 0.04}s` }}
                  >
                    <Avatar name={emp.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-ink truncate">{emp.name}</span>
                        <span className="text-[11px] text-mute">{emp.role}</span>
                      </div>
                      <div className="h-[5px] rounded-full bg-line/70 mt-1.5 overflow-hidden max-w-[280px]">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${prog * 100}%`,
                            background: started ? DEPT_META[emp.dept].solid : "#c9d2c6",
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[12.5px] font-semibold text-ink">
                        {s.start}–{s.end}
                      </div>
                      <div className="text-[11px] text-mute mt-0.5">
                        {started ? `${Math.round(prog * 100)}% ${t("dash.of")}` : `${t("shift." + s.type)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* right column */}
        <div className="space-y-5">
          {/* live feed */}
          <div className="card anim-fade-up" style={{ animationDelay: "0.15s" }}>
            <SectionHead
              title={t("dash.live")}
              sub={t("dash.liveSub")}
              right={
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-clay-500 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-clay-500 blink" /> Live
                </span>
              }
            />
            <div className="px-3 pb-4 max-h-[300px] overflow-y-auto">
              {events.map((ev, i) => {
                const emp = empById.get(ev.empId);
                const Icon = EVENT_ICON[ev.kind];
                return (
                  <div
                    key={ev.id}
                    className={`flex items-center gap-3 px-2 py-2 rounded-lg ${i === 0 ? "anim-slide-in bg-pine-50/80" : ""}`}
                  >
                    <div className="relative">
                      <Avatar name={emp?.name ?? "?"} size={30} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-pine-600 text-white flex items-center justify-center ring-2 ring-white">
                        <Icon size={8} sw={2.6} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[12.5px] font-semibold text-ink">{emp?.name}</span>{" "}
                      <span className="text-[12.5px] text-inksoft">{t("notif." + (ev.kind === "in" ? "in" : ev.kind === "out" ? "out" : ev.kind))}</span>
                    </div>
                    <span className="font-mono text-[11px] text-mute shrink-0">{ev.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* dept donut */}
          <div className="card anim-fade-up" style={{ animationDelay: "0.21s" }}>
            <SectionHead title={t("dash.dept")} sub={`${employees.length} ${t("dash.people")}`} />
            <div className="flex items-center gap-2 px-5 pb-5">
              <div className="w-[130px] h-[130px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptData} dataKey="count" nameKey="dept" innerRadius={38} outerRadius={58} paddingAngle={3} strokeWidth={0}>
                      {deptData.map((d) => (
                        <Cell key={d.dept} fill={d.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {deptData.map((d) => (
                  <div key={d.dept} className="flex items-center gap-2 text-[12px]">
                    <span className="w-2.5 h-2.5 rounded-[4px]" style={{ background: d.fill }} />
                    <span className="text-inksoft font-medium">{t("dept." + d.dept)}</span>
                    <span className="ml-auto font-mono font-semibold text-ink">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* alerts */}
          <div className="card anim-fade-up" style={{ animationDelay: "0.27s" }}>
            <SectionHead title={t("dash.alerts")} />
            <div className="px-4 pb-4 space-y-2">
              {conflictEmp && conflictShift && (
                <div className="flex items-start gap-2.5 rounded-xl border border-clay-500/30 bg-clay-100/50 px-3 py-2.5">
                  <IAlert size={15} className="text-clay-600 mt-0.5 shrink-0" />
                  <div className="text-[12px] text-ink leading-snug">
                    <b>{t("dash.conflict")}:</b> {conflictEmp.name} {t("dash.conflictDesc")}{" "}
                    <b>{t("day." + conflictShift.day)}</b>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5 rounded-xl border border-marigold-500/30 bg-marigold-200/30 px-3 py-2.5">
                <IUsers size={15} className="text-marigold-600 mt-0.5 shrink-0" />
                <div className="text-[12px] text-ink leading-snug">
                  <b>{t("dash.vacation")}:</b> {onVacation} {t("dash.vacationDesc")}
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-line bg-pine-50/60 px-3 py-2.5">
                <IAlert size={15} className="text-pine-600 mt-0.5 shrink-0" />
                <div className="text-[12px] text-ink leading-snug">
                  <b>{t("dash.doc")}:</b> Andrés Quispe — {t("dash.docDesc")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

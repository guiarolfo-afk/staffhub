import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ATT_TREND, DEPT_COST, DEPT_META, LABOR_WEEKS, downloadCSV, type Employee } from "../data";
import { useI18n } from "../i18n";
import { IBell, IDownload } from "../icons";
import { SectionHead, useCountUp } from "../ui";

function Tip({ active, payload, label, unit = "" }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card !rounded-lg px-3 py-2 text-[12px] shadow-lg">
      <div className="font-semibold text-ink mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-inksoft">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          {p.name}: <b className="text-ink font-mono">{p.value}{unit}</b>
        </div>
      ))}
    </div>
  );
}

export default function Reports({ employees, notify }: { employees: Employee[]; notify: (m: string) => void }) {
  const { t } = useI18n();
  const activeStaff = employees.filter((e) => e.status === "active").length;

  const k1 = useCountUp(activeStaff);
  const k2 = useCountUp(12.4);
  const k3 = useCountUp(4.6);
  const k4 = useCountUp(32);

  const kpis = [
    { label: t("rep.headcount"), v: Math.round(k1).toString(), note: `${employees.length - activeStaff} away` },
    { label: t("rep.turnover"), v: k2.toFixed(1) + "%", note: "-2.1 pts vs Q3" },
    { label: t("rep.satisfaction"), v: k3.toFixed(1) + "/5", note: "eNPS +41" },
    { label: t("rep.overtime"), v: Math.round(k4) + "h", note: "68% < Sala" },
  ];

  const monthTotal = useMemo(() => DEPT_COST.reduce((s, d) => s + d.monthCost, 0), []);

  const exportCsv = () => {
    downloadCSV("staffhub-resumen.csv", [
      [t("rep.dept"), t("rep.staff"), t("rep.avgRate"), t("rep.weekHours"), t("rep.cost")],
      ...DEPT_COST.map((d) => [t("dept." + d.dept), d.staff, "$" + d.avgRate, d.weekHours, "$" + d.monthCost]),
    ]);
    notify(t("rep.exported"));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("rep.title")}</h1>
          <p className="text-[13.5px] text-mute mt-1.5">{t("rep.sub")}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={exportCsv}>
            <IDownload size={15} /> {t("rep.csv")}
          </button>
          <button className="btn-primary" onClick={() => notify(t("rep.scheduled"))}>
            <IBell size={15} /> {t("rep.schedule")}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="label-xs">{k.label}</div>
            <div className="font-display font-extrabold text-[30px] leading-none mt-2 text-ink tabular-nums">{k.v}</div>
            <div className="text-[11.5px] text-mute mt-2">{k.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* labor vs budget */}
        <div className="card xl:col-span-3 anim-fade-up" style={{ animationDelay: "0.1s" }}>
          <SectionHead title={t("rep.laborTitle")} sub={t("rep.laborSub")} />
          <div className="px-3 pb-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LABOR_WEEKS} margin={{ top: 6, right: 12, left: -14, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e8df" vertical={false} />
                <XAxis dataKey="w" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: "#7d8b81" }} dy={6} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7d8b81" }} />
                <Tooltip content={<Tip unit="k" />} cursor={{ fill: "rgba(37,107,82,0.06)" }} />
                <Bar dataKey="budget" name={t("rep.budget")} fill="#c9d5cb" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="actual" name={t("rep.actual")} fill="#256b52" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 px-5 pb-4">
            <span className="flex items-center gap-2 text-[11.5px] font-semibold text-inksoft">
              <span className="w-2.5 h-2.5 rounded-sm bg-pine-500" /> {t("rep.actual")}
            </span>
            <span className="flex items-center gap-2 text-[11.5px] font-semibold text-inksoft">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#c9d5cb]" /> {t("rep.budget")}
            </span>
          </div>
        </div>

        {/* attendance trend */}
        <div className="card xl:col-span-2 anim-fade-up" style={{ animationDelay: "0.16s" }}>
          <SectionHead title={t("rep.attTitle")} sub={t("rep.attSub")} />
          <div className="px-3 pb-5 h-[268px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ATT_TREND} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e89f2e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#e89f2e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e8df" vertical={false} />
                <XAxis dataKey="w" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: "#7d8b81" }} dy={6} />
                <YAxis domain={[85, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7d8b81" }} />
                <Tooltip content={<Tip unit="%" />} />
                <Area dataKey="pct" name={t("rep.attendance")} stroke="#e89f2e" strokeWidth={2.5} fill="url(#attGrad)" dot={{ r: 3.5, fill: "#e89f2e", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* dept summary */}
      <div className="card overflow-hidden anim-fade-up" style={{ animationDelay: "0.22s" }}>
        <SectionHead title={t("rep.deptTitle")} sub={t("rep.deptSub")} />
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[680px]">
            <thead>
              <tr className="border-y border-line bg-pine-50/50">
                {[t("rep.dept"), t("rep.staff"), t("rep.avgRate"), t("rep.weekHours"), t("rep.cost"), ""].map((h, i) => (
                  <th key={i} className="label-xs px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEPT_COST.map((d, i) => {
                const dm = DEPT_META[d.dept];
                const pct = (d.monthCost / monthTotal) * 100;
                return (
                  <tr key={d.dept} className="border-b border-line/70 last:border-0 hover:bg-pine-50/60 transition-colors anim-fade-up" style={{ animationDelay: `${0.24 + i * 0.04}s` }}>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                        <span className="w-2.5 h-2.5 rounded-[4px]" style={{ background: dm.solid }} />
                        {t("dept." + d.dept)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-inksoft">{d.staff}</td>
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-inksoft">${d.avgRate}/h</td>
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-inksoft">{d.weekHours}h</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[12.5px] font-semibold text-ink w-[64px]">${(d.monthCost / 1000).toFixed(1)}k</span>
                        <div className="w-28 h-[7px] rounded-full bg-line/70 overflow-hidden">
                          <div className="h-full rounded-full bar-grow" style={{ width: `${pct}%`, background: dm.solid, animationDelay: `${0.3 + i * 0.06}s` }} />
                        </div>
                        <span className="text-[11px] text-mute font-mono w-10">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

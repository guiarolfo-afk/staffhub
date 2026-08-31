import { useMemo, useState } from "react";
import { downloadCSV, minutes, nowTime, type AttRecord, type AttStatus, type Employee } from "../data";
import { useI18n } from "../i18n";
import { IClock, IDownload, ISearch, IUsers, IZap, IAlert } from "../icons";
import { Avatar, Pill } from "../ui";

const TONE: Record<AttStatus, "pine" | "amber" | "clay" | "sea" | "slate"> = {
  onShift: "pine",
  onTime: "pine",
  late: "amber",
  absent: "clay",
  break: "sea",
  off: "slate",
};

export default function Attendance({
  employees,
  attendance,
  notify,
}: {
  employees: Employee[];
  attendance: AttRecord[];
  notify: (msg: string) => void;
}) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<AttStatus | "all">("all");
  const [q, setQ] = useState("");
  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const count = (s: AttStatus) => attendance.filter((a) => a.status === s).length;

  const rows = useMemo(
    () =>
      attendance.filter((a) => {
        const emp = empById.get(a.empId);
        const matchQ = !q || (emp?.name ?? "").toLowerCase().includes(q.toLowerCase());
        const matchF = filter === "all" || a.status === filter;
        return matchQ && matchF;
      }),
    [attendance, q, filter, empById],
  );

  const workedH = (a: AttRecord) => {
    if (!a.clockIn) return "—";
    const end = a.clockOut ? minutes(a.clockOut) : minutes(nowTime());
    const h = (end - minutes(a.clockIn)) / 60;
    return h > 0 ? h.toFixed(1) + "h" : "—";
  };

  const tiles = [
    { key: "onShift" as AttStatus, label: t("att.onShift"), v: count("onShift"), icon: IZap, fg: "#1b5a43", bg: "#e2efe7" },
    { key: "onTime" as AttStatus, label: t("att.onTime"), v: count("onTime"), icon: IClock, fg: "#1f5d6a", bg: "#dfeef1" },
    { key: "late" as AttStatus, label: t("att.late"), v: count("late"), icon: IAlert, fg: "#9d6212", bg: "#f8eed6" },
    { key: "absent" as AttStatus, label: t("att.absent"), v: count("absent"), icon: IUsers, fg: "#b04327", bg: "#f8e3dc" },
  ];

  const exportCsv = () => {
    downloadCSV("staffhub-asistencia.csv", [
      [t("att.employee"), t("emp.dept"), t("att.clockIn"), t("att.clockOut"), t("att.hours"), t("att.status")],
      ...rows.map((a) => {
        const emp = empById.get(a.empId);
        return [emp?.name ?? "", emp ? t("dept." + emp.dept) : "", a.clockIn, a.clockOut ?? "—", workedH(a), t("st." + a.status)];
      }),
    ]);
    notify(t("att.exported"));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("att.title")}</h1>
          <p className="text-[13.5px] text-mute mt-1.5 flex items-center gap-2">
            {t("att.sub")}
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-clay-500 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-clay-500 blink" /> Live
            </span>
          </p>
        </div>
        <button className="btn-ghost" onClick={exportCsv}>
          <IDownload size={15} /> {t("att.export")}
        </button>
      </div>

      {/* tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            onClick={() => setFilter(filter === tile.key ? "all" : tile.key)}
            className={`card p-4 flex items-center gap-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
              filter === tile.key ? "!border-pine-500 ring-2 ring-pine-500/20" : ""
            }`}
          >
            <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: tile.bg, color: tile.fg }}>
              <tile.icon size={20} />
            </span>
            <div>
              <div className="font-display font-extrabold text-[26px] leading-none text-ink tabular-nums">{tile.v}</div>
              <div className="label-xs mt-1">{tile.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* toolbar */}
      <div className="card p-3 flex flex-wrap items-center gap-2 anim-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "onShift", "onTime", "late", "absent", "break", "off"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all cursor-pointer ${
                filter === f
                  ? "bg-pine-600 text-white border-pine-700 shadow-sm"
                  : "bg-surface text-inksoft border-line hover:border-pine-400 hover:text-pine-700"
              }`}
            >
              {f === "all" ? t("att.all") : t("st." + f)}
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[200px] flex-1 max-w-[280px]">
          <ISearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input className="input-base !pl-9" placeholder={t("att.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {/* table */}
      <div className="card overflow-hidden anim-fade-up" style={{ animationDelay: "0.16s" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-line bg-pine-50/50">
                {[t("att.employee"), t("emp.dept"), t("att.clockIn"), t("att.clockOut"), t("att.hours"), t("att.status")].map((h, i) => (
                  <th key={i} className="label-xs px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => {
                const emp = empById.get(a.empId);
                if (!emp) return null;
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-line/70 last:border-0 transition-colors hover:bg-pine-50/60 ${i === 0 ? "anim-slide-in" : "anim-fade-up"}`}
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.name} size={32} />
                        <div>
                          <div className="text-[13px] font-semibold text-ink">{emp.name}</div>
                          <div className="text-[11px] text-mute">{emp.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-inksoft">{t("dept." + emp.dept)}</td>
                    <td className="px-4 py-3 font-mono text-[12.5px] font-semibold text-ink">{a.clockIn || "—"}</td>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-inksoft">{a.clockOut ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-inksoft">{workedH(a)}</td>
                    <td className="px-4 py-3">
                      <Pill tone={TONE[a.status]} pulse={a.status === "onShift" || a.status === "break"}>{t("st." + a.status)}</Pill>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-mute">{t("emp.empty")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11.5px] text-mute px-4 py-2.5 border-t border-line bg-pine-50/40 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-pine-500 blink" />
          {t("att.live")}
        </p>
      </div>
    </div>
  );
}

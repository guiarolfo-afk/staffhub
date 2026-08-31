import { useMemo, useState } from "react";
import { downloadCSV, makePayslips, type Employee, type Payslip, type PayStatus } from "../data";
import { useI18n } from "../i18n";
import { IBanknote, ICheck, IDownload, IZap } from "../icons";
import { Avatar, Pill, SectionHead, useCountUp } from "../ui";

const STATUS_TONE: Record<PayStatus, "pine" | "amber" | "slate"> = {
  paid: "pine",
  processing: "amber",
  pending: "slate",
};

function money(n: number) {
  return "$" + n.toLocaleString("en-US");
}

export default function Payroll({ employees, notify }: { employees: Employee[]; notify: (m: string) => void }) {
  const { t } = useI18n();
  const [slips, setSlips] = useState<Payslip[]>(() => makePayslips(employees));
  const [running, setRunning] = useState(false);
  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const totals = useMemo(() => {
    const total = slips.reduce((s, p) => s + p.net, 0);
    const paid = slips.filter((p) => p.status === "paid").length;
    const processing = slips.filter((p) => p.status === "processing").length;
    const pending = slips.filter((p) => p.status === "pending").length;
    return { total, paid, processing, pending };
  }, [slips]);

  const kTotal = useCountUp(totals.total / 1000);

  const canRun = totals.pending + totals.processing > 0;

  const run = () => {
    if (!canRun || running) return;
    setRunning(true);
    setTimeout(() => {
      setSlips((prev) => prev.map((p) => ({ ...p, status: "paid" as PayStatus })));
      setRunning(false);
      notify(t("pay.ran"));
    }, 2400);
  };

  const download = (p: Payslip) => {
    const emp = empById.get(p.empId);
    downloadCSV(`recibo-${emp?.name ?? p.empId}.csv`, [
      ["StaffHub 360 · Payslip"],
      [t("pay.employee"), emp?.name ?? ""],
      [t("pay.base"), p.base],
      [t("pay.extras"), p.extras],
      [t("pay.ded"), p.deductions],
      [t("pay.net"), p.net],
      [t("pay.status"), t("pay.st." + p.status)],
    ]);
    notify(t("pay.downloaded"));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("pay.title")}</h1>
          <p className="text-[13.5px] text-mute mt-1.5">{t("pay.sub")}</p>
        </div>
        <button className="btn-primary" onClick={run} disabled={!canRun || running}>
          {running ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="animate-spin">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <IZap size={15} />
          )}
          {running ? t("pay.running") : t("pay.run")}
        </button>
      </div>

      {/* totals band */}
      <div className="card grid grid-cols-2 lg:grid-cols-4 overflow-hidden anim-fade-up" style={{ animationDelay: "0.06s" }}>
        <div className="p-5 sidebar-bg text-white">
          <div className="label-xs !text-pine-200/70">{t("pay.total")}</div>
          <div className="font-display font-extrabold text-[30px] leading-none mt-2 text-marigold-300 tabular-nums">
            ${kTotal.toFixed(1)}k
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-pine-200/75">
            <IBanknote size={13} /> Enero 2025 · 16 {t("dash.people")}
          </div>
        </div>
        {[
          { label: t("pay.paidN"), v: totals.paid, tone: "#256b52" },
          { label: t("pay.procN"), v: totals.processing, tone: "#e89f2e" },
          { label: t("pay.pendN"), v: totals.pending, tone: "#54688c" },
        ].map((k) => (
          <div key={k.label} className="p-5 border-l border-line">
            <div className="label-xs">{k.label}</div>
            <div className="font-display font-bold text-[27px] leading-none mt-2 text-ink tabular-nums">{k.v}</div>
            <div className="h-[6px] rounded-full bg-line/70 mt-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(k.v / Math.max(1, slips.length)) * 100}%`, background: k.tone }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* slips table */}
      <div className="card anim-fade-up" style={{ animationDelay: "0.12s" }}>
        <SectionHead title={`${t("pay.title")} · ${slips.length}`} sub={t("pay.note")} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="label-xs border-y border-line bg-pine-50/50">
                <th className="px-5 py-2.5 font-semibold">{t("pay.employee")}</th>
                <th className="px-4 py-2.5 font-semibold text-right">{t("pay.base")}</th>
                <th className="px-4 py-2.5 font-semibold text-right">{t("pay.extras")}</th>
                <th className="px-4 py-2.5 font-semibold text-right">{t("pay.ded")}</th>
                <th className="px-4 py-2.5 font-semibold text-right">{t("pay.net")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("pay.status")}</th>
                <th className="px-4 py-2.5 font-semibold text-right">{t("pay.slip")}</th>
              </tr>
            </thead>
            <tbody>
              {slips.map((p) => {
                const emp = empById.get(p.empId);
                if (!emp) return null;
                return (
                  <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-pine-50/60 transition-colors">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={emp.name} size={30} />
                        <div>
                          <div className="font-semibold text-ink">{emp.name}</div>
                          <div className="text-[11px] text-mute">{emp.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-inksoft">{money(p.base)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-pine-700">{p.extras ? "+" + money(p.extras) : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-clay-600">−{money(p.deductions)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-ink">{money(p.net)}</td>
                    <td className="px-4 py-2.5">
                      <Pill tone={STATUS_TONE[p.status]}>{t("pay.st." + p.status)}</Pill>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => download(p)}
                        className="p-2 rounded-lg border border-line text-inksoft hover:border-pine-400 hover:text-pine-700 hover:bg-pine-50 transition-all cursor-pointer"
                        title={t("pay.slip")}
                      >
                        {p.status === "paid" ? <IDownload size={14} /> : <ICheck size={14} className="opacity-40" />}
                      </button>
                    </td>
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

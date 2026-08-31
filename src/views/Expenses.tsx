import { useMemo, useState } from "react";
import { EXP_CATS, EXP_CAT_COLOR, EXPENSES, type Employee, type Expense } from "../data";
import { useI18n } from "../i18n";
import { ICheck, IReceipt, IScan, IX, IZap } from "../icons";
import { Avatar, Pill, SectionHead } from "../ui";

export default function Expenses({ employees, notify }: { employees: Employee[]; notify: (m: string) => void }) {
  const { t } = useI18n();
  const [items, setItems] = useState<Expense[]>(EXPENSES);
  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const pending = items.filter((x) => x.status === "pending");
  const history = items.filter((x) => x.status !== "pending");

  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    items.filter((x) => x.status !== "rejected").forEach((x) => m.set(x.category, (m.get(x.category) ?? 0) + x.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);
  const maxCat = byCat[0]?.[1] ?? 1;
  const monthTotal = byCat.reduce((s, [, v]) => s + v, 0);

  const setStatus = (id: string, status: Expense["status"]) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    notify(status === "approved" ? t("exp.approved") : t("exp.rejected"));
  };

  return (
    <div className="space-y-4">
      <div className="anim-fade-up">
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("exp.title")}</h1>
        <p className="text-[13.5px] text-mute mt-1.5 flex items-center gap-2">
          {t("exp.sub")}
          <Pill tone="amber"><IZap size={11} /> IA</Pill>
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {/* approval queue */}
          <div className="card anim-fade-up" style={{ animationDelay: "0.08s" }}>
            <SectionHead
              title={t("exp.queue")}
              sub={`${pending.length} ${t("exp.st.pending").toLowerCase()}`}
              right={pending.length > 0 ? <Pill tone="amber" pulse>{pending.length}</Pill> : undefined}
            />
            <div className="px-4 pb-4 space-y-2.5">
              {pending.length === 0 && (
                <div className="text-center py-8">
                  <span className="mx-auto w-11 h-11 rounded-full bg-pine-50 text-pine-600 flex items-center justify-center">
                    <ICheck size={20} />
                  </span>
                  <p className="text-[13px] text-mute mt-2.5">{t("exp.approved")} ✓</p>
                </div>
              )}
              {pending.map((x) => {
                const emp = empById.get(x.empId);
                return (
                  <div key={x.id} className="rounded-xl border border-line bg-canvas/60 p-3.5 flex flex-wrap items-center gap-3 hover:border-marigold-400/60 transition-colors anim-fade-up">
                    <div className="flex items-center gap-3 min-w-0 flex-1 basis-[220px]">
                      <Avatar name={emp?.name ?? "?"} size={36} />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-ink truncate">{x.concept}</div>
                        <div className="text-[11.5px] text-mute">
                          {emp?.name} · <span className="font-mono">{x.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold text-white"
                        style={{ background: EXP_CAT_COLOR[x.category] }}
                      >
                        {t("exp.cat." + x.category)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 text-[10.5px] font-bold text-inksoft" title={x.confidence + "% " + t("exp.conf")}>
                        {x.source === "ocr" ? <IScan size={11} /> : <IReceipt size={11} />}
                        {x.source.toUpperCase()} · {x.confidence}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="font-mono font-bold text-[16px] text-ink">${x.amount.toFixed(2)}</span>
                      <button
                        onClick={() => setStatus(x.id, "approved")}
                        className="p-2 rounded-lg bg-pine-600 text-white hover:bg-pine-500 transition-colors cursor-pointer"
                        title={t("exp.approve")}
                      >
                        <ICheck size={15} sw={2.2} />
                      </button>
                      <button
                        onClick={() => setStatus(x.id, "rejected")}
                        className="p-2 rounded-lg border border-clay-500/40 text-clay-600 hover:bg-clay-100 transition-colors cursor-pointer"
                        title={t("exp.reject")}
                      >
                        <IX size={15} sw={2.2} />
                      </button>
                    </div>
                    {/* confidence bar */}
                    <div className="w-full h-[4px] rounded-full bg-line/70 overflow-hidden -mt-1">
                      <div
                        className="h-full rounded-full bar-grow"
                        style={{
                          width: `${x.confidence}%`,
                          background: x.confidence > 90 ? "#256b52" : x.confidence > 80 ? "#e89f2e" : "#ce5638",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* history */}
          <div className="card anim-fade-up" style={{ animationDelay: "0.14s" }}>
            <SectionHead title={t("exp.history")} />
            <div className="px-4 pb-4">
              {history.map((x) => {
                const emp = empById.get(x.empId);
                return (
                  <div key={x.id} className="flex items-center gap-3 py-2.5 border-b border-line/60 last:border-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: EXP_CAT_COLOR[x.category] }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold text-ink truncate">{x.concept}</div>
                      <div className="text-[11px] text-mute">{emp?.name} · {t("exp.cat." + x.category)}</div>
                    </div>
                    <span className="font-mono text-[12.5px] font-semibold text-ink">${x.amount.toFixed(2)}</span>
                    <Pill tone={x.status === "approved" ? "pine" : "clay"}>{t("exp.st." + x.status)}</Pill>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* category summary */}
        <div className="card self-start anim-fade-up" style={{ animationDelay: "0.1s" }}>
          <SectionHead title={t("exp.byCat")} sub={`${t("exp.month")} · $${monthTotal.toFixed(0)}`} />
          <div className="px-5 pb-5 space-y-3.5">
            {byCat.map(([cat, v], i) => (
              <div key={cat}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-semibold text-ink">{t("exp.cat." + cat)}</span>
                  <span className="font-mono font-semibold text-inksoft">${v.toFixed(0)}</span>
                </div>
                <div className="h-[8px] rounded-full bg-line/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bar-grow"
                    style={{ width: `${(v / maxCat) * 100}%`, background: EXP_CAT_COLOR[cat], animationDelay: `${0.15 + i * 0.07}s` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

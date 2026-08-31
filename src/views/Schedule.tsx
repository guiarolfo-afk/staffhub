import { useMemo, useState } from "react";
import {
  SHIFT_META,
  findConflicts,
  fmtDate,
  initials,
  shiftHours,
  todayIndex,
  weekDates,
  type Employee,
  type Shift,
  type ShiftType,
} from "../data";
import { useI18n } from "../i18n";
import { IAlert, IChevL, IChevR, IPlus } from "../icons";
import { Field, Modal, Pill } from "../ui";

export default function Schedule({
  employees,
  shifts,
  onAdd,
  onRemove,
  notify,
}: {
  employees: Employee[];
  shifts: Shift[];
  onAdd: (s: Shift) => void;
  onRemove: (id: string) => void;
  notify: (msg: string) => void;
}) {
  const { t, lang } = useI18n();
  const [offset, setOffset] = useState(0);
  const [modalDay, setModalDay] = useState<number | null>(null);
  const [form, setForm] = useState({ empId: "", type: "morning" as ShiftType, start: "09:00", end: "17:00" });

  const dates = weekDates(offset);
  const conflicts = useMemo(() => findConflicts(shifts), [shifts]);
  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const activeEmps = employees.filter((e) => e.status === "active");
  const today = todayIndex();

  const hoursByEmp = useMemo(() => {
    const m = new Map<string, number>();
    shifts.forEach((s) => m.set(s.empId, (m.get(s.empId) ?? 0) + shiftHours(s)));
    return [...m.entries()]
      .map(([id, h]) => ({ emp: empById.get(id), h }))
      .filter((x) => x.emp)
      .sort((a, b) => b.h - a.h)
      .slice(0, 7);
  }, [shifts, empById]);
  const maxH = hoursByEmp[0]?.h ?? 1;
  const totalWeek = useMemo(() => Math.round(shifts.reduce((s, x) => s + shiftHours(x), 0)), [shifts]);

  const openModal = (day: number) => {
    setForm({ empId: activeEmps[0]?.id ?? "", type: "morning", start: "09:00", end: "17:00" });
    setModalDay(day);
  };

  const addShift = () => {
    if (modalDay === null || !form.empId) return;
    onAdd({ id: "s" + Date.now(), empId: form.empId, day: modalDay, start: form.start, end: form.end, type: form.type });
    notify(t("sched.added"));
    setModalDay(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("sched.title")}</h1>
          <p className="text-[13.5px] text-mute mt-1.5">{t("sched.sub")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={conflicts.size ? "clay" : "pine"}>
            {conflicts.size ? `${conflicts.size} ${t("sched.conflicts")}` : t("sched.noConflicts")}
          </Pill>
        </div>
      </div>

      {/* week nav + legend */}
      <div className="card p-3 flex flex-wrap items-center gap-3 anim-fade-up" style={{ animationDelay: "0.06s" }}>
        <div className="flex items-center gap-1">
          <button className="btn-ghost !p-2" onClick={() => setOffset((o) => o - 1)} aria-label="prev">
            <IChevL size={16} />
          </button>
          <button className="btn-ghost !p-2" onClick={() => setOffset((o) => o + 1)} aria-label="next">
            <IChevR size={16} />
          </button>
        </div>
        <div className="text-[13.5px] font-semibold text-ink">
          {t("sched.week")} · {fmtDate(dates[0], lang)} — {fmtDate(dates[6], lang)}
        </div>
        {offset !== 0 && (
          <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={() => setOffset(0)}>
            {t("common.today")}
          </button>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {(["morning", "afternoon", "night"] as ShiftType[]).map((ty) => (
            <span key={ty} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-inksoft">
              <span className="w-2.5 h-2.5 rounded-[4px]" style={{ background: SHIFT_META[ty].solid }} />
              {t("shift." + ty)}
            </span>
          ))}
          <span className="hidden md:block text-[11.5px] text-mute border-l border-line pl-3">
            {t("sched.total")}: <b className="font-mono text-ink">{totalWeek}h</b>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_270px] gap-4">
        {/* week grid */}
        <div className="card overflow-x-auto anim-fade-up" style={{ animationDelay: "0.12s" }}>
          <div className="min-w-[780px]">
          <div className="grid grid-cols-7 border-b border-line bg-pine-50/50">
            {dates.map((d, i) => (
              <div
                key={i}
                className={`px-2 py-2.5 text-center border-l border-line/70 first:border-l-0 ${i === today && offset === 0 ? "bg-marigold-200/40" : ""}`}
              >
                <div className={`text-[11px] font-bold uppercase tracking-wider ${i === today && offset === 0 ? "text-marigold-700" : "text-mute"}`}>
                  {t("day." + i)}
                </div>
                <div className={`font-mono text-[12px] font-semibold mt-0.5 ${i === today && offset === 0 ? "text-marigold-700" : "text-inksoft"}`}>
                  {fmtDate(d, lang)}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {dates.map((_, day) => {
              const dayShifts = shifts.filter((s) => s.day === day).sort((a, b) => a.start.localeCompare(b.start));
              return (
                <div
                  key={day}
                  onClick={() => openModal(day)}
                  className={`min-h-[150px] border-l border-line/70 first:border-l-0 p-1.5 cursor-pointer transition-colors hover:bg-pine-50/50 group ${
                    day === today && offset === 0 ? "bg-marigold-200/15" : ""
                  }`}
                >
                  <div className="space-y-1.5">
                    {dayShifts.map((s) => {
                      const emp = empById.get(s.empId);
                      const conf = conflicts.has(s.id);
                      const sm = SHIFT_META[s.type];
                      return (
                        <button
                          key={s.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(s.id);
                            notify(t("sched.removed"));
                          }}
                          title={`${emp?.name} · ${s.start}–${s.end}`}
                          className={`w-full text-left rounded-lg border px-1.5 py-1.5 transition-all cursor-pointer hover:scale-[1.03] hover:shadow-sm ${
                            conf ? "border-clay-500 ring-1 ring-clay-500/50" : "border-transparent"
                          }`}
                          style={{ background: sm.bg }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                              style={{ background: sm.solid }}
                            >
                              {emp ? initials(emp.name) : "?"}
                            </span>
                            <span className="font-mono text-[10.5px] font-semibold" style={{ color: sm.fg }}>
                              {s.start}–{s.end}
                            </span>
                            {conf && <IAlert size={11} className="text-clay-600 ml-auto shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                    {dayShifts.length === 0 && (
                      <div className="text-[11px] text-mute/70 text-center pt-4">{t("sched.empty")}</div>
                    )}
                  </div>
                  <div className="flex justify-center pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-6 h-6 rounded-full border border-dashed border-pine-400 text-pine-500 flex items-center justify-center">
                      <IPlus size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
          <p className="text-[11.5px] text-mute px-4 py-2.5 border-t border-line bg-pine-50/40 min-w-[780px]">{t("sched.hint")}</p>
        </div>

        {/* hours panel */}
        <div className="space-y-4">
          <div className="card anim-fade-up" style={{ animationDelay: "0.18s" }}>
            <div className="px-5 pt-4 pb-2">
              <h3 className="font-display font-bold text-[15.5px] text-ink">{t("sched.hoursWeek")}</h3>
              <p className="text-[12px] text-mute mt-0.5">{t("sched.hoursSub")}</p>
            </div>
            <div className="px-5 pb-4 space-y-3">
              {hoursByEmp.map(({ emp, h }, i) => (
                <div key={emp!.id}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="font-semibold text-ink truncate">{emp!.name}</span>
                    <span className="font-mono font-semibold text-pine-700">{Math.round(h)}h</span>
                  </div>
                  <div className="h-[7px] rounded-full bg-line/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bar-grow"
                      style={{
                        width: `${(h / maxH) * 100}%`,
                        background: h > 44 ? "#ce5638" : h > 38 ? "#e89f2e" : "#256b52",
                        animationDelay: `${0.2 + i * 0.05}s`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* assign modal */}
      <Modal
        open={modalDay !== null}
        onClose={() => setModalDay(null)}
        title={t("sched.assign")}
        sub={`${t("sched.assignSub")} · ${t("day." + (modalDay ?? 0))} ${modalDay !== null ? fmtDate(dates[modalDay], lang) : ""}`}
        width={460}
      >
        <div className="space-y-4">
          <Field label={t("sched.employee")}>
            <select className="input-base cursor-pointer" value={form.empId} onChange={(e) => setForm({ ...form, empId: e.target.value })}>
              {activeEmps.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.role}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("sched.start")}>
              <input type="time" className="input-base font-mono" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </Field>
            <Field label={t("sched.end")}>
              <input type="time" className="input-base font-mono" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </Field>
          </div>
          <div>
            <span className="label-xs block mb-1.5">{t("sched.type")}</span>
            <div className="grid grid-cols-3 gap-2">
              {(["morning", "afternoon", "night"] as ShiftType[]).map((ty) => (
                <button
                  key={ty}
                  type="button"
                  onClick={() => setForm({ ...form, type: ty })}
                  className={`rounded-lg border px-3 py-2.5 text-[12.5px] font-semibold transition-all cursor-pointer ${
                    form.type === ty ? "border-pine-600 text-white shadow-sm" : "border-line text-inksoft hover:border-pine-400"
                  }`}
                  style={form.type === ty ? { background: SHIFT_META[ty].solid } : undefined}
                >
                  {t("shift." + ty)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={() => setModalDay(null)}>{t("emp.cancel")}</button>
            <button className="btn-primary" onClick={addShift}>
              <IPlus size={15} /> {t("sched.add")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

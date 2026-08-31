import { useEffect, useMemo, useState } from "react";
import {
  DEPT_META,
  downloadCSV,
  type Dept,
  type EmpStatus,
  type Employee,
} from "../data";
import { useI18n } from "../i18n";
import { IDownload, IPencil, IPlus, ISearch } from "../icons";
import { Avatar, Field, Modal, Pill } from "../ui";

const ALL_LANGS = ["ES", "PT", "EN", "FR"];

function blankForm(): Employee {
  return {
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    dept: "hall",
    status: "active",
    hired: new Date().toISOString().slice(0, 10),
    langs: ["ES"],
    rate: 14,
    score: 80,
  };
}

export default function Employees({
  employees,
  onSave,
  notify,
  focusId,
  onFocusDone,
}: {
  employees: Employee[];
  onSave: (e: Employee, isNew: boolean) => void;
  notify: (msg: string) => void;
  focusId: string | null;
  onFocusDone: () => void;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<Dept | "all">("all");
  const [status, setStatus] = useState<EmpStatus | "all">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Employee>(blankForm());
  const [isNew, setIsNew] = useState(true);

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const matchQ = (e.name + " " + e.role).toLowerCase().includes(q.toLowerCase());
        return matchQ && (dept === "all" || e.dept === dept) && (status === "all" || e.status === status);
      }),
    [employees, q, dept, status],
  );

  const openEdit = (e: Employee) => {
    setForm({ ...e, langs: [...e.langs] });
    setIsNew(false);
    setOpen(true);
  };

  useEffect(() => {
    if (!focusId) return;
    const emp = employees.find((e) => e.id === focusId);
    if (emp) openEdit(emp);
    onFocusDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const set = <K extends keyof Employee>(k: K, v: Employee[K]) => setForm((f) => ({ ...f, [k]: v }));

  const toggleLang = (l: string) =>
    setForm((f) => ({
      ...f,
      langs: f.langs.includes(l) ? f.langs.filter((x) => x !== l) : [...f.langs, l],
    }));

  const save = () => {
    if (!form.name.trim() || !form.role.trim()) return;
    onSave(
      { ...form, id: form.id || "e" + Date.now(), email: form.email || form.name.toLowerCase().replace(/\s+/g, ".") + "@labrasa.co" },
      isNew,
    );
    notify(isNew ? t("emp.created") : t("emp.updated"));
    setOpen(false);
  };

  const exportCsv = () => {
    downloadCSV("staffhub-plantilla.csv", [
      [t("emp.name"), t("emp.role"), t("emp.dept"), t("emp.rate"), t("emp.score"), t("emp.status"), t("emp.langs")],
      ...filtered.map((e) => [e.name, e.role, t("dept." + e.dept), e.rate, e.score, t("st." + e.status), e.langs.join("/")]),
    ]);
    notify(t("emp.exported"));
  };

  const statusTone = (s: EmpStatus) => (s === "active" ? "pine" : s === "vacation" ? "amber" : "slate") as "pine" | "amber" | "slate";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("emp.title")}</h1>
          <p className="text-[13.5px] text-mute mt-1.5">{t("emp.sub")} · <b className="text-pine-700">{employees.length}</b></p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={exportCsv}>
            <IDownload size={15} /> {t("emp.export")}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setForm(blankForm());
              setIsNew(true);
              setOpen(true);
            }}
          >
            <IPlus size={15} /> {t("emp.add")}
          </button>
        </div>
      </div>

      {/* toolbar */}
      <div className="card p-3 flex flex-wrap items-center gap-2.5 anim-fade-up" style={{ animationDelay: "0.06s" }}>
        <div className="relative flex-1 min-w-[220px]">
          <ISearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input className="input-base !pl-9" placeholder={t("emp.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input-base !w-auto cursor-pointer" value={dept} onChange={(e) => setDept(e.target.value as Dept | "all")}>
          <option value="all">{t("emp.allDepts")}</option>
          {(Object.keys(DEPT_META) as Dept[]).map((d) => (
            <option key={d} value={d}>{t("dept." + d)}</option>
          ))}
        </select>
        <select className="input-base !w-auto cursor-pointer" value={status} onChange={(e) => setStatus(e.target.value as EmpStatus | "all")}>
          <option value="all">{t("emp.allStatus")}</option>
          <option value="active">{t("st.active")}</option>
          <option value="vacation">{t("st.vacation")}</option>
          <option value="leave">{t("st.leave")}</option>
        </select>
      </div>

      {/* table */}
      <div className="card overflow-hidden anim-fade-up" style={{ animationDelay: "0.12s" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[860px]">
            <thead>
              <tr className="border-b border-line bg-pine-50/50">
                {[t("emp.employee"), t("emp.role"), t("emp.dept"), t("emp.langs"), t("emp.rate"), t("emp.score"), t("emp.status"), ""].map(
                  (h, i) => (
                    <th key={i} className="label-xs px-4 py-3 whitespace-nowrap">{h}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const dm = DEPT_META[e.dept];
                return (
                  <tr
                    key={e.id}
                    className="border-b border-line/70 last:border-0 hover:bg-pine-50/60 transition-colors anim-fade-up cursor-pointer"
                    style={{ animationDelay: `${0.14 + i * 0.03}s` }}
                    onClick={() => openEdit(e)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={e.name} size={36} />
                        <div>
                          <div className="text-[13.5px] font-semibold text-ink">{e.name}</div>
                          <div className="text-[11.5px] text-mute">{e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-inksoft whitespace-nowrap">{e.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold"
                        style={{ background: dm.bg, color: dm.fg }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dm.solid }} />
                        {t("dept." + e.dept)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {e.langs.map((l) => (
                          <span key={l} className="font-mono text-[10.5px] font-semibold text-inksoft bg-canvas border border-line rounded-md px-1.5 py-0.5">
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12.5px] font-semibold text-ink whitespace-nowrap">${e.rate}/h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-[6px] rounded-full bg-line/80 overflow-hidden">
                          <div
                            className="h-full rounded-full bar-grow"
                            style={{
                              width: `${e.score}%`,
                              background: e.score >= 85 ? "#256b52" : e.score >= 75 ? "#e89f2e" : "#ce5638",
                              animationDelay: `${0.2 + i * 0.04}s`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[11.5px] text-inksoft">{e.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={statusTone(e.status)} pulse={e.status === "active"}>{t("st." + e.status)}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="p-2 rounded-lg text-mute hover:text-pine-700 hover:bg-pine-100/70 transition-colors cursor-pointer"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openEdit(e);
                        }}
                        aria-label={t("emp.edit")}
                      >
                        <IPencil size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-mute">{t("emp.empty")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isNew ? t("emp.create") : t("emp.edit")}
        sub={isNew ? t("emp.sub") : form.email}
        width={560}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label={t("emp.name")}>
              <input className="input-base" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ana María Torres" />
            </Field>
          </div>
          <Field label={t("emp.role")}>
            <input className="input-base" value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="Sous-chef" />
          </Field>
          <Field label={t("emp.dept")}>
            <select className="input-base cursor-pointer" value={form.dept} onChange={(e) => set("dept", e.target.value as Dept)}>
              {(Object.keys(DEPT_META) as Dept[]).map((d) => (
                <option key={d} value={d}>{t("dept." + d)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("emp.email")}>
            <input className="input-base" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label={t("emp.phone")}>
            <input className="input-base" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label={t("emp.rate") + " (USD)"}>
            <input className="input-base" type="number" min={8} max={60} value={form.rate} onChange={(e) => set("rate", Number(e.target.value))} />
          </Field>
          <Field label={t("emp.hired")}>
            <input className="input-base" type="date" value={form.hired} onChange={(e) => set("hired", e.target.value)} />
          </Field>
          <Field label={t("emp.status")}>
            <select className="input-base cursor-pointer" value={form.status} onChange={(e) => set("status", e.target.value as EmpStatus)}>
              <option value="active">{t("st.active")}</option>
              <option value="vacation">{t("st.vacation")}</option>
              <option value="leave">{t("st.leave")}</option>
            </select>
          </Field>
          <div>
            <span className="label-xs block mb-1.5">{t("emp.langs")}</span>
            <div className="flex gap-1.5">
              {ALL_LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLang(l)}
                  className={`font-mono text-[12px] font-semibold px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                    form.langs.includes(l)
                      ? "bg-pine-600 text-white border-pine-700 shadow-sm"
                      : "bg-surface text-inksoft border-line hover:border-pine-400"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-ghost" onClick={() => setOpen(false)}>{t("emp.cancel")}</button>
          <button className="btn-primary" onClick={save} disabled={!form.name.trim() || !form.role.trim()}>
            {isNew ? t("emp.createBtn") : t("emp.save")}
          </button>
        </div>
      </Modal>
    </div>
  );
}

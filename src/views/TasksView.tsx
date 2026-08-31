import { useRef, useState } from "react";
import { CHECKLISTS, DEPT_META, TASKS, type Checklist, type Task } from "../data";
import { useI18n } from "../i18n";
import { ICheck, IClipboard } from "../icons";
import { Avatar, Pill, SectionHead } from "../ui";

const PRIO_TONE = { high: "clay", medium: "amber", low: "sea" } as const;
const STATUS_TONE = { todo: "slate", doing: "amber", done: "pine" } as const;
const NEXT_STATUS: Record<Task["status"], Task["status"]> = { todo: "doing", doing: "done", done: "todo" };

export default function TasksView({ notify }: { notify: (m: string) => void }) {
  const { t } = useI18n();
  const [lists, setLists] = useState<Checklist[]>(CHECKLISTS);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const toasted = useRef<Set<string>>(new Set());

  const toggle = (listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const items = l.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it));
        const all = items.every((it) => it.done);
        if (all && !toasted.current.has(listId)) {
          toasted.current.add(listId);
          notify(t("tsk.done"));
        }
        if (!all) toasted.current.delete(listId);
        return { ...l, items };
      }),
    );
  };

  const advance = (id: string) => {
    setTasks((prev) => prev.map((tk) => (tk.id === id ? { ...tk, status: NEXT_STATUS[tk.status] } : tk)));
  };

  return (
    <div className="space-y-4">
      <div className="anim-fade-up">
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("tsk.title")}</h1>
        <p className="text-[13.5px] text-mute mt-1.5">{t("tsk.sub")}</p>
      </div>

      {/* checklists */}
      <div className="anim-fade-up" style={{ animationDelay: "0.06s" }}>
        <div className="label-xs mb-2.5">{t("tsk.checklists")}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
        {lists.map((l) => {
          const done = l.items.filter((i) => i.done).length;
          const pct = Math.round((done / l.items.length) * 100);
          const complete = pct === 100;
          return (
            <div key={l.id} className={`card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${complete ? "!border-pine-400 bg-pine-50/50" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ background: DEPT_META[l.area].solid }}
                  >
                    <IClipboard size={17} />
                  </span>
                  <div>
                    <div className="font-display font-bold text-[14.5px] text-ink leading-tight">{t(l.title)}</div>
                    <div className="text-[11px] text-mute mt-0.5">
                      {t("tsk.by")} <b className="text-inksoft">{l.assignee}</b> · {t("tsk.due")} <span className="font-mono">{l.due}</span>
                    </div>
                  </div>
                </div>
                <span className={`font-mono font-bold text-[13px] ${complete ? "text-pine-600" : "text-inksoft"}`}>{pct}%</span>
              </div>

              <div className="h-[6px] rounded-full bg-line/70 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: complete ? "#256b52" : DEPT_META[l.area].solid }}
                />
              </div>

              <div className="mt-3 space-y-1">
                {l.items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => toggle(l.id, it.id)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-pine-50 transition-colors cursor-pointer group"
                  >
                    <span
                      className={`w-[18px] h-[18px] rounded-[6px] border flex items-center justify-center shrink-0 transition-all ${
                        it.done ? "bg-pine-600 border-pine-600 text-white" : "border-line bg-surface group-hover:border-pine-400"
                      }`}
                    >
                      {it.done && <ICheck size={11} sw={3} />}
                    </span>
                    <span className={`text-[12.5px] transition-all ${it.done ? "text-mute line-through" : "text-ink font-medium"}`}>
                      {t(it.label)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* assigned tasks */}
      <div className="card anim-fade-up mt-4" style={{ animationDelay: "0.14s" }}>
        <SectionHead title={t("tsk.jobs")} sub={`${tasks.filter((x) => x.status !== "done").length} ${t("tsk.st.todo").toLowerCase() + " / " + t("tsk.st.doing").toLowerCase()}`} />
        <div className="px-4 pb-4">
          {tasks.map((tk) => (
            <div key={tk.id} className="flex items-center gap-3 py-2.5 border-b border-line/60 last:border-0 hover:bg-pine-50/50 px-2 -mx-2 rounded-lg transition-colors">
              <Avatar name={tk.assignee} size={32} />
              <div className="min-w-0 flex-1">
                <div className={`text-[13px] font-semibold truncate ${tk.status === "done" ? "text-mute line-through" : "text-ink"}`}>
                  {t(tk.title)}
                </div>
                <div className="text-[11px] text-mute">
                  {tk.assignee} · {t("dept." + tk.dept)}
                </div>
              </div>
              <Pill tone={PRIO_TONE[tk.priority]}>{t("tsk." + tk.priority)}</Pill>
              <button
                onClick={() => advance(tk.id)}
                className="cursor-pointer"
                title={t("tsk.st." + NEXT_STATUS[tk.status])}
              >
                <Pill tone={STATUS_TONE[tk.status]}>{t("tsk.st." + tk.status)}</Pill>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

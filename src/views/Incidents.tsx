import { useState } from "react";
import { INCIDENTS, caseCode, type Incident, type IncStatus } from "../data";
import { useI18n } from "../i18n";
import { IAlert, ICheck, ILock, IShield } from "../icons";
import { Pill, SectionHead } from "../ui";

const STATUS_TONE: Record<IncStatus, "slate" | "amber" | "pine"> = {
  received: "slate",
  review: "amber",
  resolved: "pine",
};

const CATS = ["inc.cat.safety", "inc.cat.conduct", "inc.cat.equipment"];

export default function Incidents({ notify }: { notify: (m: string) => void }) {
  const { t } = useI18n();
  const [cases, setCases] = useState<Incident[]>(INCIDENTS);
  const [cat, setCat] = useState(CATS[0]);
  const [desc, setDesc] = useState("");
  const [anon, setAnon] = useState(true);
  const [error, setError] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const submit = () => {
    if (desc.trim().length < 20) {
      setError(true);
      setTimeout(() => setError(false), 700);
      return;
    }
    const code = caseCode();
    const c: Incident = {
      id: "i" + Date.now(),
      code,
      category: cat,
      date: "2025-01-23",
      status: "received",
      summary: desc.trim(),
    };
    setCases((prev) => [c, ...prev]);
    setSent(code);
    setDesc("");
    notify(t("inc.submitted"));
  };

  return (
    <div className="space-y-4">
      <div className="anim-fade-up">
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("inc.title")}</h1>
        <p className="text-[13.5px] text-mute mt-1.5 flex items-center gap-2">
          {t("inc.sub")}
          <Pill tone="pine"><ILock size={11} /> E2E</Pill>
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
        {/* form */}
        <div className="space-y-4">
          <div className="card sidebar-bg text-white p-5 overflow-hidden relative anim-fade-up" style={{ animationDelay: "0.06s" }}>
            <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-marigold-400/10" />
            <span className="w-11 h-11 rounded-2xl bg-marigold-400 text-pine-950 flex items-center justify-center">
              <IShield size={22} />
            </span>
            <h3 className="font-display font-bold text-[17px] mt-3.5">{t("inc.new")}</h3>
            <p className="text-[12px] text-pine-200/75 mt-1">{t("inc.newSub")}</p>
          </div>

          <div className="card p-5 space-y-4 anim-fade-up" style={{ animationDelay: "0.1s" }}>
            <div>
              <span className="label-xs block mb-1.5">{t("inc.category")}</span>
              <select className="input-base cursor-pointer" value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATS.map((c) => (
                  <option key={c} value={c}>{t(c)}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="label-xs block mb-1.5">{t("inc.desc")}</span>
              <textarea
                className={`input-base min-h-[120px] resize-y ${error ? "anim-shake !border-clay-500" : ""}`}
                placeholder={t("inc.placeholder")}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              {error && (
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-clay-600 mt-1.5">
                  <IAlert size={13} /> {t("inc.needDesc")}
                </p>
              )}
              <p className="text-[11px] text-mute mt-1 font-mono">{desc.trim().length}/20</p>
            </div>

            <button
              onClick={() => setAnon((a) => !a)}
              className="w-full flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-left hover:border-pine-400 transition-colors cursor-pointer"
            >
              <span
                className={`w-9 h-5 rounded-full p-[2px] transition-all shrink-0 ${anon ? "bg-pine-600" : "bg-line"}`}
              >
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-all ${anon ? "translate-x-4" : ""}`} />
              </span>
              <div>
                <div className="text-[12.5px] font-semibold text-ink">{t("inc.anon")}</div>
                <div className="text-[11px] text-mute">{t("inc.anonNote")}</div>
              </div>
            </button>

            <button className="btn-primary w-full" onClick={submit}>
              <IShield size={15} /> {t("inc.submit")}
            </button>

            {sent && (
              <div className="rounded-xl border border-pine-400 bg-pine-50 p-3.5 anim-pop">
                <div className="flex items-center gap-2 text-[12px] font-bold text-pine-700">
                  <ICheck size={14} sw={2.4} /> {t("inc.submitted")}
                </div>
                <div className="mt-2">
                  <div className="label-xs !text-pine-600 mb-1">{t("inc.code")}</div>
                  <div className="font-mono font-bold text-[19px] tracking-wider text-ink">{sent}</div>
                  <p className="text-[11px] text-pine-700/80 mt-1.5 leading-snug">{t("inc.track")}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* cases */}
        <div className="card self-start anim-fade-up" style={{ animationDelay: "0.14s" }}>
          <SectionHead title={t("inc.cases")} sub={`${cases.length} · ${t("inc.newSub").toLowerCase()}`} />
          <div className="px-4 pb-4 space-y-2.5">
            {cases.map((c, i) => (
              <div key={c.id} className={`rounded-xl border border-line p-4 hover:border-pine-400/60 transition-colors ${i === 0 ? "anim-slide-in bg-pine-50/50" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-[12.5px] text-pine-700 bg-pine-50 border border-pine-200 rounded-md px-2 py-0.5">
                    {c.code}
                  </span>
                  <Pill tone="slate">{t(c.category)}</Pill>
                  <span className="ml-auto font-mono text-[11px] text-mute">{c.date}</span>
                  <Pill tone={STATUS_TONE[c.status]}>{t("inc.st." + c.status)}</Pill>
                </div>
                <p className="text-[13px] text-ink leading-relaxed mt-2.5">{c.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

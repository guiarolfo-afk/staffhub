import { useEffect, useState } from "react";
import { LESSONS } from "../data";
import { useI18n } from "../i18n";
import { ICamera, ICheck, IFile, IFolder, IGlobe, ILayers, IVideo, IX, IZap } from "../icons";
import { Pill } from "../ui";
import { KioskScreen } from "./DevicePreviews";

/* ---------- helpers ---------- */

function StatusPill({ live }: { live: boolean }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-[2px] text-[9.5px] font-bold uppercase tracking-wide shrink-0 ${
        live ? "bg-pine-100 text-pine-700" : "bg-slate2-100 text-slate2-500"
      }`}
    >
      {live && <ICheck size={8} sw={3} />}
      {live ? t("eco.demo") : t("eco.spec")}
    </span>
  );
}

function ScreenList({ keys, live }: { keys: string[]; live: number[] }) {
  const { t } = useI18n();
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
      {keys.map((k, i) => (
        <li key={k} className="flex items-center gap-2 text-[12px] text-inksoft hover:text-ink transition-colors group">
          <span className="font-mono text-[10px] text-mute w-4 shrink-0">{String(i + 1).padStart(2, "0")}</span>
          <span className="truncate group-hover:translate-x-0.5 transition-transform">{t(k)}</span>
          <span className="ml-auto">
            <StatusPill live={live.includes(i)} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function AppCard({
  index,
  title,
  sub,
  tag,
  tagTone,
  children,
  list,
  delay,
  stacked = false,
}: {
  index: string;
  title: string;
  sub: string;
  tag: string;
  tagTone: "pine" | "amber" | "sea" | "slate";
  children: React.ReactNode;
  list: React.ReactNode;
  delay: string;
  stacked?: boolean;
}) {
  return (
    <div className="card overflow-hidden anim-fade-up hover:shadow-lg transition-shadow" style={{ animationDelay: delay }}>
      <div className="px-5 pt-4 pb-3 flex items-start gap-3 border-b border-line/70 bg-canvas/40">
        <span className="font-display font-extrabold text-[30px] leading-none text-line select-none">{index}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-[17px] text-ink leading-tight">{title}</h3>
          <p className="text-[11.5px] text-mute mt-0.5">{sub}</p>
        </div>
        <Pill tone={tagTone}>{tag}</Pill>
      </div>
      <div className={`grid grid-cols-1 gap-4 p-5 items-center ${stacked ? "md:grid-cols-[minmax(0,440px)_1fr]" : "md:grid-cols-[240px_1fr]"}`}>
        <div className="flex justify-center md:justify-start min-w-0">{children}</div>
        <div className="min-w-0">{list}</div>
      </div>
    </div>
  );
}

/* ---------- phone mockup with auto-cycling screens ---------- */

function EmployeePhone() {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % 3), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="w-[150px] rounded-[26px] border-[7px] border-pine-950 bg-pine-950 shadow-xl overflow-hidden">
        <div className="h-5 bg-pine-950 flex items-center justify-center">
          <div className="w-14 h-2.5 bg-black rounded-full" />
        </div>
        <div className="bg-canvas h-[264px] relative overflow-hidden">
          {/* screen 0: home */}
          <div key={idx} className="absolute inset-0 anim-pop p-2.5 space-y-2">
            {idx === 0 && (
              <>
                <div className="sidebar-bg rounded-xl p-2.5 text-white">
                  <div className="text-[8px] text-pine-200/70">{t("dev.hello")}, Lucía</div>
                  <div className="font-mono text-[13px] font-bold text-marigold-300 mt-0.5">14:32:07</div>
                  <div className="mt-1.5 bg-pine-500 rounded-lg py-1.5 text-center text-[8px] font-bold flex items-center justify-center gap-1">
                    <ICamera size={9} /> {t("dev.clockIn")}
                  </div>
                </div>
                {[0, 1].map((i) => (
                  <div key={i} className="card !rounded-lg p-2 flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-md ${i ? "bg-marigold-200" : "bg-pine-100"}`} />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 rounded bg-line w-3/4" />
                      <div className="h-1.5 rounded bg-line/60 w-1/2" />
                    </div>
                  </div>
                ))}
              </>
            )}
            {idx === 1 && (
              <>
                <div className="text-[8.5px] font-bold text-ink px-0.5">{t("nav.schedule")}</div>
                <div className="grid grid-cols-7 gap-1">
                  {[3, 5, 0, 4, 6, 2, 0].map((h, i) => (
                    <div key={i} className="space-y-1">
                      <div className="h-1 rounded bg-line/70" />
                      <div className="rounded bg-pine-500/80" style={{ height: h * 7 + 8 }} />
                    </div>
                  ))}
                </div>
                <div className="card !rounded-lg p-2 mt-1">
                  <div className="flex justify-between">
                    <div className="h-1.5 w-12 rounded bg-line" />
                    <div className="font-mono text-[7px] text-pine-700 font-bold">38h</div>
                  </div>
                  <div className="h-1.5 rounded-full bg-line/60 mt-1.5 overflow-hidden">
                    <div className="h-full w-[76%] bg-pine-500 bar-grow" />
                  </div>
                </div>
              </>
            )}
            {idx === 2 && (
              <div className="relative rounded-xl overflow-hidden h-[228px]">
                <img src={LESSONS[0].cover} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-pine-950/80 to-transparent" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white">
                    <IVideo size={13} />
                  </span>
                </span>
                <div className="absolute bottom-1.5 left-2 right-2">
                  <div className="h-1.5 w-20 rounded bg-white/50" />
                  <div className="flex items-end gap-[2px] h-3 mt-1.5">
                    <span className="eq-bar h-3" />
                    <span className="eq-bar h-3" />
                    <span className="eq-bar h-3" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${i === idx ? "w-5 bg-pine-600" : "w-1.5 bg-line hover:bg-mute"}`}
            aria-label={"screen " + i}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- browser mockup (web portal) ---------- */

function WebPortal() {
  const { t } = useI18n();
  const [sets, setSets] = useState({ push: true, email: true, sms: false });
  const bars = [42, 68, 55, 80, 62, 90, 74];
  return (
    <div className="w-full max-w-[230px]">
      <div className="rounded-t-xl bg-pine-100 border border-b-0 border-line px-3 py-2 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-clay-500" />
        <span className="w-2 h-2 rounded-full bg-marigold-400" />
        <span className="w-2 h-2 rounded-full bg-pine-500" />
        <span className="ml-2 flex-1 bg-white border border-line rounded-md px-2 py-0.5 font-mono text-[8.5px] text-mute truncate">
          app.staffhub.co/admin
        </span>
      </div>
      <div className="rounded-b-xl border border-line bg-white p-2.5 space-y-2 shadow-sm">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { v: "94%", c: "#256b52" },
            { v: "23", c: "#e89f2e" },
            { v: "$4.1k", c: "#2e7d8c" },
          ].map((k) => (
            <div key={k.v} className="rounded-lg bg-canvas border border-line/70 px-1.5 py-1.5">
              <div className="font-mono text-[10px] font-bold" style={{ color: k.c }}>{k.v}</div>
              <div className="h-1 w-6 rounded bg-line mt-1" />
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-12 px-1">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-pine-500/85 hover:bg-marigold-400 transition-colors" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="border-t border-line pt-1.5 space-y-1">
          <div className="text-[8px] font-bold uppercase tracking-wider text-mute">{t("eco.webSettings")}</div>
          {(
            [
              ["push", t("eco.setNotifPush")],
              ["email", t("eco.setNotifEmail")],
              ["sms", t("eco.setNotifSms")],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSets((s) => ({ ...s, [k]: !s[k] }))}
              className="w-full flex items-center gap-1.5 text-[9px] font-semibold text-inksoft hover:text-ink cursor-pointer"
            >
              <span className={`w-6 h-3.5 rounded-full p-[2px] transition-all ${sets[k] ? "bg-pine-600" : "bg-line"}`}>
                <span className={`block w-2.5 h-2.5 rounded-full bg-white shadow transition-all ${sets[k] ? "translate-x-2.5" : ""}`} />
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- manager swipe deck ---------- */

const DECK = [
  { who: "Rafael Ortega", conceptKey: "exp.concept.uber", amount: 184.5, cat: "transport", color: "#54688c" },
  { who: "Carla Mendes", conceptKey: "exp.concept.cristal", amount: 642.0, cat: "supplies", color: "#2e7d8c" },
  { who: "Andrés Quispe", conceptKey: "exp.concept.menu", amount: 356.0, cat: "food", color: "#e89f2e" },
  { who: "Fernanda Costa", conceptKey: "exp.concept.uniform", amount: 511.2, cat: "uniform", color: "#7b5ea7" },
];

function ManagerSwipe({ notify }: { notify: (m: string) => void }) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  const [flying, setFlying] = useState<"l" | "r" | null>(null);
  const [tally, setTally] = useState({ ok: 0, no: 0 });

  const act = (dir: "l" | "r") => {
    if (flying || idx >= DECK.length) return;
    setFlying(dir);
    setTally((tl) => (dir === "r" ? { ...tl, ok: tl.ok + 1 } : { ...tl, no: tl.no + 1 }));
    notify(dir === "r" ? t("exp.approved") : t("exp.rejected"));
    setTimeout(() => {
      setIdx((i) => i + 1);
      setFlying(null);
    }, 380);
  };

  const card = DECK[idx];

  return (
    <div className="w-full max-w-[230px]">
      <div className="flex items-center justify-between mb-2">
        <span className="label-xs !text-mute">{t("eco.swipe")}</span>
        <span className="font-mono text-[10px] text-mute">
          <b className="text-pine-700">{tally.ok}✓</b> · <b className="text-clay-600">{tally.no}✗</b>
        </span>
      </div>
      <div className="relative h-[168px]">
        {idx < DECK.length ? (
          <>
            {idx + 1 < DECK.length && (
              <div className="absolute inset-0 card scale-[0.94] translate-y-2 opacity-50" style={{ borderTop: `3px solid ${DECK[idx + 1].color}` }} />
            )}
            <div key={idx} className={`absolute inset-0 card p-3.5 anim-pop ${flying === "r" ? "anim-fly-r" : flying === "l" ? "anim-fly-l" : ""}`} style={{ borderTop: `3px solid ${card.color}` }}>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: card.color }}>
                  {card.who.split(" ").map((w) => w[0]).join("")}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-ink truncate">{card.who}</div>
                  <div className="text-[9px] text-mute">{t("exp.cat." + card.cat)}</div>
                </div>
                <span className="ml-auto font-mono text-[8px] font-bold bg-pine-50 text-pine-700 rounded px-1.5 py-0.5">OCR 94%</span>
              </div>
              <div className="text-[11.5px] text-inksoft mt-2.5 leading-snug">{t(card.conceptKey)}</div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-mono font-extrabold text-[19px] text-ink">${card.amount.toFixed(2)}</span>
                <span className="font-mono text-[9px] text-mute">MXN · {t("venue")}</span>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button onClick={() => act("l")} className="w-9 h-9 rounded-full bg-white border-2 border-clay-500 text-clay-500 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer" aria-label="reject">
                  <IX size={16} sw={2.4} />
                </button>
                <button onClick={() => act("r")} className="w-9 h-9 rounded-full bg-pine-600 border-2 border-pine-700 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer" aria-label="approve">
                  <ICheck size={16} sw={2.4} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 card flex flex-col items-center justify-center text-center p-4">
            <span className="w-10 h-10 rounded-full bg-pine-100 text-pine-700 flex items-center justify-center">
              <ICheck size={19} sw={2.4} />
            </span>
            <p className="text-[11.5px] font-semibold text-ink mt-2.5">{t("eco.swipeDone")}</p>
            <button onClick={() => { setIdx(0); setTally({ ok: 0, no: 0 }); }} className="btn-ghost !py-1.5 !px-3 !text-[11px] mt-3">
              {t("eco.swipeReset")}
            </button>
          </div>
        )}
      </div>
      <p className="text-[9.5px] text-mute mt-6 text-center">{t("eco.swipeHint")}</p>
    </div>
  );
}

/* ---------- i18n section ---------- */

const LOCALE_FILES = ["common.json", "auth.json", "scheduling.json", "tasks.json", "expenses.json", "chat.json", "training.json"];

function I18nPanel() {
  const { t, lang } = useI18n();
  const [vals, setVals] = useState({
    es: "Turno de apertura",
    pt: "Turno de abertura",
    en: "Opening shift",
  });
  const detected = (typeof navigator !== "undefined" ? navigator.language : "es-MX").slice(0, 2);
  const detectedLabel = detected === "pt" ? "Português" : detected === "en" ? "English" : "Español";

  return (
    <div className="card overflow-hidden anim-fade-up" style={{ animationDelay: "0.3s" }}>
      <div className="px-5 pt-4 pb-3 border-b border-line bg-canvas/40 flex flex-wrap items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-pine-600 text-white flex items-center justify-center">
          <IGlobe size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-[17px] text-ink">{t("eco.i18nTitle")}</h3>
          <p className="text-[11.5px] text-mute">{t("eco.i18nSub")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill tone="sea">navigator.language: {detected} → {detectedLabel}</Pill>
          <Pill tone="amber">{t("eco.i18nDefault")}</Pill>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_1fr] gap-5 p-5">
        {/* locales tree */}
        <div className="rounded-xl border border-pine-800 bg-[#0a120e] p-3.5 font-mono text-[11px] leading-[19px] text-pine-200/85 overflow-x-auto">
          <div className="text-marigold-300 font-bold flex items-center gap-1.5"><IFolder size={12} /> locales/</div>
          {(["es", "pt", "en"] as const).map((l, li) => (
            <div key={l}>
              <div className={`flex items-center gap-1.5 ${l === lang ? "text-marigold-300" : ""}`}>
                <span className="text-[#3d5247]">{li === 2 ? "└──" : "├──"}</span>
                <IFolder size={11} /> {l}/
              </div>
              {LOCALE_FILES.map((f, fi) => (
                <div key={f} className={`flex items-center gap-1.5 ${l === lang ? "text-pine-100" : "text-pine-200/50"}`}>
                  <span className="text-[#3d5247]">{li === 2 ? "    " : "│   "}{fi === LOCALE_FILES.length - 1 ? "└──" : "├──"}</span>
                  <IFile size={10} /> {f}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* editor */}
        <div className="space-y-2.5">
          <div className="label-xs">{t("eco.i18nJson")}</div>
          {(
            [
              ["es", "Español", "#256b52"],
              ["pt", "Português", "#2e7d8c"],
              ["en", "English", "#e89f2e"],
            ] as const
          ).map(([k, label, color]) => (
            <label key={k} className="block">
              <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider mb-1" style={{ color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} /> {label}
              </span>
              <input className="input-base !py-2 !text-[13px]" value={vals[k]} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} />
            </label>
          ))}
        </div>

        {/* live JSON */}
        <div className="flex flex-col">
          <div className="label-xs mb-2.5">Task.title → Prisma <span className="font-mono">Json</span></div>
          <pre className="flex-1 rounded-xl border border-pine-800 bg-[#0a120e] p-4 font-mono text-[12px] leading-[21px] overflow-x-auto">
            <code>
              <span className="text-pine-200/50">{"{"}</span>{"\n"}
              <span className="text-[#7fd6b2]">{'  "es"'}</span><span className="text-pine-200/50">{": "}</span><span className="text-[#f0c987]">"{vals.es}"</span><span className="text-pine-200/50">,</span>{"\n"}
              <span className="text-[#7fd6b2]">{'  "pt"'}</span><span className="text-pine-200/50">{": "}</span><span className="text-[#f0c987]">"{vals.pt}"</span><span className="text-pine-200/50">,</span>{"\n"}
              <span className="text-[#7fd6b2]">{'  "en"'}</span><span className="text-pine-200/50">{": "}</span><span className="text-[#f0c987]">"{vals.en}"</span>{"\n"}
              <span className="text-pine-200/50">{"}"}</span>
            </code>
          </pre>
          <p className="text-[11px] text-mute mt-2.5 flex items-center gap-1.5">
            <IZap size={12} className="text-marigold-500" /> {t("eco.i18nBackend")}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- main view ---------- */

export default function Ecosystem({ notify }: { notify: (m: string) => void }) {
  const { t } = useI18n();

  const app1 = ["eco.s1", "eco.s2", "eco.s3", "eco.s4", "eco.s5", "eco.s6", "eco.s7", "eco.s8", "eco.s9", "eco.s10", "eco.s11", "eco.s12"];
  const app1Live = [0, 1, 2, 3, 6, 11];
  const app3 = ["eco.w1", "eco.w2", "eco.w3", "eco.w4", "eco.w5", "eco.w6", "eco.w7", "eco.w8", "eco.w9", "eco.w10"];
  const app3Live = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const app4 = ["eco.m1", "eco.m2", "eco.m3", "eco.m4", "eco.m5", "eco.m6", "eco.m7"];
  const app4Live = [0, 1, 4];

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <p className="label-xs mb-1.5 flex items-center gap-2">
            <ILayers size={13} className="text-marigold-500" /> StaffHub 360
          </p>
          <h1 className="font-display font-extrabold text-[30px] md:text-[36px] tracking-tight text-ink leading-none">
            {t("eco.title")}
          </h1>
          <p className="text-[13.5px] text-mute mt-2 max-w-xl">{t("eco.sub")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill tone="pine" pulse>1 REST + GraphQL API</Pill>
          <Pill tone="amber">29 {t("eco.screens")}</Pill>
          <Pill tone="sea">3 {t("eco.langsShort")}</Pill>
        </div>
      </div>

      {/* apps grid */}
      <div className="space-y-4">
        <AppCard index="01" title={t("eco.app1")} sub={t("eco.app1d")} tag="React Native · Expo" tagTone="pine" delay="0.08s" list={<ScreenList keys={app1} live={app1Live} />}>
          <EmployeePhone />
        </AppCard>

        <AppCard index="02" title={t("eco.app2")} sub={t("eco.app2d")} tag="Android · Lock Task" tagTone="amber" delay="0.14s" stacked list={
          <div className="space-y-2">
            <ScreenList keys={["eco.k1", "eco.k2", "eco.k3"]} live={[0, 1, 2]} />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Pill tone="pine"><ICamera size={11} /> {t("eco.kioskCam")}</Pill>
              <Pill tone="amber">{t("eco.kioskFingerTab")} USB/BLE</Pill>
              <Pill tone="slate">{t("eco.kioskPinTab")} fallback</Pill>
            </div>
          </div>
        }>
          <div className="w-full rounded-xl border-[6px] border-pine-950 overflow-hidden shadow-lg">
            <KioskScreen compact />
          </div>
        </AppCard>

        <AppCard index="03" title={t("eco.app3")} sub={t("eco.app3d")} tag="Next.js 14" tagTone="sea" delay="0.2s" list={<ScreenList keys={app3} live={app3Live} />}>
          <WebPortal />
        </AppCard>

        <AppCard index="04" title={t("eco.app4")} sub={t("eco.app4d")} tag="RN · PWA" tagTone="slate" delay="0.26s" list={<ScreenList keys={app4} live={app4Live} />}>
          <ManagerSwipe notify={notify} />
        </AppCard>
      </div>

      <I18nPanel />
    </div>
  );
}

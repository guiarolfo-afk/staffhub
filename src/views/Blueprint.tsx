import { useState } from "react";
import { PERM_GROUPS, PERMS, ROLE_COLOR, ROLE_ORDER, permCount, type Role } from "../rbac";
import { useI18n } from "../i18n";
import { ICheck, IFolder, IFile, IX, IZap, IDatabase, IGrid } from "../icons";
import { Pill, SectionHead } from "../ui";

/* ---------- roadmap ---------- */
const PHASES = [
  { key: "ph1", from: 1, to: 3, status: "done" as const, items: 6 },
  { key: "ph2", from: 4, to: 6, status: "done" as const, items: 5 },
  { key: "ph3", from: 7, to: 9, status: "progress" as const, items: 5 },
  { key: "ph4", from: 10, to: 12, status: "planned" as const, items: 5 },
  { key: "ph5", from: 13, to: 14, status: "planned" as const, items: 5 },
];
const TOTAL_WEEKS = 14;
const TODAY_WEEK = 8;
const STATUS_COLOR = { done: "#256b52", progress: "#e89f2e", planned: "#93a297" } as const;

/* ---------- monorepo ---------- */
const TREE: { name: string; depth: number; folder?: boolean; note?: string }[] = [
  { name: "staffhub-360/", depth: 0, folder: true },
  { name: "apps/", depth: 1, folder: true },
  { name: "api/", depth: 2, folder: true, note: "NestJS · REST + GraphQL" },
  { name: "web-admin/", depth: 2, folder: true, note: "Next.js 14" },
  { name: "mobile/", depth: 2, folder: true, note: "Expo · empleado + gerente" },
  { name: "tablet/", depth: 2, folder: true, note: "Expo · kiosk" },
  { name: "packages/", depth: 1, folder: true },
  { name: "shared/", depth: 2, folder: true, note: "tipos + utils TS" },
  { name: "i18n/", depth: 2, folder: true, note: "locales es · pt · en" },
  { name: "docker-compose.yml", depth: 1 },
  { name: "turbo.json", depth: 1 },
  { name: "package.json", depth: 1, note: "workspaces" },
];

const SERVICES = [
  { name: "postgres", image: "postgres:16-alpine", port: "5432", icon: IDatabase, color: "#2e7d8c" },
  { name: "redis", image: "redis:7-alpine", port: "6379", icon: IZap, color: "#ce5638" },
  { name: "minio", image: "minio/minio", port: "9000", icon: IFolder, color: "#e89f2e" },
  { name: "api", image: "apps/api · dev", port: "3000", icon: IGrid, color: "#256b52" },
];

export default function Blueprint({ role, onSimulate }: { role: Role; onSimulate: (r: Role) => void }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState("ph3");
  const active = PHASES.find((p) => p.key === phase)!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("rb.title")}</h1>
          <p className="text-[13.5px] text-mute mt-1.5">{t("rb.sub")}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {ROLE_ORDER.map((r) => (
            <button
              key={r}
              onClick={() => onSimulate(r)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-all cursor-pointer ${
                role === r ? "text-white border-transparent shadow-sm" : "bg-surface border-line text-inksoft hover:border-pine-400"
              }`}
              style={role === r ? { background: ROLE_COLOR[r] } : undefined}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: role === r ? "#fff" : ROLE_COLOR[r] }} />
              {t("role." + r)}
              <span className={`font-mono ${role === r ? "opacity-80" : "text-mute"}`}>{permCount(r)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4 items-start">
        {/* ================= matrix ================= */}
        <div className="card anim-fade-up" style={{ animationDelay: "0.07s" }}>
          <SectionHead title={t("rb.matrix")} sub={t("rb.matrixSub")} />
          <div className="px-4 pb-4 overflow-x-auto">
            <div className="min-w-[520px]">
              {/* header row */}
              <div className="grid grid-cols-[1fr_repeat(4,64px)] gap-1 items-end pb-2 border-b border-line">
                <span className="label-xs">{t("rb.matrix")}</span>
                {ROLE_ORDER.map((r) => (
                  <button
                    key={r}
                    onClick={() => onSimulate(r)}
                    title={t("role." + r)}
                    className={`flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      role === r ? "bg-pine-50 ring-1 ring-pine-300" : "hover:bg-pine-50/60"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold" style={{ background: ROLE_COLOR[r] }}>
                      {t("role." + r).slice(0, 2).toUpperCase()}
                    </span>
                    <span className={`text-[9.5px] font-bold leading-tight text-center ${role === r ? "text-pine-700" : "text-mute"}`}>
                      {t("role." + r)}
                    </span>
                  </button>
                ))}
              </div>

              {PERM_GROUPS.map((g) => (
                <div key={g}>
                  <div className="label-xs !text-pine-600 py-2">{t(g)}</div>
                  {PERMS.filter((p) => p.group === g).map((p, i) => (
                    <div
                      key={p.key}
                      className="grid grid-cols-[1fr_repeat(4,64px)] gap-1 items-center py-[7px] border-b border-line/50 last:border-0 hover:bg-pine-50/50 px-1 -mx-1 rounded-md transition-colors anim-fade-up"
                      style={{ animationDelay: `${0.08 + i * 0.02}s` }}
                    >
                      <span className="text-[12.5px] font-medium text-ink">{t(p.key)}</span>
                      {ROLE_ORDER.map((r) => {
                        const ok = p.roles.includes(r);
                        return (
                          <span key={r} className="flex justify-center">
                            {ok ? (
                              <span className="w-5 h-5 rounded-full bg-pine-50 text-pine-600 flex items-center justify-center">
                                <ICheck size={11} sw={2.8} />
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-clay-100/60 text-clay-500/70 flex items-center justify-center">
                                <IX size={10} sw={2.4} />
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}

              {/* totals */}
              <div className="grid grid-cols-[1fr_repeat(4,64px)] gap-1 items-center pt-3 mt-1 border-t border-line">
                <span className="text-[12px] font-bold text-ink">{t("rb.mods")}</span>
                {ROLE_ORDER.map((r) => (
                  <span key={r} className="flex justify-center">
                    <span className="font-mono font-bold text-[13px] px-2 py-0.5 rounded-md" style={{ color: ROLE_COLOR[r], background: ROLE_COLOR[r] + "18" }}>
                      {permCount(r)}/20
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* ================= roadmap ================= */}
          <div className="card anim-fade-up" style={{ animationDelay: "0.12s" }}>
            <SectionHead
              title={t("rb.roadmap")}
              sub={t("rb.roadmapSub")}
              right={<Pill tone="amber" pulse>{t("rb.todayMark")}</Pill>}
            />
            <div className="px-5 pb-2">
              {/* week ruler */}
              <div className="grid mb-1" style={{ gridTemplateColumns: "128px 1fr" }}>
                <span />
                <div className="flex justify-between px-0.5">
                  {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
                    <span key={i} className={`font-mono text-[9px] ${i + 1 === TODAY_WEEK ? "font-bold text-marigold-600" : "text-mute/70"}`}>
                      {t("rb.week")}{i + 1}
                    </span>
                  ))}
                </div>
              </div>

              {PHASES.map((p) => {
                const isSel = phase === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => setPhase(p.key)}
                    className="w-full grid items-center mb-1.5 cursor-pointer group"
                    style={{ gridTemplateColumns: "128px 1fr" }}
                  >
                    <div className={`text-left pr-2 transition-colors ${isSel ? "text-ink" : "text-inksoft group-hover:text-ink"}`}>
                      <div className={`text-[11.5px] font-bold leading-tight ${isSel ? "text-pine-700" : ""}`}>{t("rb." + p.key)}</div>
                      <div className="text-[9.5px] text-mute leading-tight mt-0.5">{t("rb." + p.key + "d")}</div>
                    </div>
                    <div className="relative h-7 rounded-lg bg-canvas border border-line/70 overflow-hidden">
                      <div
                        className={`absolute top-[5px] bottom-[5px] rounded-md flex items-center justify-end pr-1.5 transition-all ${
                          isSel ? "ring-2 ring-offset-1 ring-marigold-500/60" : "group-hover:brightness-110"
                        }`}
                        style={{
                          left: `${((p.from - 1) / TOTAL_WEEKS) * 100}%`,
                          width: `${((p.to - p.from + 1) / TOTAL_WEEKS) * 100}%`,
                          background: STATUS_COLOR[p.status],
                        }}
                      >
                        <span className="font-mono text-[9px] font-bold text-white/90">
                          {p.from}–{p.to}
                        </span>
                      </div>
                      {/* today marker */}
                      <span
                        className="absolute top-0 bottom-0 w-[2px] bg-marigold-500"
                        style={{ left: `${((TODAY_WEEK - 0.5) / TOTAL_WEEKS) * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}

              <div className="flex items-center gap-3.5 pt-1 pb-2">
                {(["done", "progress", "planned"] as const).map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-[10.5px] font-semibold text-inksoft">
                    <span className="w-2.5 h-2.5 rounded-[4px]" style={{ background: STATUS_COLOR[s] }} />
                    {t("rb." + s)}
                  </span>
                ))}
              </div>
            </div>

            {/* deliverables of selected phase */}
            <div className="border-t border-line bg-pine-50/40 px-5 py-4 rounded-b-[14px]">
              <div className="label-xs mb-2.5">
                {t("rb.deliverables")} · <b className="text-pine-700">{t("rb." + active.key)}</b>
              </div>
              <div className="flex flex-wrap gap-1.5 stagger" key={active.key}>
                {Array.from({ length: active.items }, (_, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink shadow-sm"
                  >
                    <span className="w-4 h-4 rounded-full bg-pine-50 text-pine-600 flex items-center justify-center shrink-0">
                      <ICheck size={9} sw={3} />
                    </span>
                    {t(`rb.${active.key}.i${i + 1}`)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ================= monorepo ================= */}
          <div className="card anim-fade-up" style={{ animationDelay: "0.17s" }}>
            <SectionHead title={t("rb.mono")} sub={t("rb.monoSub")} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-4">
              <div className="rounded-xl bg-[#0a120e] border border-pine-800 p-3.5 font-mono text-[11.5px] leading-[1.9] overflow-x-auto">
                {TREE.map((n, i) => (
                  <div key={i} className="flex items-center gap-1.5 whitespace-nowrap" style={{ paddingLeft: n.depth * 14 }}>
                    {n.folder ? (
                      <IFolder size={11} className={n.depth === 0 ? "text-marigold-300" : "text-pine-400"} />
                    ) : (
                      <IFile size={11} className="text-pine-200/50" />
                    )}
                    <span className={n.depth === 0 ? "text-marigold-300 font-bold" : n.folder ? "text-white font-semibold" : "text-pine-100/75"}>
                      {n.name}
                    </span>
                    {n.note && <span className="text-pine-200/40">— {n.note}</span>}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="label-xs">{t("rb.services")}</div>
                {SERVICES.map((s, i) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 hover:border-pine-400/60 transition-colors anim-fade-up"
                    style={{ animationDelay: `${0.2 + i * 0.05}s` }}
                  >
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: s.color }}>
                      <s.icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-bold text-ink font-mono">{s.name}</div>
                      <div className="text-[10.5px] text-mute font-mono truncate">{s.image}</div>
                    </div>
                    <span className="font-mono text-[10.5px] text-inksoft bg-canvas border border-line rounded-md px-1.5 py-0.5">:{s.port}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-pine-600 uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-pine-500 blink" /> {t("rb.up")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

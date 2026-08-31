import { useEffect, useMemo, useRef, useState } from "react";
import { DOCS, type Doc, type SignStatus } from "../data";
import { useI18n } from "../i18n";
import { IAlert, ISign } from "../icons";
import { Avatar, Modal, Pill, SectionHead } from "../ui";

const REF_TODAY = new Date("2025-01-23");
const STATUS_TONE: Record<SignStatus, "pine" | "amber" | "slate"> = { signed: "pine", pending: "amber", draft: "slate" };

function SignaturePad({ hasInk, setHasInk }: { hasInk: boolean; setHasInk: (v: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = 130;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#131f19";
    }
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-xl border-2 border-dashed bg-canvas/60 touch-none cursor-crosshair ${hasInk ? "border-pine-400" : "border-line"}`}
      style={{ height: 130 }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        drawing.current = true;
        last.current = pos(e);
      }}
      onPointerMove={(e) => {
        if (!drawing.current || !last.current) return;
        const ctx = canvasRef.current!.getContext("2d")!;
        const p = pos(e);
        ctx.beginPath();
        ctx.moveTo(last.current.x, last.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        last.current = p;
        if (!hasInk) setHasInk(true);
      }}
      onPointerUp={() => {
        drawing.current = false;
        last.current = null;
      }}
    />
  );
}

export default function Documents({ notify }: { notify: (m: string) => void }) {
  const { t } = useI18n();
  const [docs, setDocs] = useState<Doc[]>(DOCS);
  const [signing, setSigning] = useState<Doc | null>(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    if (signing) setHasInk(false);
  }, [signing]);

  const empName = (id: string) => {
    const names: Record<string, string> = { e7: "Andrés Quispe", e5: "Carla Mendes", e3: "Fernanda Costa", e2: "João Silva" };
    return names[id];
  };

  const expiring = useMemo(
    () =>
      docs
        .filter((d) => d.expires)
        .map((d) => ({ d, days: Math.round((new Date(d.expires!).getTime() - REF_TODAY.getTime()) / 86400000) }))
        .sort((a, b) => a.days - b.days),
    [docs],
  );

  const clearPad = () => {
    const c = document.querySelector("canvas");
    if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const confirmSign = () => {
    if (!signing || !hasInk) return;
    setDocs((prev) => prev.map((d) => (d.id === signing.id ? { ...d, sign: "signed" as SignStatus } : d)));
    notify(t("doc.signed"));
    setSigning(null);
  };

  return (
    <div className="space-y-4">
      <div className="anim-fade-up">
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("doc.title")}</h1>
        <p className="text-[13.5px] text-mute mt-1.5">{t("doc.sub")}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        {/* table */}
        <div className="card anim-fade-up" style={{ animationDelay: "0.08s" }}>
          <SectionHead title={`${t("doc.title")} · ${docs.length}`} sub={docs.filter((d) => d.sign === "pending").length + " " + t("doc.st.pending").toLowerCase()} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="label-xs border-y border-line bg-pine-50/50">
                  <th className="px-5 py-2.5 font-semibold">{t("doc.name")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("doc.kind")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("doc.version")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("doc.expires")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("doc.status")}</th>
                  <th className="px-4 py-2.5 font-semibold text-right">{t("doc.sign")}</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-line/60 last:border-0 hover:bg-pine-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        {d.empId ? <Avatar name={empName(d.empId)} size={30} /> : (
                          <span className="w-[30px] h-[30px] rounded-full bg-slate2-100 text-slate2-500 flex items-center justify-center text-[10px] font-bold">ORG</span>
                        )}
                        <div>
                          <div className="font-semibold text-ink">{d.name}</div>
                          <div className="text-[11px] text-mute font-mono">{d.updated} · {d.size}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Pill tone="slate">{t("doc.kind." + d.kind)}</Pill></td>
                    <td className="px-4 py-3 font-mono text-inksoft">{d.version}</td>
                    <td className="px-4 py-3">
                      {d.expires ? <span className="font-mono text-[12px] text-inksoft">{d.expires}</span> : <span className="text-[12px] text-mute">{t("doc.noExp")}</span>}
                    </td>
                    <td className="px-4 py-3"><Pill tone={STATUS_TONE[d.sign]}>{t("doc.st." + d.sign)}</Pill></td>
                    <td className="px-4 py-3 text-right">
                      {d.sign === "pending" ? (
                        <button onClick={() => setSigning(d)} className="btn-primary !py-1.5 !px-3 !text-[12px]">
                          <ISign size={13} /> {t("doc.sign")}
                        </button>
                      ) : d.sign === "signed" ? (
                        <span className="text-pine-600 inline-flex items-center gap-1 text-[12px] font-semibold"><ISign size={14} /> ✓</span>
                      ) : (
                        <span className="text-[12px] text-mute">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* expiring panel */}
        <div className="card self-start anim-fade-up" style={{ animationDelay: "0.12s" }}>
          <SectionHead title={t("doc.expiring")} sub={t("doc.valid")} />
          <div className="px-5 pb-5 space-y-3">
            {expiring.map(({ d, days }) => {
              const pct = Math.max(8, Math.min(100, (days / 365) * 100));
              const warn = days < 30;
              return (
                <div key={d.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-2">
                    {warn && <IAlert size={14} className="text-clay-600 shrink-0" />}
                    <span className="text-[12.5px] font-semibold text-ink leading-tight flex-1">{d.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px]">
                    <span className="text-mute">{d.expires}</span>
                    <span className={`font-mono font-bold ${warn ? "text-clay-600" : "text-pine-700"}`}>{days} d</span>
                  </div>
                  <div className="h-[5px] rounded-full bg-line/70 mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: warn ? "#ce5638" : "#256b52" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* signature modal */}
      <Modal open={!!signing} onClose={() => setSigning(null)} title={t("doc.signing")} sub={signing ? `${signing.name} · ${signing.version}` : undefined}>
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-canvas/50 p-4 text-[12.5px] text-inksoft leading-relaxed">
            <b className="text-ink">{t("doc.signSub")}.</b>{" "}
            {signing?.name} — {t("doc.kind." + (signing?.kind ?? ""))} {signing?.version}, {t("doc.updated")} {signing?.updated}.
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="label-xs">{t("doc.yourSign")}</span>
              <button onClick={clearPad} className="text-[11.5px] font-semibold text-clay-600 hover:text-clay-500 cursor-pointer">
                {t("doc.clear")}
              </button>
            </div>
            <SignaturePad hasInk={hasInk} setHasInk={setHasInk} />
            {!hasInk && <p className="text-[11.5px] text-mute mt-1.5">{t("doc.needsSign")}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setSigning(null)}>{t("emp.cancel")}</button>
            <button className="btn-primary" onClick={confirmSign} disabled={!hasInk}>
              <ISign size={14} /> {t("doc.confirm")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

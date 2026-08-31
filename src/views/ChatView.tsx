import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { CHANNELS, nowTime, seedMessages, type ChatMsg } from "../data";
import { useI18n } from "../i18n";
import { IDesk, IFlame, IHash, ISend } from "../icons";
import { Avatar, Pill } from "../ui";

const CHANNEL_ICON = { hash: IHash, flame: IFlame, desk: IDesk } as const;

const RESPONDERS: Record<string, { author: string; role: string }> = {
  general: { author: "Mateo Herrera", role: "Subgerente" },
  kitchen: { author: "João Silva", role: "Chef" },
  reception: { author: "Carla Mendes", role: "Recepción" },
};

export default function ChatView() {
  const { t, ta } = useI18n();
  const [msgs, setMsgs] = useState<Record<string, ChatMsg[]>>(() => seedMessages());
  const [active, setActive] = useState("general");
  const [input, setInput] = useState("");
  const [typingIn, setTypingIn] = useState<string | null>(null);
  const [unread, setUnread] = useState<Record<string, number>>({ kitchen: 2, reception: 1 });
  const replyIdx = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const names = useMemo(() => CHANNELS.map((c) => t("chat." + (c.id === "reception" ? "front" : c.id))), [t]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, active, typingIn]);

  /* simulated incoming message shortly after mount */
  useEffect(() => {
    const id = setTimeout(() => {
      const r = RESPONDERS.kitchen;
      setMsgs((m) => ({
        ...m,
        kitchen: [...m.kitchen, { id: uuid(), author: r.author, role: r.role, text: "Listo el mise en place para el servicio de la noche.", time: nowTime() }],
      }));
      if (activeRef.current !== "kitchen") setUnread((u) => ({ ...u, kitchen: (u.kitchen ?? 0) + 1 }));
    }, 7000);
    return () => clearTimeout(id);
  }, []);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const ch = active;
    setMsgs((m) => ({ ...m, [ch]: [...m[ch], { id: uuid(), author: "Valentina Ríos", role: "Gerente General", text, time: nowTime(), me: true }] }));
    setInput("");
    setTypingIn(ch);
    const responder = RESPONDERS[ch];
    const replies = ta("replies");
    const reply = replies[replyIdx.current % replies.length];
    replyIdx.current += 1;
    setTimeout(() => {
      setTypingIn(null);
      setMsgs((m) => ({ ...m, [ch]: [...m[ch], { id: uuid(), author: responder.author, role: responder.role, text: reply, time: nowTime() }] }));
    }, 1500 + Math.random() * 700);
  };

  const openChannel = (id: string) => {
    setActive(id);
    setUnread((u) => ({ ...u, [id]: 0 }));
  };

  return (
    <div className="space-y-4 h-full">
      <div className="anim-fade-up">
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("chat.title")}</h1>
        <p className="text-[13.5px] text-mute mt-1.5 flex items-center gap-2">
          {t("chat.sub")}
          <Pill tone="pine" pulse>Socket.io</Pill>
        </p>
      </div>

      <div className="card overflow-hidden grid grid-cols-1 md:grid-cols-[230px_1fr] anim-fade-up" style={{ animationDelay: "0.08s", height: "min(640px, calc(100vh - 260px))", minHeight: 440 }}>
        {/* channels */}
        <aside className="border-r border-line bg-pine-50/40 p-3 hidden md:block">
          <div className="label-xs px-2 mb-2">{t("chat.channels")}</div>
          <div className="space-y-1">
            {CHANNELS.map((c, i) => {
              const Icon = CHANNEL_ICON[c.icon];
              const isActive = active === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => openChannel(c.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive ? "bg-pine-600 text-white shadow-sm" : "hover:bg-pine-100/70 text-inksoft"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-marigold-300" : "text-mute"} />
                  <div className="min-w-0">
                    <div className={`text-[13px] font-semibold truncate ${isActive ? "text-white" : "text-ink"}`}>{names[i]}</div>
                    <div className={`text-[10.5px] ${isActive ? "text-pine-200/80" : "text-mute"}`}>
                      {c.members} {t("chat.members")}
                    </div>
                  </div>
                  {(unread[c.id] ?? 0) > 0 && (
                    <span className="ml-auto min-w-[19px] h-[19px] px-1 rounded-full bg-marigold-400 text-pine-950 text-[10.5px] font-bold flex items-center justify-center anim-pop">
                      {unread[c.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 px-2">
            <div className="label-xs mb-2">{t("chat.online")} · 8</div>
            <div className="flex -space-x-2">
              {["Mateo Herrera", "Carla Mendes", "João Silva", "Lucía Fernández", "Fernanda Costa"].map((n) => (
                <div key={n} className="relative">
                  <Avatar name={n} size={30} ring />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-pine-500 ring-2 ring-white" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* thread */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line bg-surface/80">
            {(() => {
              const ch = CHANNELS.find((c) => c.id === active)!;
              const Icon = CHANNEL_ICON[ch.icon];
              const idx = CHANNELS.findIndex((c) => c.id === active);
              return (
                <>
                  <span className="w-8 h-8 rounded-lg bg-pine-50 text-pine-600 flex items-center justify-center">
                    <Icon size={16} />
                  </span>
                  <div>
                    <div className="text-[13.5px] font-bold text-ink leading-tight"># {names[idx]}</div>
                    <div className="text-[11px] text-mute">{ch.members} {t("chat.members")}</div>
                  </div>
                </>
              );
            })()}
            <div className="ml-auto md:hidden">
              <select className="input-base !py-1.5 !w-auto text-[12px] cursor-pointer" value={active} onChange={(e) => openChannel(e.target.value)}>
                {CHANNELS.map((c, i) => (
                  <option key={c.id} value={c.id}># {names[i]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-canvas/50">
            <div className="flex justify-center">
              <span className="text-[10.5px] font-bold uppercase tracking-widest text-mute bg-line/60 rounded-full px-3 py-1">
                {t("chat.today")}
              </span>
            </div>
            {msgs[active].map((m) => (
              <div key={m.id} className={`flex gap-2.5 anim-fade-up ${m.me ? "flex-row-reverse" : ""}`}>
                <Avatar name={m.author} size={32} />
                <div className={`max-w-[78%] ${m.me ? "text-right" : ""}`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${m.me ? "justify-end" : ""}`}>
                    <span className="text-[12px] font-bold text-ink">{m.author}</span>
                    <span className="text-[10.5px] text-mute">{m.role}</span>
                    <span className="font-mono text-[10px] text-mute">{m.time}</span>
                  </div>
                  <div
                    className={`inline-block text-left text-[13px] leading-relaxed px-3.5 py-2.5 rounded-2xl border ${
                      m.me
                        ? "bg-pine-600 text-white border-pine-700 rounded-tr-md"
                        : "bg-surface text-ink border-line rounded-tl-md shadow-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {typingIn === active && (
              <div className="flex items-center gap-2.5 anim-fade-up">
                <Avatar name={RESPONDERS[active].author} size={32} />
                <div className="bg-surface border border-line rounded-2xl rounded-tl-md px-3.5 py-3 flex items-center gap-1 shadow-sm">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="text-[10.5px] text-mute ml-1.5">{RESPONDERS[active].author.split(" ")[0]} {t("chat.typing")}</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-line bg-surface">
            <div className="flex items-center gap-2">
              <input
                className="input-base flex-1"
                placeholder={t("chat.placeholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="btn-primary !px-4" onClick={send} disabled={!input.trim()} aria-label={t("chat.send")}>
                <ISend size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

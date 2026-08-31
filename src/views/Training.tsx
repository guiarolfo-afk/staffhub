import { useMemo, useState } from "react";
import { LESSONS, TRN_CATS, type Lesson } from "../data";
import { useI18n } from "../i18n";
import { IEye, IHeart, IPlay, IZap } from "../icons";
import { Pill } from "../ui";

function LessonCard({ lesson, playing, onPlay, onLike, liked }: { lesson: Lesson; playing: boolean; onPlay: () => void; onLike: () => void; liked: boolean }) {
  const { t } = useI18n();
  return (
    <div className="relative shrink-0 w-[196px] sm:w-[218px] rounded-[20px] overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all hover:-translate-y-1" style={{ aspectRatio: "9/15.5" }} onClick={onPlay}>
      <img src={lesson.cover} alt={t(lesson.title)} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-pine-950/50 via-transparent to-pine-950/85" />

      {/* top chips */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-1.5">
        <span className="text-[9.5px] font-bold uppercase tracking-wider rounded-full px-2 py-[3px] backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
          {t("trn.cat." + lesson.category)}
        </span>
        {lesson.category === "safety" && (
          <span className="text-[9.5px] font-bold uppercase tracking-wider rounded-full px-2 py-[3px] bg-marigold-400 text-pine-950">
            {t("trn.required")}
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] font-semibold rounded-md px-1.5 py-[2px]" style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}>
          {lesson.duration}
        </span>
      </div>

      {/* play / playing */}
      <div className="absolute inset-0 flex items-center justify-center">
        {playing ? (
          <div className="flex items-end gap-[3px] h-6 anim-pop">
            <span className="eq-bar h-6" />
            <span className="eq-bar h-6" />
            <span className="eq-bar h-6" />
            <span className="eq-bar h-6" />
          </div>
        ) : (
          <span className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white transition-all group-hover:scale-110 group-hover:bg-marigold-400 group-hover:text-pine-950 group-hover:border-marigold-400">
            <IPlay size={19} className="translate-x-[1.5px]" />
          </span>
        )}
      </div>

      {/* bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <div className="font-display font-bold text-[13.5px] text-white leading-snug">{t(lesson.title)}</div>
        <div className="text-[11px] text-white/70 mt-1 leading-snug line-clamp-2">{t(lesson.desc)}</div>
        <div className="flex items-center gap-3 mt-2.5">
          <span className="flex items-center gap-1 text-[10.5px] font-semibold text-white/85">
            <IEye size={12} /> {lesson.views} {t("trn.views")}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className={`flex items-center gap-1 text-[10.5px] font-semibold transition-all cursor-pointer ${liked ? "text-marigold-300 scale-110" : "text-white/85 hover:text-white"}`}
          >
            <IHeart size={12} className={liked ? "fill-marigold-300" : ""} sw={liked ? 0 : 1.7} />
            {lesson.likes + (liked ? 1 : 0)}
          </button>
        </div>
      </div>

      {/* playing progress */}
      {playing && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/20">
          <div className="h-full bg-marigold-400 bar-grow" style={{ animationDuration: "14s", animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
        </div>
      )}
    </div>
  );
}

export default function Training() {
  const { t } = useI18n();
  const [cat, setCat] = useState<string>("all");
  const [playingId, setPlayingId] = useState<string | null>("l1");
  const [liked, setLiked] = useState<Set<string>>(new Set(["l2", "l8"]));

  const lessons = useMemo(() => (cat === "all" ? LESSONS : LESSONS.filter((l) => l.category === cat)), [cat]);

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <div className="space-y-4">
      <div className="anim-fade-up">
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none">{t("trn.title")}</h1>
        <p className="text-[13.5px] text-mute mt-1.5">{t("trn.sub")}</p>
      </div>

      {/* progress banner */}
      <div className="card sidebar-bg text-white p-5 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden relative anim-fade-up" style={{ animationDelay: "0.06s" }}>
        <div className="absolute -right-10 -top-14 w-44 h-44 rounded-full bg-marigold-400/10" />
        <div className="col-span-2 md:col-span-1">
          <div className="label-xs !text-pine-200/70">{t("trn.progress")}</div>
          <div className="mt-2.5 flex items-end gap-1.5">
            <span className="font-display font-extrabold text-[34px] leading-none text-marigold-300">68%</span>
            <span className="text-[11px] text-pine-200/70 mb-1">/ 100%</span>
          </div>
          <div className="h-[7px] rounded-full bg-white/10 mt-2.5 overflow-hidden">
            <div className="h-full rounded-full bg-marigold-400 bar-grow" style={{ width: "68%" }} />
          </div>
        </div>
        {[
          { v: "12", l: t("trn.lessons") },
          { v: "47", l: t("trn.mins") },
          { v: "6", l: t("trn.streak"), fire: true },
        ].map((k) => (
          <div key={k.l} className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-[26px] leading-none text-white">{k.v}</span>
              {k.fire && <IZap size={16} className="text-marigold-400" />}
            </div>
            <div className="text-[11.5px] text-pine-200/70 mt-1.5">{k.l}</div>
          </div>
        ))}
      </div>

      {/* category chips */}
      <div className="flex items-center gap-2 flex-wrap anim-fade-up" style={{ animationDelay: "0.1s" }}>
        {TRN_CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all cursor-pointer ${
              cat === c ? "bg-pine-600 text-white shadow-sm" : "bg-surface border border-line text-inksoft hover:border-pine-400 hover:text-pine-700"
            }`}
          >
            {t("trn.cat." + c)}
          </button>
        ))}
        <span className="ml-auto hidden md:block">
          <Pill tone="pine" pulse>{lessons.length} videos</Pill>
        </span>
      </div>

      {/* feed */}
      <div className="anim-fade-up" style={{ animationDelay: "0.14s" }}>
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory" style={{ scrollPaddingInline: 4 }}>
          {lessons.map((l) => (
            <div key={l.id} className="snap-start">
              <LessonCard
                lesson={l}
                playing={playingId === l.id}
                onPlay={() => setPlayingId((p) => (p === l.id ? null : l.id))}
                liked={liked.has(l.id)}
                onLike={() => toggleLike(l.id)}
              />
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-mute mt-1">{t("dev.interactive")}</p>
      </div>
    </div>
  );
}

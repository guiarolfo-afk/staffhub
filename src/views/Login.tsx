import { useState, type FormEvent } from "react";
import { useI18n } from "../i18n";
import { LangSwitch, Wordmark } from "../ui";
import { IArrowR, IBuilding, IPhone2, ITablet, IZap, IAlert } from "../icons";

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function Login({ onLogin }: { onLogin: () => void }) {
  const { t, ta } = useI18n();
  const [email, setEmail] = useState("valentina@staffhub.co");
  const [pass, setPass] = useState("demo-360");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pass.trim()) {
      setError(true);
      setTimeout(() => setError(false), 600);
      return;
    }
    setLoading(true);
    setTimeout(onLogin, 950);
  };

  const apps = [
    { icon: <IBuilding size={16} />, name: t("login.appAdmin"), tag: t("login.web") },
    { icon: <IZap size={16} />, name: t("login.appManager"), tag: t("login.web") },
    { icon: <IPhone2 size={16} />, name: t("login.appEmployee"), tag: t("login.mobile") },
    { icon: <ITablet size={16} />, name: t("login.appKiosk"), tag: t("login.tablet") },
  ];

  const tickerItems = ta("ticker");

  return (
    <div className="min-h-full flex">
      {/* ---------- left brand panel ---------- */}
      <aside className="sidebar-bg hidden lg:flex flex-col w-[46%] xl:w-[42%] relative overflow-hidden text-[#e9f2ea]">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(#f0b24e 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        <div className="relative flex items-center justify-between p-8">
          <Wordmark light />
          <LangSwitch dark />
        </div>

        <div className="relative flex-1 flex flex-col justify-center px-8 xl:px-14 pb-8">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-marigold-300 mb-5 anim-fade-up">
            {t("login.kicker")}
          </p>
          <h1
            className="font-display font-extrabold tracking-tight text-[44px] xl:text-[56px] leading-[1.02] anim-fade-up"
            style={{ animationDelay: "0.08s" }}
          >
            {t("login.title")}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-pine-200/85 max-w-md anim-fade-up" style={{ animationDelay: "0.16s" }}>
            {t("login.sub")}
          </p>

          {/* ecosystem chips */}
          <div className="mt-9 grid grid-cols-2 gap-2.5 max-w-md anim-fade-up" style={{ animationDelay: "0.24s" }}>
            {apps.map((a) => (
              <div
                key={a.name}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 hover:bg-white/[0.11] hover:border-marigold-400/40 transition-all group"
              >
                <span className="text-marigold-300 group-hover:text-marigold-400 transition-colors">{a.icon}</span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold truncate">{a.name}</div>
                  <div className="text-[10px] text-pine-200/60 uppercase tracking-wider">{a.tag}</div>
                </div>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-marigold-400 blink shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* live ticker */}
        <div className="relative border-t border-white/10 py-3 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 px-8 bg-gradient-to-r from-pine-950 via-pine-950/90 to-transparent pr-12">
            <span className="w-1.5 h-1.5 rounded-full bg-marigold-400 blink" />
            <span className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-marigold-300 whitespace-nowrap">
              {t("login.live")}
            </span>
          </div>
          <div className="ticker-track gap-10 pl-[240px]">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="text-[12.5px] text-pine-200/80 whitespace-nowrap flex items-center gap-2.5">
                <span className="w-1 h-1 rounded-full bg-marigold-400/70" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* ---------- right form panel ---------- */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="lg:hidden absolute top-5 left-5">
          <Wordmark compact />
        </div>
        <div className="lg:hidden absolute top-5 right-5">
          <LangSwitch />
        </div>

        <div className={`w-full max-w-[400px] anim-fade-up ${error ? "anim-shake" : ""}`} style={{ animationDelay: "0.1s" }}>
          <div className="card p-7">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-pine-500" />
              <span className="label-xs !text-pine-600">StaffHub 360</span>
            </div>
            <h2 className="font-display font-bold text-[24px] text-ink tracking-tight">{t("login.portal")}</h2>
            <p className="text-[13px] text-mute mt-1">{t("login.portalSub")}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="label-xs block mb-1.5">{t("login.email")}</span>
                <input
                  className="input-base"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  autoComplete="username"
                />
              </label>
              <label className="block">
                <span className="label-xs block mb-1.5">{t("login.password")}</span>
                <input
                  className="input-base"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </label>

              {error && (
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-clay-600">
                  <IAlert size={14} /> {t("login.required")}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full !py-3 text-[14px]">
                {loading ? <Spinner /> : <IArrowR size={16} />}
                {loading ? t("login.entering") : t("login.cta")}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-marigold-200/40 border border-marigold-300/50 px-3 py-2">
              <IZap size={13} className="text-marigold-600" />
              <span className="text-[11.5px] font-medium text-marigold-700">{t("login.demo")}</span>
            </div>
          </div>

          <p className="text-center text-[11px] text-mute mt-5">
            StaffHub 360 · REST + GraphQL · Socket.io · WebRTC
          </p>
        </div>
      </main>
    </div>
  );
}

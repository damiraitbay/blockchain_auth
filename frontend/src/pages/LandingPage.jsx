import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowRightLeft,
  Bell,
  KeyRound,
  LayoutDashboard,
  MessageCircle,
  Shield,
  Sparkles,
  Sun,
  Moon,
  Wallet,
  FileDown,
  Globe
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext.jsx';

const navPillClass =
  'whitespace-nowrap rounded-full border border-border-subtle bg-surface/90 px-3.5 py-2 text-sm font-medium text-content-muted transition hover:border-border hover:bg-surface-overlay hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';

function Header() {
  const { theme, setTheme, lang, setLang, t } = usePreferences();

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle/80 bg-surface-raised/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface-raised/75">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center justify-between gap-3">
          <a
            href="#top"
            className="flex min-w-0 max-w-[min(100%,16rem)] items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:max-w-none sm:gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-muted ring-1 ring-accent/25 ring-offset-2 ring-offset-surface-raised sm:h-10 sm:w-10 sm:rounded-2xl">
              <img src="/favicon.svg" alt="" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold tracking-tight text-content">{t.appTitle}</p>
              <p className="hidden text-xs leading-snug text-content-muted sm:line-clamp-2 sm:block md:line-clamp-1">
                {t.landingHeaderTagline}
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label={t.landingNavAria}>
            <a href="#how-it-works" className="rounded-lg px-3 py-2 text-sm font-medium text-content-muted transition hover:bg-surface-overlay hover:text-content">
              {t.landingNavHow}
            </a>
            <a href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-content-muted transition hover:bg-surface-overlay hover:text-content">
              {t.landingNavFeatures}
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <label className="sr-only" htmlFor="landing-lang">
              {t.language}
            </label>
            <div className="relative min-w-0">
              <Globe
                className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-faint sm:left-2.5"
                aria-hidden
              />
              <select
                id="landing-lang"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="h-9 min-w-[6.25rem] max-w-[9.5rem] appearance-none rounded-lg border border-border-subtle bg-surface py-2 pl-7 pr-6 text-xs font-medium text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:min-w-[7.5rem] sm:pl-8 sm:pr-7 sm:text-sm"
              >
                <option value="ru">Русский</option>
                <option value="kz">Қазақша</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-border-subtle bg-surface text-content-muted transition hover:border-border hover:text-content focus:outline-none focus:ring-2 focus:ring-accent/40"
              aria-label={theme === 'dark' ? t.light : t.dark}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/dashboard"
              className="hidden touch-manipulation items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-on-accent shadow-glow transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface-raised md:inline-flex md:px-4"
            >
              {t.landingOpenApp}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-t border-border-subtle/60 pt-3 md:hidden">
          <nav
            className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label={t.landingNavAria}
          >
            <a href="#how-it-works" className={navPillClass}>
              {t.landingNavHow}
            </a>
            <a href="#features" className={navPillClass}>
              {t.landingNavFeatures}
            </a>
          </nav>
          <Link
            to="/dashboard"
            className="inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent shadow-glow transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface-raised"
          >
            {t.landingOpenApp}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function StepCard({ step, title, body, Icon }) {
  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-raised/80 p-4 shadow-card backdrop-blur-sm transition duration-200 hover:border-border hover:shadow-lg sm:flex-row sm:gap-4 sm:p-5 dark:hover:border-zinc-600/80">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent ring-1 ring-accent/20 sm:h-12 sm:w-12">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-content-faint">{step}</p>
        <h3 className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-content sm:text-base">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-content-muted [overflow-wrap:anywhere]">{body}</p>
      </div>
    </article>
  );
}

function FeatureCard({ title, body, Icon }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-raised/70 p-4 shadow-card backdrop-blur-sm transition hover:border-border sm:p-5">
      <div className="mb-2.5 inline-flex rounded-lg bg-surface-overlay p-2 text-accent sm:mb-3">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold leading-snug text-content">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-content-muted [overflow-wrap:anywhere]">{body}</p>
    </div>
  );
}

export function LandingPage() {
  const { t } = usePreferences();

  const steps = [
    { title: t.landingStep1Title, body: t.landingStep1Body, Icon: Wallet },
    { title: t.landingStep2Title, body: t.landingStep2Body, Icon: ArrowRightLeft },
    { title: t.landingStep3Title, body: t.landingStep3Body, Icon: Shield },
    { title: t.landingStep4Title, body: t.landingStep4Body, Icon: LayoutDashboard }
  ];

  const features = [
    { title: t.landingFeatOverviewTitle, body: t.landingFeatOverviewDesc, Icon: LayoutDashboard },
    { title: t.landingFeatSessionsTitle, body: t.landingFeatSessionsDesc, Icon: KeyRound },
    { title: t.landingFeatMessengerTitle, body: t.landingFeatMessengerDesc, Icon: MessageCircle },
    { title: t.landingFeatNotificationsTitle, body: t.landingFeatNotificationsDesc, Icon: Bell },
    { title: t.landingFeatPrivacyTitle, body: t.landingFeatPrivacyDesc, Icon: FileDown },
    { title: t.landingFeatAssistantTitle, body: t.landingFeatAssistantDesc, Icon: Sparkles }
  ];

  return (
    <div id="top" className="relative min-h-dvh">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-[0.28] dark:opacity-[0.1]" aria-hidden />
      <a
        href="#landing-main"
        className="sr-only z-[100] rounded-lg bg-accent px-4 py-2 font-semibold text-on-accent shadow-lg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
      >
        {t.skipToContent}
      </a>

      <Header />

      <main id="landing-main">
        <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-20 sm:pt-16 lg:pt-20">
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-[min(100%,36rem)] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl dark:bg-accent/10 sm:h-64 sm:w-[min(100%,42rem)]" aria-hidden />
          <div className="relative mx-auto max-w-3xl text-center max-[380px]:text-left sm:text-center">
            <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-border-subtle bg-surface-raised/90 px-3 py-1.5 text-left text-xs font-medium text-content-muted shadow-sm backdrop-blur-sm max-[380px]:w-full max-[380px]:justify-center sm:inline-flex sm:text-center">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_10px_rgb(var(--accent))]" aria-hidden />
              <span className="min-w-0 [overflow-wrap:anywhere]">{t.landingHeroEyebrow}</span>
            </p>
            <h1 className="mt-5 text-balance text-[1.65rem] font-semibold leading-tight tracking-tight text-content [overflow-wrap:anywhere] sm:mt-6 sm:text-4xl sm:leading-[1.15] lg:text-[2.75rem] lg:leading-[1.1]">
              {t.landingHeroTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-content-muted [overflow-wrap:anywhere] sm:mt-5 sm:text-lg">
              {t.landingHeroLead}
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
              <Link
                to="/dashboard"
                className="inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-[15px] font-semibold text-on-accent shadow-glow transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface sm:min-h-0 sm:px-6 sm:py-3.5 sm:text-base"
              >
                {t.landingHeroCta}
                <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl border border-border-subtle bg-surface-raised/80 px-5 py-3 text-[15px] font-semibold text-content shadow-card backdrop-blur-sm transition hover:border-border hover:bg-surface-overlay focus:outline-none focus:ring-2 focus:ring-accent/30 sm:min-h-0 sm:px-6 sm:py-3.5 sm:text-base"
              >
                {t.landingHeroHowLink}
              </a>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-[8.5rem] border-t border-border-subtle/70 bg-surface-raised/40 py-12 backdrop-blur-[2px] dark:bg-surface-raised/20 sm:scroll-mt-28 sm:py-16 md:scroll-mt-24 md:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center max-[380px]:text-left sm:text-center">
              <h2 className="text-xl font-semibold leading-snug tracking-tight text-content [overflow-wrap:anywhere] sm:text-2xl md:text-3xl">
                {t.landingHowTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-content-muted [overflow-wrap:anywhere] sm:text-base">{t.landingHowLead}</p>
            </div>
            <ol className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:gap-5">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <StepCard step={`${t.landingStepLabel} ${i + 1}`} title={s.title} body={s.body} Icon={s.Icon} />
                </li>
              ))}
            </ol>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-content-muted [overflow-wrap:anywhere] max-[380px]:text-left sm:mt-10 sm:text-center">
              {t.landingHowNote}
            </p>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-[8.5rem] py-12 sm:scroll-mt-28 sm:py-16 md:scroll-mt-24 md:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center max-[380px]:text-left sm:text-center">
              <h2 className="text-xl font-semibold leading-snug tracking-tight text-content [overflow-wrap:anywhere] sm:text-2xl md:text-3xl">
                {t.landingFeaturesTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-content-muted [overflow-wrap:anywhere] sm:text-base">{t.landingFeaturesLead}</p>
            </div>
            <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {features.map((f) => (
                <FeatureCard key={f.title} title={f.title} body={f.body} Icon={f.Icon} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border-subtle/70 py-12 sm:py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent-muted/90 via-surface-raised to-surface-raised p-5 shadow-glow dark:from-accent-muted/30 dark:via-surface-raised dark:to-surface sm:rounded-3xl sm:p-8 md:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:p-12">
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/20 blur-3xl dark:bg-accent/15 sm:-right-20 sm:-top-20 sm:h-56 sm:w-56" aria-hidden />
              <div className="relative max-w-xl text-center max-[480px]:mx-auto lg:text-left">
                <h2 className="text-xl font-semibold leading-snug tracking-tight text-content [overflow-wrap:anywhere] sm:text-2xl md:text-3xl">
                  {t.landingBottomTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-content-muted [overflow-wrap:anywhere] sm:text-base">{t.landingBottomLead}</p>
              </div>
              <div className="relative mt-6 flex w-full shrink-0 justify-center lg:mt-0 lg:w-auto lg:justify-end">
                <Link
                  to="/dashboard"
                  className="inline-flex min-h-[48px] w-full max-w-md touch-manipulation items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-[15px] font-semibold text-on-accent shadow-lg transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface-raised sm:min-h-0 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                >
                  <span className="min-w-0 text-center [overflow-wrap:anywhere]">{t.landingBottomCta}</span>
                  <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle py-8 sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-stretch justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
          <p className="text-center text-sm leading-relaxed text-content-muted [overflow-wrap:anywhere] sm:text-left">{t.landingFooterCopy}</p>
          <Link
            to="/dashboard"
            className="inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-1 text-center text-sm font-semibold text-accent transition hover:text-accent-hover focus:outline-none focus-visible:underline sm:min-h-0 sm:justify-end sm:text-right"
          >
            <span className="[overflow-wrap:anywhere]">{t.landingOpenApp}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

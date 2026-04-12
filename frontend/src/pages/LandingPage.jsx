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

function Header() {
  const { theme, setTheme, lang, setLang, t } = usePreferences();

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle/80 bg-surface-raised/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-accent-muted ring-1 ring-accent/25 ring-offset-2 ring-offset-surface-raised">
            <img src="/favicon.svg" alt="" width={40} height={40} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold tracking-tight text-content">{t.appTitle}</p>
            <p className="hidden text-xs text-content-muted sm:block">{t.landingHeaderTagline}</p>
          </div>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label={t.landingNavAria}>
          <a
            href="#how-it-works"
            className="rounded-lg px-3 py-2 text-sm font-medium text-content-muted transition hover:bg-surface-overlay hover:text-content"
          >
            {t.landingNavHow}
          </a>
          <a
            href="#features"
            className="rounded-lg px-3 py-2 text-sm font-medium text-content-muted transition hover:bg-surface-overlay hover:text-content"
          >
            {t.landingNavFeatures}
          </a>
        </nav>

        <div className="flex flex-shrink-0 items-center gap-2">
          <label className="sr-only" htmlFor="landing-lang">
            {t.language}
          </label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-faint" aria-hidden />
            <select
              id="landing-lang"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="h-9 max-w-[7.5rem] appearance-none rounded-lg border border-border-subtle bg-surface py-1.5 pl-8 pr-7 text-xs font-medium text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:max-w-none sm:pl-8 sm:pr-8 sm:text-sm"
            >
              <option value="ru">Русский</option>
              <option value="kz">Қазақша</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface text-content-muted transition hover:border-border hover:text-content focus:outline-none focus:ring-2 focus:ring-accent/40"
            aria-label={theme === 'dark' ? t.light : t.dark}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-on-accent shadow-glow transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface-raised sm:px-4"
          >
            {t.landingOpenApp}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function StepCard({ step, title, body, Icon }) {
  return (
    <article className="group relative flex gap-4 rounded-2xl border border-border-subtle bg-surface-raised/80 p-5 shadow-card backdrop-blur-sm transition duration-200 hover:border-border hover:shadow-lg dark:hover:border-zinc-600/80">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent ring-1 ring-accent/20">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-content-faint">{step}</p>
        <h3 className="mt-1 text-base font-semibold tracking-tight text-content">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-content-muted">{body}</p>
      </div>
    </article>
  );
}

function FeatureCard({ title, body, Icon }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-raised/70 p-5 shadow-card backdrop-blur-sm transition hover:border-border">
      <div className="mb-3 inline-flex rounded-lg bg-surface-overlay p-2 text-accent">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-content">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-content-muted">{body}</p>
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
        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:pt-20">
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(100%,42rem)] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl dark:bg-accent/10" aria-hidden />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-raised/90 px-3 py-1 text-xs font-medium text-content-muted shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgb(var(--accent))]" aria-hidden />
              {t.landingHeroEyebrow}
            </p>
            <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-content sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {t.landingHeroTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-content-muted sm:text-lg">
              {t.landingHeroLead}
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-on-accent shadow-glow transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface"
              >
                {t.landingHeroCta}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-surface-raised/80 px-6 py-3.5 text-base font-semibold text-content shadow-card backdrop-blur-sm transition hover:border-border hover:bg-surface-overlay focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {t.landingHeroHowLink}
              </a>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 border-t border-border-subtle/70 bg-surface-raised/40 py-16 backdrop-blur-[2px] dark:bg-surface-raised/20 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">{t.landingHowTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-content-muted sm:text-base">{t.landingHowLead}</p>
            </div>
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:gap-5">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <StepCard step={`${t.landingStepLabel} ${i + 1}`} title={s.title} body={s.body} Icon={s.Icon} />
                </li>
              ))}
            </ol>
            <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-content-muted">{t.landingHowNote}</p>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">{t.landingFeaturesTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-content-muted sm:text-base">{t.landingFeaturesLead}</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <FeatureCard key={f.title} title={f.title} body={f.body} Icon={f.Icon} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border-subtle/70 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent-muted/90 via-surface-raised to-surface-raised p-8 shadow-glow dark:from-accent-muted/30 dark:via-surface-raised dark:to-surface sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:p-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl dark:bg-accent/15" aria-hidden />
              <div className="relative max-w-xl">
                <h2 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">{t.landingBottomTitle}</h2>
                <p className="mt-3 text-sm leading-relaxed text-content-muted sm:text-base">{t.landingBottomLead}</p>
              </div>
              <div className="relative mt-8 flex shrink-0 lg:mt-0">
                <Link
                  to="/dashboard"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 text-base font-semibold text-on-accent shadow-lg transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface-raised sm:w-auto"
                >
                  {t.landingBottomCta}
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="text-sm text-content-muted">{t.landingFooterCopy}</p>
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-accent transition hover:text-accent-hover focus:outline-none focus-visible:underline"
          >
            {t.landingOpenApp} →
          </Link>
        </div>
      </footer>
    </div>
  );
}

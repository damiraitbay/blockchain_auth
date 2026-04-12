import { Link, NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  User,
  MessageCircle,
  KeyRound,
  Shield,
  Settings,
  Sun,
  Moon,
  Bell,
  Sparkles
} from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useWeb3Auth } from '../../context/Web3AuthContext.jsx';
import { fetchNotifications } from '../../lib/api.js';

const baseNav = [
  { to: '/profile', labelKey: 'profile', Icon: User },
  { to: '/dashboard', labelKey: 'dashboard', Icon: LayoutDashboard },
  { to: '/messages', labelKey: 'messenger', Icon: MessageCircle },
  { to: '/sessions', labelKey: 'sessions', Icon: KeyRound },
  { to: '/security', labelKey: 'security', Icon: Shield },
  { to: '/settings', labelKey: 'settings', Icon: Settings }
];

function NavIcon({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent-muted text-accent shadow-glow'
            : 'text-content-muted hover:bg-surface-overlay hover:text-content'
        ].join(' ')
      }
    >
      <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
      <span className="hidden lg:inline">{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  const { theme, setTheme, t } = usePreferences();
  const { token } = useWeb3Auth();

  const notifQuery = useQuery({
    queryKey: ['notifications', token],
    queryFn: () => fetchNotifications(token),
    enabled: Boolean(token),
    refetchInterval: 60_000
  });

  const navItems = baseNav;
  const unread = notifQuery.data?.unreadCount ?? 0;

  return (
    <div className="relative min-h-dvh">
      <div
        className="pointer-events-none fixed inset-0 bg-grid opacity-[0.28] dark:opacity-[0.1]"
        aria-hidden
      />
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-lg bg-accent px-4 py-2 font-semibold text-on-accent shadow-lg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
      >
        {t.skipToContent}
      </a>
      <div className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-24 pt-6 sm:px-6 lg:flex-row lg:gap-10 lg:pb-10 lg:pt-8">
        <header className="mb-8 flex shrink-0 flex-col gap-6 lg:sticky lg:top-8 lg:mb-0 lg:h-fit lg:w-56 lg:self-start lg:pt-2">
          <div className="flex items-start justify-between gap-4 lg:flex-col lg:items-stretch">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-accent-muted ring-1 ring-accent/25 ring-offset-2 ring-offset-surface">
                <img src="/favicon.svg" alt="" width={44} height={44} className="h-full w-full object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-content">{t.appTitle}</h1>
                <p className="mt-0.5 text-sm leading-snug text-content-muted">{t.appSubtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                to="/notifications"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-content-muted transition hover:border-border hover:text-content focus:outline-none focus:ring-2 focus:ring-accent/40"
                aria-label={t.notifications}
              >
                <Bell className="h-4 w-4" aria-hidden />
                {token && unread > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                ) : null}
              </Link>
              <NavLink
                to="/assistant"
                className={({ isActive }) =>
                  [
                    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-content-muted transition hover:border-border hover:text-content focus:outline-none focus:ring-2 focus:ring-accent/40',
                    isActive ? 'border-accent/50 text-accent shadow-glow' : ''
                  ].join(' ')
                }
                aria-label={t.assistantNav}
              >
                <Sparkles className="h-4 w-4" aria-hidden />
              </NavLink>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-content-muted transition hover:border-border hover:text-content focus:outline-none focus:ring-2 focus:ring-accent/40"
                aria-label={theme === 'dark' ? t.light : t.dark}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <nav className="hidden lg:flex lg:flex-col lg:gap-1" aria-label="Main">
            {navItems.map(({ to, labelKey, Icon }) => (
              <NavIcon key={to} to={to} label={t[labelKey]} Icon={Icon} />
            ))}
          </nav>
        </header>

        <main
          id="main-content"
          className="min-w-0 flex-1 animate-fade-in outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
          tabIndex={-1}
        >
          <Outlet />
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-surface-raised/95 shadow-[0_-8px_32px_-8px_rgb(0_0_0/0.12)] backdrop-blur-md dark:shadow-[0_-8px_32px_-8px_rgb(0_0_0/0.45)] lg:hidden"
          aria-label="Main mobile"
        >
          <div className="mx-auto flex max-w-6xl justify-around rounded-t-2xl px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {navItems.map(({ to, labelKey, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors',
                    isActive ? 'text-accent' : 'text-content-muted active:scale-[0.98]'
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-accent-muted text-accent shadow-sm ring-1 ring-accent/20'
                          : 'bg-transparent'
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="max-w-[4rem] truncate leading-tight">{t[labelKey]}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

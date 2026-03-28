import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Cpu, LogIn, QrCode, Shield } from 'lucide-react';
import { useWeb3Auth } from '../context/Web3AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { fetchAdminStats, fetchSession } from '../lib/api.js';
import { shortAddress } from '../lib/utils.js';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card transition hover:border-border/80">
      <p className="text-xs font-semibold uppercase tracking-wider text-content-faint">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-content">{value}</p>
    </div>
  );
}

function AdminStats() {
  const { t } = usePreferences();
  const { token } = useWeb3Auth();

  const query = useQuery({
    queryKey: ['admin-stats', token],
    queryFn: () => fetchAdminStats(token),
    enabled: Boolean(token)
  });

  return (
    <>
      {query.isLoading ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6">
          <SkeletonLines />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-danger">{t.adminOnly}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label={t.statUsers} value={query.data?.totalUsers ?? '—'} />
          <StatCard label={t.statAdmins} value={query.data?.adminUsers ?? '—'} />
          <StatCard label={t.statSessions} value={query.data?.activeRefreshSessions ?? '—'} />
          <StatCard label={t.statChallenges} value={query.data?.activeChallenges ?? '—'} />
          <StatCard label={t.statNotif24h} value={query.data?.notificationsLast24h ?? '—'} />
          <StatCard label={t.statNotifUnread} value={query.data?.unreadNotificationsTotal ?? '—'} />
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-content-faint">
        <Shield className="h-4 w-4 shrink-0" aria-hidden />
        {t.adminFooterNote}
      </p>
    </>
  );
}

export function AdminPage() {
  const { t } = usePreferences();
  const { token, wallet, connect, connectQr, login } = useWeb3Auth();

  const sessionQuery = useQuery({
    queryKey: ['session', token],
    queryFn: () => fetchSession(token),
    enabled: Boolean(token)
  });

  if (!token) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-muted text-accent">
            <BarChart3 className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-content">{t.adminLoginTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-content-muted">{t.adminLoginSubtitle}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-card">
          <p className="mb-4 text-sm text-content-muted">
            {wallet.account ? (
              <>
                <span className="font-mono font-medium text-content">{shortAddress(wallet.account)}</span>
              </>
            ) : (
              t.notConnected
            )}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {!wallet.hasInjectedProvider && wallet.hasWalletConnect ? (
              <button
                type="button"
                onClick={connectQr}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent shadow-sm transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
              >
                <QrCode className="h-4 w-4" aria-hidden />
                {t.connectQr}
              </button>
            ) : null}
            {wallet.hasInjectedProvider ? (
              <button
                type="button"
                onClick={connect}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent shadow-sm transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
              >
                <Cpu className="h-4 w-4" />
                {t.connectWallet}
              </button>
            ) : null}
            {wallet.hasInjectedProvider && wallet.hasWalletConnect ? (
              <button
                type="button"
                onClick={connectQr}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-content transition hover:bg-surface-overlay focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <QrCode className="h-4 w-4" aria-hidden />
                {t.connectQr}
              </button>
            ) : null}
            <button
              type="button"
              onClick={login}
              disabled={!wallet.account || !wallet.isSupportedChain}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-content transition hover:bg-surface-overlay focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {t.signIn}
            </button>
          </div>
          {wallet.hasWalletConnect ? (
            <p className="mt-3 text-xs leading-relaxed text-content-muted">{t.connectQrHint}</p>
          ) : null}
          {!wallet.hasInjectedProvider && !wallet.hasWalletConnect ? (
            <p className="mt-3 text-sm text-content-muted">{t.installWallet}</p>
          ) : null}
          <p className="mt-4 text-xs text-content-faint">
            <Link to="/dashboard" className="text-accent underline-offset-2 hover:underline">
              ← {t.dashboard}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-content-muted">
        <span className="animate-pulse">{t.loading}</span>
      </div>
    );
  }

  if (sessionQuery.data?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/15 text-danger">
            <Shield className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-content">{t.adminPanel}</h2>
            <p className="mt-3 text-sm leading-relaxed text-content-muted">{t.adminNotInList}</p>
            <p className="mt-2 font-mono text-xs text-content-faint">
              {shortAddress(sessionQuery.data?.address || '')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard"
            className="inline-flex rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-content hover:bg-surface-overlay"
          >
            {t.dashboard}
          </Link>
          <button
            type="button"
            onClick={login}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent"
          >
            <LogIn className="h-4 w-4" />
            {t.signIn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-muted text-accent">
          <BarChart3 className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-content">{t.adminPanel}</h2>
          <p className="mt-1 text-sm text-content-muted">{t.adminHint}</p>
        </div>
      </div>

      <AdminStats />
    </div>
  );
}

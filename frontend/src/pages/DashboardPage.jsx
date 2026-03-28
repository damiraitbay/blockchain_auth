import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRightLeft,
  Cpu,
  ExternalLink,
  LogOut,
  QrCode,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useWeb3Auth } from '../context/Web3AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { useChainSnapshot } from '../hooks/useChainSnapshot.js';
import { fetchHealth } from '../lib/api.js';
import { getExplorerAddressUrl } from '../lib/explorer.js';
import { shortAddress } from '../lib/utils.js';

function Card({ title, children, action }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-raised/80 p-5 shadow-card backdrop-blur-sm transition duration-200 hover:border-border hover:shadow-lg dark:hover:border-zinc-600/80">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-content-faint">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function DashboardPage() {
  const { t } = usePreferences();
  const { token, refreshToken, status, wallet, connect, connectQr, login, refresh, logout, signedAt } =
    useWeb3Auth();

  const chainEnabled =
    Boolean(wallet.account) && wallet.isSupportedChain && Boolean(wallet.getEip1193Provider?.());

  const chainSnap = useChainSnapshot({
    getProvider: wallet.getEip1193Provider,
    address: wallet.account,
    enabled: chainEnabled
  });

  const explorerUrl =
    wallet.account && wallet.chainId ? getExplorerAddressUrl(wallet.chainId, wallet.account) : null;

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30000
  });

  const stepState = useMemo(
    () => ({
      connect: Boolean(wallet.account),
      sign: Boolean(signedAt),
      auth: Boolean(token)
    }),
    [wallet.account, signedAt, token]
  );

  const steps = [
    { key: 'connect', label: t.stepConnect, done: stepState.connect },
    { key: 'sign', label: t.stepSign, done: stepState.sign },
    { key: 'auth', label: t.stepAuth, done: stepState.auth }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-content">{t.dashboard}</h2>
        <p className="mt-1 text-sm text-content-muted">{t.appSubtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title={t.wallet}>
          <p className="font-mono text-lg font-medium text-content">
            {wallet.account ? shortAddress(wallet.account) : t.notConnected}
          </p>
        </Card>

        <Card
          title={t.chain}
          action={
            !wallet.isSupportedChain && wallet.chainId ? (
              <button
                type="button"
                onClick={() => wallet.switchNetwork()}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-content hover:bg-surface-overlay"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                {t.switchNetwork}
              </button>
            ) : null
          }
        >
          <p className="text-lg font-medium text-content">
            {wallet.chainId ? `${t.chainId} ${wallet.chainId}` : '—'}
          </p>
          {!wallet.isSupportedChain && wallet.chainId ? (
            <p className="mt-2 text-xs text-danger">{t.unsupportedNetwork}</p>
          ) : null}
        </Card>

        <Card title={t.backend}>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                healthQuery.isError ? 'bg-danger' : healthQuery.isPending ? 'animate-pulse bg-content-muted' : 'bg-success'
              }`}
              aria-hidden
            />
            <span className="text-lg font-medium text-content">
              {healthQuery.isError ? t.offline : healthQuery.isPending ? t.checkingApi : t.online}
            </span>
          </div>
        </Card>

        <Card
          title={t.onChainTitle}
          action={
            chainEnabled ? (
              <button
                type="button"
                onClick={() => chainSnap.refetch()}
                disabled={chainSnap.loading}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-content hover:bg-surface-overlay disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${chainSnap.loading ? 'animate-spin' : ''}`} />
                {t.refreshOnChain}
              </button>
            ) : null
          }
        >
          {!wallet.account ? (
            <p className="text-sm text-content-muted">{t.notConnected}</p>
          ) : !wallet.isSupportedChain ? (
            <p className="text-sm text-danger">{t.unsupportedNetwork}</p>
          ) : (
            <>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-content-muted">{t.nativeBalance}</dt>
                  <dd className="font-mono font-medium text-content">
                    {chainSnap.loading && chainSnap.balanceWei == null ? t.loading : chainSnap.balanceLabel ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-content-muted">{t.latestBlock}</dt>
                  <dd className="font-mono font-medium text-content">
                    {chainSnap.blockNumber != null ? chainSnap.blockNumber.toLocaleString() : chainSnap.loading ? t.loading : '—'}
                  </dd>
                </div>
              </dl>
              {explorerUrl ? (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  {t.explorerLink}
                </a>
              ) : null}
              <p className="mt-2 text-xs leading-relaxed text-content-faint">{t.onChainHint}</p>
            </>
          )}
        </Card>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-card transition duration-200 hover:border-border/90 dark:hover:border-zinc-600/60">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-muted text-accent">
            <Activity className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content">{t.status}</h3>
            <p className="text-sm text-content-muted">{status}</p>
          </div>
        </div>

        <ol className="mb-8 grid gap-3 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.key}
              className={[
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm',
                step.done
                  ? 'border-accent/40 bg-accent-muted/50 text-accent'
                  : 'border-border-subtle bg-surface text-content-muted'
              ].join(' ')}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised font-mono text-xs font-semibold text-content-faint">
                {i + 1}
              </span>
              <span className="font-medium">{step.label}</span>
              {step.done ? <ShieldCheck className="ml-auto h-4 w-4 shrink-0 opacity-80" aria-hidden /> : null}
            </li>
          ))}
        </ol>

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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent shadow-sm transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
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
            {t.signIn}
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={!refreshToken}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-content transition hover:bg-surface-overlay focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            {t.refresh}
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger/15 px-4 py-3 text-sm font-semibold text-danger transition hover:bg-danger/25 focus:outline-none focus:ring-2 focus:ring-danger/30"
          >
            <LogOut className="h-4 w-4" />
            {t.logout}
          </button>
        </div>
        {wallet.hasWalletConnect ? (
          <p className="mt-3 text-xs leading-relaxed text-content-muted">{t.connectQrHint}</p>
        ) : null}
        {!wallet.hasInjectedProvider && !wallet.hasWalletConnect ? (
          <p className="mt-3 text-sm text-content-muted">{t.installWallet}</p>
        ) : null}
      </div>
    </div>
  );
}

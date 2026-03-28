import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import { useWeb3Auth } from '../context/Web3AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { fetchSessions, postRevokeSession } from '../lib/api.js';
import { toLocalDate } from '../lib/utils.js';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';

export function SessionsPage() {
  const { t, lang } = usePreferences();
  const { token, logout } = useWeb3Auth();
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['sessions', token],
    queryFn: () => fetchSessions(token),
    enabled: Boolean(token)
  });

  const revokeMutation = useMutation({
    mutationFn: (jti) => postRevokeSession(token, jti),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-content">{t.sessions}</h2>
        <p className="mt-1 text-sm text-content-muted">{t.sessionsHint}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised shadow-card">
        {sessionsQuery.isLoading ? (
          <div className="p-6">
            <SkeletonLines />
          </div>
        ) : sessionsQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface/80">
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-content-muted">{t.createdAt}</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-content-muted">{t.lastUsedAt}</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-content-muted">{t.expiresAt}</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-content-muted">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {sessionsQuery.data.map((item) => (
                  <tr
                    key={item.jti}
                    className="border-b border-border-subtle/80 transition-colors last:border-0 hover:bg-surface-overlay/60"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-content-muted">
                      {toLocalDate(item.createdAt, lang)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-content-muted">
                      {toLocalDate(item.lastUsedAt, lang)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-content-muted">
                      {toLocalDate(item.expiresAt, lang)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => revokeMutation.mutate(item.jti)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-content transition hover:bg-surface-overlay"
                      >
                        {t.revoke}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-overlay text-content-faint">
              <Inbox className="h-7 w-7" aria-hidden />
            </div>
            <p className="text-sm text-content-muted">{t.noSessions}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={logout}
        className="w-full rounded-xl bg-danger/15 px-4 py-3 text-sm font-semibold text-danger transition hover:bg-danger/25 sm:w-auto"
      >
        {t.revokeAll}
      </button>
    </div>
  );
}

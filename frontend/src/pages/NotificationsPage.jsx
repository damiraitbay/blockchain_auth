import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3Auth } from '../context/Web3AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { fetchNotifications, postNotificationRead, postNotificationsReadAll } from '../lib/api.js';
import { toLocalDate } from '../lib/utils.js';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';

export function NotificationsPage() {
  const { t, lang } = usePreferences();
  const { token } = useWeb3Auth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', token],
    queryFn: () => fetchNotifications(token),
    enabled: Boolean(token),
    refetchInterval: 45_000
  });

  const readOne = useMutation({
    mutationFn: (id) => postNotificationRead(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['session'] });
    }
  });

  const readAll = useMutation({
    mutationFn: () => postNotificationsReadAll(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t.markAllRead);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-content">{t.notifications}</h2>
          <p className="mt-1 text-sm text-content-muted">{t.notificationsHint}</p>
        </div>
        {query.data?.notifications?.length ? (
          <button
            type="button"
            onClick={() => readAll.mutate()}
            disabled={readAll.isPending || !query.data?.unreadCount}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-content transition hover:bg-surface-overlay disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            {t.markAllRead}
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-raised shadow-card">
        {query.isLoading ? (
          <div className="p-6">
            <SkeletonLines />
          </div>
        ) : query.isError ? (
          <div className="flex flex-col gap-2 px-6 py-10 text-center">
            <p className="text-sm font-medium text-danger">{t.notificationsLoadFailed}</p>
            <p className="text-xs text-content-muted">{t.notificationsLoadFailedHint}</p>
          </div>
        ) : query.data?.notifications?.length ? (
          <ul className="divide-y divide-border-subtle">
            {query.data.notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!n.readAt) readOne.mutate(n.id);
                  }}
                  className={`flex w-full flex-col gap-1 px-5 py-4 text-left transition hover:bg-surface-overlay/80 ${
                    !n.readAt ? 'bg-accent-muted/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-overlay text-accent">
                        <Bell className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <p className="font-semibold text-content">{n.title}</p>
                        {n.body ? <p className="mt-1 text-sm text-content-muted">{n.body}</p> : null}
                        {n.metadata?.ip ? (
                          <p className="mt-2 font-mono text-xs text-content-faint">
                            IP: {n.metadata.ip}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <time className="shrink-0 text-xs text-content-faint">
                      {toLocalDate(n.createdAt, lang)}
                    </time>
                  </div>
                  {!n.readAt ? (
                    <span className="ml-12 text-xs font-medium text-accent">{t.unread}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-overlay text-content-faint">
              <Bell className="h-7 w-7" aria-hidden />
            </div>
            <p className="text-sm text-content-muted">{t.noNotifications}</p>
          </div>
        )}
      </div>
    </div>
  );
}

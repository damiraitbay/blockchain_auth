import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BarChart3, Save } from 'lucide-react';
import { useWeb3Auth } from '../context/Web3AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { fetchSession, putProfile } from '../lib/api.js';
import { getFriendlyError } from '../lib/utils.js';
import { profileSchema } from '../lib/validation.js';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';

export function ProfilePage() {
  const { t } = usePreferences();
  const { token } = useWeb3Auth();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  const sessionQuery = useQuery({
    queryKey: ['session', token],
    queryFn: () => fetchSession(token),
    enabled: Boolean(token)
  });

  useEffect(() => {
    const profile = sessionQuery.data;
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
    }
  }, [sessionQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = profileSchema.parse({ displayName, bio });
      return putProfile(token, parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success(t.profileSaved);
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, t));
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-content">{t.profile}</h2>
        <p className="mt-1 text-sm text-content-muted">{t.profileHint}</p>
      </div>

      {token ? (
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 text-sm font-medium text-content shadow-card transition hover:border-accent/40 hover:bg-surface-overlay focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <BarChart3 className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          {t.adminOpenPanel}
        </Link>
      ) : null}

      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-card">
        {sessionQuery.isLoading ? (
          <SkeletonLines />
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-content-muted">{t.displayName}</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                disabled={!token}
                className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-content placeholder:text-content-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-content-muted">{t.bio}</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                maxLength={240}
                disabled={!token}
                className="w-full resize-y rounded-xl border border-border-subtle bg-surface px-4 py-3 text-content placeholder:text-content-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
              />
            </label>
            <button
              type="submit"
              disabled={!token || saveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent shadow-sm transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {t.saveProfile}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

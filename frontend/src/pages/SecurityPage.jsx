import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useWeb3Auth } from '../context/Web3AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { deleteMyAccount, downloadMyDataExport } from '../lib/api.js';

export function SecurityPage() {
  const { t, reducedMotion, setReducedMotion, setLang, setTheme } = usePreferences();
  const { token, clearSession } = useWeb3Auth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deletePhrase, setDeletePhrase] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function clearAllLocal() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lang');
    localStorage.removeItem('theme');
    localStorage.removeItem('reducedMotion');
    setLang('ru');
    setTheme('dark');
    setReducedMotion(false);
    clearSession();
    toast.success(t.localDataCleared);
  }

  async function handleExport() {
    if (!token) {
      toast.error(t.connectFirst);
      return;
    }
    setExporting(true);
    try {
      const { blob, filename } = await downloadMyDataExport(token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t.exportStarted);
    } catch (e) {
      toast.error(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!token) return;
    if (deletePhrase !== 'DELETE_MY_ACCOUNT') {
      toast.error(t.deleteConfirmLabel);
      return;
    }
    setDeleting(true);
    try {
      await deleteMyAccount(token);
      clearSession();
      queryClient.clear();
      setDeletePhrase('');
      toast.success(t.accountDeleted);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-content">{t.security}</h2>
        <p className="mt-1 text-sm text-content-muted">{t.securityHint}</p>
      </div>

      <div className="space-y-6 rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-card">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-content-faint">{t.dataPrivacy}</h3>
        <p className="text-sm text-content-muted">{t.exportHint}</p>
        <button
          type="button"
          onClick={handleExport}
          disabled={!token || exporting}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-content transition hover:bg-surface-overlay disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? t.loading : t.exportData}
        </button>

        <div className="border-t border-border-subtle pt-6">
          <div className="mb-3 flex items-start gap-2 text-danger">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">{t.deleteAccount}</p>
              <p className="mt-1 text-sm text-content-muted">{t.deleteHint}</p>
            </div>
          </div>
          <label className="mb-3 block">
            <span className="mb-2 block text-xs font-medium text-content-muted">{t.deleteConfirmLabel}</span>
            <input
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              placeholder="DELETE_MY_ACCOUNT"
              autoComplete="off"
              className="w-full rounded-xl border border-danger/30 bg-surface px-4 py-2 font-mono text-sm text-content focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/30"
            />
          </label>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!token || deleting || deletePhrase !== 'DELETE_MY_ACCOUNT'}
            className="inline-flex items-center gap-2 rounded-xl bg-danger/15 px-4 py-3 text-sm font-semibold text-danger transition hover:bg-danger/25 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? t.loading : t.deleteConfirmButton}
          </button>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-card">
        <label className="flex cursor-pointer items-center gap-4">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
            className="h-4 w-4 rounded border-border-subtle text-accent focus:ring-accent/40"
          />
          <span className="text-sm font-medium text-content">{t.reducedMotion}</span>
        </label>

        <button
          type="button"
          onClick={clearAllLocal}
          className="inline-flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger transition hover:bg-danger/20"
        >
          <Trash2 className="h-4 w-4" />
          {t.clearLocal}
        </button>
      </div>
    </div>
  );
}

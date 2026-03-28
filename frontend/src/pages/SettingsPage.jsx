import { usePreferences } from '../context/PreferencesContext.jsx';

export function SettingsPage() {
  const { lang, setLang, theme, setTheme, t } = usePreferences();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-content">{t.settings}</h2>
        <p className="mt-1 text-sm text-content-muted">{t.settingsHint}</p>
      </div>

      <div className="max-w-md space-y-5 rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-card">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-content-muted">{t.language}</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="ru">Русский</option>
            <option value="kz">Қазақша</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-content-muted">{t.theme}</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="dark">{t.dark}</option>
            <option value="light">{t.light}</option>
          </select>
        </label>
      </div>
    </div>
  );
}

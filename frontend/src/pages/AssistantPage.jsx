import { useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useWeb3Auth } from '../context/Web3AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { postAssistantChat } from '../lib/api.js';
import { getFriendlyError } from '../lib/utils.js';

export function AssistantPage() {
  const { t } = usePreferences();
  const { token } = useWeb3Auth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !token || loading) return;

    const userMsg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const reply = await postAssistantChat(
        token,
        next.filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => ({
          role: m.role,
          content: m.content
        }))
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠ ${getFriendlyError(err, t)}` }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-content">{t.assistantTitle}</h2>
        <p className="text-sm text-content-muted">{t.connectFirst}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[min(75dvh,720px)] flex-col space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-content">{t.assistantTitle}</h2>
        <p className="mt-1 text-sm text-content-muted">{t.assistantHint}</p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised shadow-card">
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          <span className="text-sm font-semibold text-content">{t.assistantBadge}</span>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex justify-start">
            <div className="max-w-[min(100%,42rem)] rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-sm leading-relaxed text-content">
              <p className="whitespace-pre-wrap break-words">{t.assistantWelcome}</p>
            </div>
          </div>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={[
                  'max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-accent text-on-accent'
                    : 'border border-border-subtle bg-surface text-content'
                ].join(' ')}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ))}
          {loading ? (
            <p className="text-sm text-content-muted">{t.assistantThinking}</p>
          ) : null}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSubmit} className="border-t border-border-subtle p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              maxLength={8000}
              placeholder={t.assistantPlaceholder}
              disabled={loading}
              className="min-h-[44px] flex-1 resize-y rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-content placeholder:text-content-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="inline-flex h-11 shrink-0 items-center gap-2 self-end rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {t.assistantSend}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

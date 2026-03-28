import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAddress, isAddress } from 'ethers';
import { MessageCircle, Send } from 'lucide-react';
import { useWeb3Auth } from '../context/Web3AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { fetchChatConversations, fetchChatMessages, postChatMessage } from '../lib/api.js';
import { getFriendlyError, shortAddress } from '../lib/utils.js';

export function MessagesPage() {
  const { t } = usePreferences();
  const { token, wallet } = useWeb3Auth();
  const navigate = useNavigate();
  const { peer: peerParam } = useParams();
  const queryClient = useQueryClient();
  const bottomRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [recipientInput, setRecipientInput] = useState('');

  const peer = useMemo(() => {
    if (!peerParam) return null;
    try {
      return getAddress(peerParam.trim());
    } catch {
      return null;
    }
  }, [peerParam]);

  useEffect(() => {
    if (peerParam && !peer) {
      navigate('/messages', { replace: true });
    }
  }, [peerParam, peer, navigate]);

  const convQuery = useQuery({
    queryKey: ['chat-conversations', token],
    queryFn: () => fetchChatConversations(token),
    enabled: Boolean(token),
    refetchInterval: 5000
  });

  const msgQuery = useQuery({
    queryKey: ['chat-messages', token, peer],
    queryFn: () => fetchChatMessages(token, peer),
    enabled: Boolean(token && peer),
    refetchInterval: 3000
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgQuery.data, peer]);

  const sendMutation = useMutation({
    mutationFn: async ({ to, body }) => postChatMessage(token, { to, body }),
    onSuccess: (_data, variables) => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', token, variables.to] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations', token] });
      navigate(`/messages/${variables.to}`, { replace: true });
    }
  });

  function openPeer(addr) {
    try {
      const a = getAddress(addr);
      navigate(`/messages/${a}`);
    } catch {
      /* ignore */
    }
  }

  function handleStartChat(e) {
    e.preventDefault();
    const raw = recipientInput.trim();
    if (!raw || !isAddress(raw)) return;
    try {
      openPeer(raw);
      setRecipientInput('');
    } catch {
      /* ignore */
    }
  }

  function handleSend(e) {
    e.preventDefault();
    if (!peer || !draft.trim() || sendMutation.isPending) return;
    sendMutation.mutate({ to: peer, body: draft.trim() });
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-content">{t.messenger}</h2>
        <p className="text-sm text-content-muted">{t.connectFirst}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-content">{t.messenger}</h2>
        <p className="mt-1 text-sm text-content-muted">{t.messengerHint}</p>
      </div>

      <div className="flex min-h-[min(70dvh,640px)] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised shadow-card md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-border-subtle md:w-72 md:border-r">
          <form onSubmit={handleStartChat} className="border-b border-border-subtle p-3">
            <label className="block text-xs font-medium text-content-muted">{t.chatRecipient}</label>
            <div className="mt-1 flex gap-2">
              <input
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="0x…"
                className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface px-3 py-2 font-mono text-xs text-content placeholder:text-content-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="submit"
                disabled={!recipientInput.trim() || !isAddress(recipientInput.trim())}
                className="shrink-0 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
              >
                {t.chatOpen}
              </button>
            </div>
          </form>
          <div className="flex-1 overflow-y-auto p-2">
            {convQuery.isLoading ? (
              <p className="px-2 py-3 text-sm text-content-muted">{t.loading}</p>
            ) : (convQuery.data || []).length > 0 ? (
              <ul className="space-y-1">
                {convQuery.data.map((c) => (
                  <li key={c.peer}>
                    <button
                      type="button"
                      onClick={() => openPeer(c.peer)}
                      className={[
                        'flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition',
                        peer === c.peer
                          ? 'bg-accent-muted text-accent'
                          : 'hover:bg-surface-overlay text-content'
                      ].join(' ')}
                    >
                      <span className="font-mono text-sm font-medium">{shortAddress(c.peer)}</span>
                      <span className="mt-0.5 line-clamp-2 text-xs text-content-muted">
                        {c.lastMessage?.fromMe ? `${t.chatYou}: ` : ''}
                        {c.lastMessage?.body || '—'}
                      </span>
                      {c.unreadCount > 0 ? (
                        <span className="mt-1 inline-flex w-fit rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-on-accent">
                          {c.unreadCount > 99 ? '99+' : c.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 py-6 text-center text-sm text-content-muted">{t.noChats}</p>
            )}
          </div>
        </aside>

        <section className="flex min-h-[280px] min-w-0 flex-1 flex-col">
          {!peer ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-content-muted">
              <MessageCircle className="h-10 w-10 opacity-40" aria-hidden />
              <p className="text-sm">{t.selectChat}</p>
            </div>
          ) : (
            <>
              <div className="border-b border-border-subtle px-4 py-3">
                <p className="font-mono text-sm font-semibold text-content">{shortAddress(peer)}</p>
                <p className="text-xs text-content-faint">{peer}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {msgQuery.isLoading ? (
                  <p className="text-sm text-content-muted">{t.loading}</p>
                ) : (msgQuery.data || []).length > 0 ? (
                  msgQuery.data.map((m) => {
                    const mine = m.senderAddress === wallet.account;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={[
                            'max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                            mine
                              ? 'rounded-br-md bg-accent text-on-accent'
                              : 'rounded-bl-md border border-border-subtle bg-surface text-content'
                          ].join(' ')}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p
                            className={`mt-1 text-[10px] ${mine ? 'text-on-accent/80' : 'text-content-faint'}`}
                          >
                            {new Date(m.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-content-muted">{t.noMessagesYet}</p>
                )}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="border-t border-border-subtle p-3">
                {sendMutation.isError ? (
                  <p className="mb-2 text-xs text-danger">{getFriendlyError(sendMutation.error, t)}</p>
                ) : null}
                <div className="flex gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    maxLength={4000}
                    placeholder={t.chatPlaceholder}
                    className="min-h-[44px] flex-1 resize-y rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-content placeholder:text-content-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sendMutation.isPending}
                    className="inline-flex h-11 shrink-0 items-center gap-2 self-end rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    {t.chatSend}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

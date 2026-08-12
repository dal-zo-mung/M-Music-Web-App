import { useEffect, useRef, useState } from 'react';

import type { ApiErrorResponse, SupportChatResponse } from '@shared/types';

import { ApiError, getErrorMessage, postJson } from '../lib/api';

interface ChatLine {
  content: string;
  role: 'assistant' | 'user';
}

const MAX_LINES = 24;

export function SupportChat(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [error, setError] = useState('');
  const [stubNote, setStubNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent): void {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (panelRef.current?.contains(target)) {
        return;
      }

      const launcher = document.querySelector('.support-chat__launcher');

      if (launcher?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const node = listRef.current;

    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [isOpen, lines]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed || isSending) {
      return;
    }

    const nextUserLine: ChatLine = { content: trimmed, role: 'user' };
    const history = [...lines, nextUserLine].slice(-MAX_LINES);
    setLines(history);
    setInput('');
    setError('');
    setStubNote('');
    setIsSending(true);

    try {
      const payload = {
        messages: history.map((line) => ({ content: line.content, role: line.role }))
      };

      const response = await postJson<SupportChatResponse>('/api/support/chat', payload);

      setLines((previous) =>
        [...previous, { content: response.reply, role: 'assistant' as const }].slice(-MAX_LINES)
      );
      setStubNote(
        response.stub
          ? 'This is a fallback response from the server. If it keeps happening, verify GROQ_API_KEY and server network access to Groq.'
          : ''
      );
    } catch (sendError) {
      const normalized =
        sendError instanceof ApiError ? (sendError as ApiError<ApiErrorResponse>) : new ApiError('Chat failed.', 500, null);

      setError(getErrorMessage(normalized.payload, normalized.message));
      setLines((previous) => previous.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  }

  function handleChatInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    event.preventDefault();
    const trimmed = input.trim();

    if (trimmed && !isSending) {
        formRef.current?.requestSubmit();
      }
    }
  return (
    <div className="support-chat">
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Help & support chat"
        className="support-chat__launcher"
        type="button"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span aria-hidden="true" className="support-chat__launcher-icon">
          ?
        </span>
      </button>

      {isOpen ? (
        <div
          aria-label="Support chat"
          className="support-chat__panel"
          ref={panelRef}
          role="dialog"
        >
          <header className="support-chat__header">
            <h2 >Help &amp; support</h2>
            <button aria-label="Close help chat" className="icon-button icon-button--ghost" type="button" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </header>
          <div className="support-chat__messages" ref={listRef}>
            {lines.map((line, index) => (
              <div className={`support-chat__line support-chat__line--${line.role}`} key={`${line.role}-${index}`}>
                {line.content}
              </div>
            ))}
          </div>
          {stubNote ? <p className="form-message form-message--info">{stubNote}</p> : null}
          {error ? <p className="form-message form-message--error">{error}</p> : null}
          <form className="support-chat__form" onSubmit={handleSend} ref={formRef}>
            <label className="support-chat__sr-only" htmlFor="support-chat-input">
              Message
            </label>
            <div className="support-chat__input-row">
              <textarea
                className="support-chat__input"
                id="support-chat-input"
                maxLength={2000}
                placeholder="Ask a question…"
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleChatInputKeyDown}
              />
              <button
                className="support-chat__send-btn"
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label={isSending ? 'Sending…' : 'Send'}
              >
                {isSending ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 2 11 13" />
                    <path d="M22 2 15 22 11 13 2 9l20-7z" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

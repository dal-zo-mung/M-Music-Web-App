import { useEffect, useRef, useState, type CSSProperties } from "react";

import type { ApiErrorResponse, SupportChatResponse } from "@shared/types";

import { ApiError, getErrorMessage, postJson } from "../lib/api";

interface ChatLine {
  content: string;
  role: "assistant" | "user";
}

const MAX_LINES = 24;
const SUGGESTIONS = [
  { label: "Find a song", prompt: "How can I find a song in M-Music?" },
  {
    label: "Read lyrics",
    prompt: "How do I change the lyrics size and scrolling speed?",
  },
  { label: "Save favorites", prompt: "How can I save my favorite songs?" },
];

function ChatIcon({
  name,
}: {
  name: "chat" | "close" | "send" | "arrow";
}): React.JSX.Element {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {name === "chat" ? (
        <>
          <path d="M20 11.5V16a4 4 0 0 1-4 4H9l-5 2v-5a4 4 0 0 1-2-3.5V8a4 4 0 0 1 4-4h6" />
          <path d="m18 2 1.2 3.8L23 7l-3.8 1.2L18 12l-1.2-3.8L13 7l3.8-1.2L18 2Z" />
          <path d="M7 11h3m-3 4h7" />
        </>
      ) : null}
      {name === "close" ? <path d="m6 6 12 12M6 18 18 6" /> : null}
      {name === "send" ? <path d="M12 19V5m-6 6 6-6 6 6" /> : null}
      {name === "arrow" ? <path d="M5 12h14m-5-5 5 5-5 5" /> : null}
    </svg>
  );
}

function AssistantMessage({ content }: { content: string }): React.JSX.Element {
  return (
    <>
      {content.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g).map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={index}>{part.slice(1, -1)}</code>;
        }
        return part;
      })}
    </>
  );
}

export function SupportChat(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [viewportStyle, setViewportStyle] = useState<CSSProperties>({});
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  function closeChat(): void {
    restoreFocusRef.current = true;
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) {
      if (restoreFocusRef.current) {
        launcherRef.current?.focus();
        restoreFocusRef.current = false;
      }
      return;
    }
    panelRef.current?.focus({ preventScroll: true });
    const viewport = window.visualViewport;
    if (!viewport) return;
    function updateViewport(): void {
      if (!viewport) return;
      setViewportStyle({
        "--chat-viewport-height": `${viewport.height}px`,
        "--chat-viewport-bottom": `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
      } as CSSProperties);
    }
    updateViewport();
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);
    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
    };
  }, [isOpen]);

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

      if (launcherRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const node = listRef.current;

    if (node) {
      node.scrollTop = lines.length || error ? node.scrollHeight : 0;
    }
  }, [isOpen, lines, isSending, error]);

  async function handleSend(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed || isSending) {
      return;
    }

    const nextUserLine: ChatLine = { content: trimmed, role: "user" };
    const history = [...lines, nextUserLine].slice(-MAX_LINES);
    setLines(history);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const payload = {
        messages: history.map((line) => ({
          content: line.content,
          role: line.role,
        })),
      };

      const response = await postJson<SupportChatResponse>(
        "/api/support/chat",
        payload,
      );

      setLines((previous) =>
        [
          ...previous,
          {
            content: response.stub
              ? "I’m temporarily unavailable. Please try again shortly. You can still find songs with the library search."
              : response.reply,
            role: "assistant" as const,
          },
        ].slice(-MAX_LINES),
      );
    } catch (sendError) {
      const normalized =
        sendError instanceof ApiError
          ? (sendError as ApiError<ApiErrorResponse>)
          : new ApiError("Chat failed.", 500, null);

      setError(getErrorMessage(normalized.payload, normalized.message));
      setLines((previous) => previous.slice(0, -1));
      setInput((draft) => draft || trimmed);
    } finally {
      setIsSending(false);
    }
  }

  function handleChatInputKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ): void {
    if (
      event.key !== "Enter" ||
      event.nativeEvent.isComposing ||
      event.shiftKey ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    event.preventDefault();
    const trimmed = input.trim();

    if (trimmed && !isSending) {
      formRef.current?.requestSubmit();
    }
  }
  return (
    <div
      className={`support-chat ${isOpen ? "support-chat--open" : ""}`}
      style={viewportStyle}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Help & support chat"
        aria-controls={isOpen ? "support-chat-panel" : undefined}
        className="support-chat__launcher"
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen((value) => !value)}
      >
        <ChatIcon name={isOpen ? "close" : "chat"} />
      </button>

      {isOpen ? (
        <div
          aria-labelledby="support-chat-title"
          className="support-chat__panel"
          id="support-chat-panel"
          ref={panelRef}
          role="dialog"
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              closeChat();
            }
          }}
        >
          <header className="support-chat__header">
            <span className="support-chat__avatar">
              <ChatIcon name="chat" />
            </span>
            <div className="support-chat__heading">
              <h2 id="support-chat-title">
                M-Music
              </h2>
              <p>Your music library guide</p>
            </div>
            <button
              aria-label="Close help chat"
              className="support-chat__close"
              type="button"
              onClick={closeChat}
            >
              <ChatIcon name="close" />
            </button>
          </header>
          <div className="support-chat__messages" ref={listRef}>
            {lines.length === 0 ? (
              <div className="support-chat__welcome">
                <h3>What can I help with?</h3>
                <p>Find your way around songs, lyrics, and your favorites.</p>
                <div
                  className="support-chat__suggestions"
                  aria-label="Suggested questions"
                >
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion.label}
                      onClick={() => {
                        setInput(suggestion.prompt);
                        inputRef.current?.focus();
                      }}
                    >
                      <span>{suggestion.label}</span>
                      <ChatIcon name="arrow" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div
              className="support-chat__conversation"
              role="log"
              aria-label="Conversation"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={isSending}
            >
              {lines.map((line, index) => (
                <div
                  className={`support-chat__line support-chat__line--${line.role}`}
                  key={`${line.role}-${index}`}
                >
                  <span className="support-chat__speaker">
                    {line.role === "assistant" ? "M-Music AI" : "You"}
                  </span>
                  <p>
                    {line.role === "assistant" ? (
                      <AssistantMessage content={line.content} />
                    ) : (
                      line.content
                    )}
                  </p>
                </div>
              ))}
            </div>
            {isSending ? (
              <div className="support-chat__typing" role="status">
                <span aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>M-Music AI is thinking…</span>
              </div>
            ) : null}
            {error ? (
              <p className="support-chat__error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <form
            className="support-chat__form"
            onSubmit={handleSend}
            ref={formRef}
          >
            <label
              className="support-chat__sr-only"
              htmlFor="support-chat-input"
            >
              Message
            </label>
            <div className="support-chat__input-row">
              <textarea
                className="support-chat__input"
                id="support-chat-input"
                ref={inputRef}
                maxLength={2000}
                placeholder="Ask about M-Music…"
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleChatInputKeyDown}
              />
              <button
                className="support-chat__send-btn"
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label={isSending ? "Sending…" : "Send"}
              >
                {isSending ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <ChatIcon name="send" />
                )}
              </button>
            </div>
            <div className="support-chat__input-meta">
              <span>Shift + Enter for a new line</span>
              <span aria-label={`${input.length} of 2000 characters`}>
                {input.length} / 2000
              </span>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";

import useSWR from "swr";

import type {
  ApiErrorResponse,
  CommunityFeedResponse,
  CommunitySubmissionPayload,
} from "@shared/types";

import { useAuth } from "../context/AuthContext";
import { buildReturnTo } from "../lib/auth";
import { ApiError, fetchJson, getErrorMessage, postJson } from "../lib/api";

function isObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const emptyForm: CommunitySubmissionPayload = {
  artist: "",
  description: "",
  lyrics: "",
  releasedDate: "",
  title: "",
  youtubeUrl: "",
};

export function CommunityPage(): React.JSX.Element {
  const { currentUser } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<CommunityFeedResponse>(
    "/api/community/submissions",
    fetchJson,
  );
  const [form, setForm] = useState<CommunitySubmissionPayload>(emptyForm);
  const [formMessage, setFormMessage] = useState("");
  const [formTone, setFormTone] = useState<"error" | "info" | "success">(
    "info",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    setIsSubmitting(true);
    setFormMessage("Publishing…");
    setFormTone("info");

    try {
      await postJson("/api/community/submissions", form);
      setForm(emptyForm);
      setFormMessage("Your lyric post is live.");
      setFormTone("success");
      await mutate();
    } catch (submitError) {
      const normalized =
        submitError instanceof ApiError
          ? (submitError as ApiError<ApiErrorResponse>)
          : new ApiError("Could not publish.", 500, null);

      setFormMessage(getErrorMessage(normalized.payload, normalized.message));
      setFormTone("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="community-page">
      <div className="community-shell">
        <header className="community-hero">
          <p className="section-eyebrow">User community</p>
          <h1>Share lyrics and discuss tracks together</h1>
          <p className="muted-copy">
            Posts and comments are rate-limited, checked for unsafe patterns on
            the server, and require a signed-in account with CSRF protection on
            every write—similar in spirit to collaborative lyric sites, with
            discussion attached to each submission.
          </p>
        </header>

        {currentUser ? (
          <section
            className="community-card community-card--compose"
            aria-labelledby="compose-heading"
          >
            <h2 id="compose-heading">Add a lyric contribution</h2>
            <p className="muted-copy community-card__hint">
              Paste lyrics line-by-line in the box (one verse per line is fine).
              Optional YouTube links are restricted to known YouTube hostnames
              on the server.
            </p>

            <form className="community-compose-form" onSubmit={handleSubmit}>
              <div className="split-fields">
                <label className="field">
                  <span>Song title</span>
                  <input
                    autoComplete="off"
                    maxLength={120}
                    required
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Artist</span>
                  <input
                    autoComplete="off"
                    maxLength={120}
                    required
                    type="text"
                    value={form.artist}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        artist: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>Released / era (optional)</span>
                <input
                  autoComplete="off"
                  maxLength={40}
                  type="text"
                  value={form.releasedDate}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      releasedDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>Context or notes (optional)</span>
                <textarea
                  className="community-textarea community-textarea--short"
                  maxLength={500}
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>Lyrics</span>
                <textarea
                  className="community-textarea"
                  required
                  rows={12}
                  value={form.lyrics}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      lyrics: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>YouTube URL (optional)</span>
                <input
                  autoComplete="off"
                  placeholder="https://www.youtube.com/watch?v=…"
                  type="url"
                  value={form.youtubeUrl}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      youtubeUrl: event.target.value,
                    }))
                  }
                />
              </label>

              <p className={`form-message form-message--${formTone}`}>
                {formMessage}
              </p>

              <div className="community-compose-actions">
                <button
                  className="button button--secondary"
                  disabled={isSubmitting}
                  type="reset"
                  onClick={() => setForm(emptyForm)}
                >
                  Clear
                </button>
                <button
                  className="button"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Publishing…" : "Publish post"}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="community-card community-card--notice">
            <h2>Sign in to contribute</h2>
            <p className="muted-copy">
              Reading the feed is open to everyone. Adding lyrics or comments
              requires an account so activity can be attributed and rate-limited
              fairly.
            </p>
            <Link
              className="button"
              to={`/login?returnTo=${encodeURIComponent(buildReturnTo({ pathname: "/community", search: "" }))}`}
            >
              Log in to post
            </Link>
          </section>
        )}

        {data?.mine && data.mine.length > 0 ? (
          <section className="community-section" aria-labelledby="mine-heading">
            <h2 id="mine-heading">Your recent posts</h2>
            <ul className="community-feed">
              {data.mine.map((item) => (
                <li key={item._id}>
                  <Link
                    className="community-feed-card"
                    to={isObjectId(item._id) ? `/community/${item._id}` : "#"}
                  >
                    <div className="community-feed-card__title">
                      {item.title}
                    </div>
                    <div className="community-feed-card__meta">
                      {item.artist} · {formatWhen(item.createdAt)}
                      {item.status === "published" ? (
                        <span> · {item.commentCount} comments</span>
                      ) : (
                        <span> · {item.status}</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="community-section" aria-labelledby="feed-heading">
          <h2 id="feed-heading">Latest community posts</h2>

          {isLoading ? (
            <p className="muted-copy">Loading community feed…</p>
          ) : null}
          {error ? (
            <p className="form-message form-message--error">
              Could not load the community feed.
            </p>
          ) : null}

          {!isLoading && data?.items.length === 0 ? (
            <p className="empty-panel">
              No community posts yet. Be the first to share lyrics.
            </p>
          ) : null}

          {data?.items.length ? (
            <ul className="community-feed">
              {data.items.map((item) => (
                <li key={item._id}>
                  <Link
                    className="community-feed-card"
                    to={isObjectId(item._id) ? `/community/${item._id}` : "#"}
                  >
                    <div className="community-feed-card__title">
                      {item.title}
                    </div>
                    <div className="community-feed-card__meta">
                      {item.artist} · by {item.author.label} ·{" "}
                      {formatWhen(item.createdAt)} · {item.commentCount}{" "}
                      comments
                    </div>
                    {item.description ? (
                      <p className="community-feed-card__snippet">
                        {item.description}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </main>
  );
}

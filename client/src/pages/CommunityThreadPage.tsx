import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import useSWR from "swr";

import type {
  ApiErrorResponse,
  CommunityCommentPayload,
  CommunitySubmissionDetailResponse,
} from "@shared/types";

import { useAuth } from "../context/AuthContext";
import { buildReturnTo } from "../lib/auth";
import { ApiError, fetchJson, getErrorMessage, postJson } from "../lib/api";

function isObjectId(value: string | undefined): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
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

function roleLabel(role: string): string | null {
  if (role === "admin" || role === "moderator") {
    return role;
  }

  return null;
}

export function CommunityThreadPage(): React.JSX.Element {
  const { submissionId = "" } = useParams();
  const { currentUser } = useAuth();
  const detailUrl = isObjectId(submissionId)
    ? `/api/community/submissions/${submissionId}`
    : null;
  const { data, error, isLoading, mutate } =
    useSWR<CommunitySubmissionDetailResponse>(detailUrl, fetchJson);
  const [commentBody, setCommentBody] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [commentTone, setCommentTone] = useState<"error" | "info" | "success">(
    "info",
  );
  const [isPostingComment, setIsPostingComment] = useState(false);

  async function handleCommentSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!isObjectId(submissionId) || !currentUser) {
      return;
    }

    const payload: CommunityCommentPayload = { body: commentBody };

    setIsPostingComment(true);
    setCommentMessage("Posting…");
    setCommentTone("info");

    try {
      await postJson(
        `/api/community/submissions/${submissionId}/comments`,
        payload,
      );
      setCommentBody("");
      setCommentMessage("Comment posted.");
      setCommentTone("success");
      await mutate();
    } catch (postError) {
      const normalized =
        postError instanceof ApiError
          ? (postError as ApiError<ApiErrorResponse>)
          : new ApiError("Comment failed.", 500, null);

      setCommentMessage(
        getErrorMessage(normalized.payload, normalized.message),
      );
      setCommentTone("error");
    } finally {
      setIsPostingComment(false);
    }
  }

  if (!isObjectId(submissionId)) {
    return (
      <main className="community-page">
        <div className="community-shell">
          <p className="form-message form-message--error">
            That community link is not valid.
          </p>
          <Link className="text-link" to="/community">
            Back to community
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="community-page">
      <div className="community-shell community-shell--thread">
        <nav aria-label="Breadcrumb" className="community-breadcrumb">
          <Link className="text-link" to="/community">
            ← Community feed
          </Link>
        </nav>

        {isLoading ? <p className="muted-copy">Loading discussion…</p> : null}
        {error ? (
          <p className="form-message form-message--error">
            This post may have been removed or the link is wrong.
          </p>
        ) : null}

        {data ? (
          <>
            <article className="community-card community-thread">
              <header className="community-thread__header">
                <h1>{data.submission.title}</h1>
                <p className="community-thread__meta muted-copy">
                  {data.submission.artist}
                  {data.submission.releasedDate ? (
                    <> · {data.submission.releasedDate}</>
                  ) : null}
                  {" · "}
                  Posted {formatWhen(data.submission.createdAt)} by{" "}
                  {data.submission.author.label}
                  {roleLabel(data.submission.author.role) ? (
                    <span className="community-role-pill">
                      {roleLabel(data.submission.author.role)}
                    </span>
                  ) : null}
                </p>
                {data.submission.youtubeUrl ? (
                  <p>
                    <a
                      className="text-link"
                      href={data.submission.youtubeUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Open referenced YouTube video
                    </a>
                  </p>
                ) : null}
              </header>

              {data.submission.description ? (
                <section
                  className="community-thread__notes"
                  aria-label="Contributor notes"
                >
                  <h2 className="community-thread__subheading">Notes</h2>
                  <p className="community-thread__notes-body">
                    {data.submission.description}
                  </p>
                </section>
              ) : null}

              <section className="community-thread__lyrics" aria-label="Lyrics">
                <h2 className="community-thread__subheading">Lyrics</h2>
                <pre className="community-thread__lyrics-text">
                  {data.submission.lyrics.join("\n")}
                </pre>
              </section>
            </article>

            <section
              className="community-card community-comments"
              aria-labelledby="comments-heading"
            >
              <h2 id="comments-heading">Discussion ({data.comments.length})</h2>
              <p className="muted-copy community-card__hint">
                Comments are newest first. Be respectful; moderators can remove
                abusive posts on the server side.
              </p>

              <ul className="community-comment-list">
                {data.comments.map((comment) => (
                  <li key={comment._id} className="community-comment">
                    <div className="community-comment__header">
                      <span className="community-comment__author">
                        {comment.author.label}
                      </span>
                      {roleLabel(comment.author.role) ? (
                        <span className="community-role-pill">
                          {roleLabel(comment.author.role)}
                        </span>
                      ) : null}
                      <span className="community-comment__time">
                        {formatWhen(comment.createdAt)}
                      </span>
                    </div>
                    <p className="community-comment__body">{comment.body}</p>
                  </li>
                ))}
              </ul>

              {currentUser ? (
                <form
                  className="community-comment-form"
                  onSubmit={handleCommentSubmit}
                >
                  <label className="field" htmlFor="community-comment">
                    <span>Add a comment</span>
                    <textarea
                      className="community-textarea community-textarea--short"
                      id="community-comment"
                      maxLength={1200}
                      required
                      rows={4}
                      value={commentBody}
                      onChange={(event) => setCommentBody(event.target.value)}
                    />
                  </label>
                  <p className={`form-message form-message--${commentTone}`}>
                    {commentMessage}
                  </p>
                  <button
                    className="button"
                    disabled={isPostingComment}
                    type="submit"
                  >
                    {isPostingComment ? "Posting…" : "Post comment"}
                  </button>
                </form>
              ) : (
                <p className="muted-copy">
                  <Link
                    className="text-link"
                    to={`/login?returnTo=${encodeURIComponent(buildReturnTo({ pathname: `/community/${submissionId}`, search: "" }))}`}
                  >
                    Log in
                  </Link>{" "}
                  to join the discussion.
                </p>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

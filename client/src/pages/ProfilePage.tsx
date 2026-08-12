import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import useSWR from 'swr';
import type { ApiErrorResponse, ProfileAccent, PublicUser, SongRecord } from '@shared/types';
import { PROFILE_ACCENTS } from '@shared/types';

import { useAuth } from '../context/AuthContext';
import { buildReturnTo, buildSongPath } from '../lib/auth';
import { ApiError, deleteJson, fetchJson, getErrorMessage, patchJson } from '../lib/api';

interface ProfileSaveResponse {
  message?: string;
  success: boolean;
  user?: PublicUser;
}

const ACCENT_LABELS: Record<ProfileAccent, string> = {
  aurora: 'Aurora',
  default: 'Classic',
  ember: 'Ember',
  meadow: 'Meadow',
  slate: 'Slate'
};

function buildFormState(user: PublicUser): {
  about: string;
  accentKey: ProfileAccent;
  displayName: string;
  firstName: string;
  lastName: string;
  tagline: string;
} {
  return {
    about: user.about ?? '',
    accentKey: user.accentKey,
    displayName: user.displayName ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    tagline: user.tagline ?? ''
  };
}

export function ProfilePage(): React.JSX.Element {
  const { currentUser, isLoading, refreshAuth } = useAuth();
  const [form, setForm] = useState(() =>
    currentUser
      ? buildFormState(currentUser)
      : {
          about: '',
          accentKey: 'default' as ProfileAccent,
          displayName: '',
          firstName: '',
          lastName: '',
          tagline: ''
        }
  );
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'error' | 'info' | 'success'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingFavorite, setIsRemovingFavorite] = useState(false);
  const { data: favorites = [], mutate: refreshFavorites, isLoading: favoritesLoading } = useSWR<
    SongRecord[]
  >(currentUser ? '/api/songs/favorites' : null, fetchJson);

  useEffect(() => {
    if (currentUser) {
      setForm(buildFormState(currentUser));
    }
  }, [currentUser]);

  const previewAccent = form.accentKey;

  const returnToLogin = useMemo(
    () => `/login?returnTo=${encodeURIComponent(buildReturnTo({ pathname: '/profile', search: '' }))}`,
    []
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    setIsSaving(true);
    setMessage('Saving…');
    setTone('info');

    try {
      await patchJson<ProfileSaveResponse>('/api/me/profile', {
        about: form.about,
        accentKey: form.accentKey,
        displayName: form.displayName.trim() || null,
        firstName: form.firstName,
        lastName: form.lastName,
        tagline: form.tagline
      });

      await refreshAuth();
      setMessage('Profile updated.');
      setTone('success');
    } catch (error) {
      const normalized =
        error instanceof ApiError ? (error as ApiError<ApiErrorResponse>) : new ApiError('Save failed.', 500, null);

      setMessage(getErrorMessage(normalized.payload, normalized.message));
      setTone('error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveFavorite(songId: string): Promise<void> {
    setIsRemovingFavorite(true);

    try {
      await deleteJson(`/api/songs/${songId}/favorite`);
      await refreshFavorites();
      setMessage('Saved songs updated.');
      setTone('success');
    } catch {
      setMessage('Unable to remove saved song. Please try again.');
      setTone('error');
    } finally {
      setIsRemovingFavorite(false);
    }
  }

  if (isLoading) {
    return (
      <main className="profile-page profile-page--accent-default">
        <div className="profile-shell">
          <p className="muted-copy">Loading profile…</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="profile-page profile-page--accent-default">
        <div className="profile-shell">
          <h1>Your profile</h1>
          <p className="muted-copy">Sign in to edit your public details, about text, and page theme.</p>
          <Link className="button" to={returnToLogin}>
            Log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`profile-page profile-page--accent-${previewAccent}`}>
      <div className="profile-shell">
        <header className="profile-hero">
          <p className="section-eyebrow">Account</p>
          <h1>Profile &amp; appearance</h1>
          <p className="muted-copy">
            Choose a page accent, tune how your name appears, and write an optional about section. Updates stay on this
            site and go through the same CSRF and rate limits as other writes.
          </p>
        </header>

        <section className={`profile-card profile-card--preview profile-card--accent-${previewAccent}`} aria-label="Accent preview">
          <div className="profile-preview__avatar" aria-hidden="true">
            {currentUser.profileImage ? (
              <img alt="" src={currentUser.profileImage} />
            ) : (
              <span>{(currentUser.username || currentUser.displayName || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 className="profile-preview__title">
              {form.displayName.trim() ||
                currentUser.username ||
                currentUser.displayName ||
                [form.firstName, form.lastName].filter(Boolean).join(' ') ||
                'Your name'}
            </h2>
            {form.tagline.trim() ? <p className="profile-preview__tagline">{form.tagline.trim()}</p> : null}
            {currentUser.username ? <p className="muted-copy profile-preview__username">@{currentUser.username}</p> : null}
            <p className="profile-preview__provider">
              Signed in with {currentUser.authProvider === 'google' ? 'Google' : 'email'}
            </p>
          </div>
        </section>

        <form className="profile-card profile-form" onSubmit={handleSubmit}>
          <h2 className="profile-form__heading">Edit details</h2>

          <label className="field">
            <span>Display name</span>
            <input
              autoComplete="nickname"
              maxLength={80}
              type="text"
              value={form.displayName}
              onChange={(event) => setForm((previous) => ({ ...previous, displayName: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Tagline (optional)</span>
            <input
              autoComplete="off"
              maxLength={140}
              placeholder="e.g. Indie · piano covers · night playlists"
              type="text"
              value={form.tagline}
              onChange={(event) => setForm((previous) => ({ ...previous, tagline: event.target.value }))}
            />
          </label>

          <div className="split-fields">
            <label className="field">
              <span>First name</span>
              <input
                autoComplete="given-name"
                maxLength={50}
                type="text"
                value={form.firstName}
                onChange={(event) => setForm((previous) => ({ ...previous, firstName: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Last name</span>
              <input
                autoComplete="family-name"
                maxLength={50}
                type="text"
                value={form.lastName}
                onChange={(event) => setForm((previous) => ({ ...previous, lastName: event.target.value }))}
              />
            </label>
          </div>

          <fieldset className="profile-accents">
            <legend>Page accent</legend>
            <div className="profile-accents__grid">
              {PROFILE_ACCENTS.map((accent) => (
                <label className={`profile-accent-option${form.accentKey === accent ? ' profile-accent-option--active' : ''}`} key={accent}>
                  <input
                    checked={form.accentKey === accent}
                    name="accent"
                    type="radio"
                    value={accent}
                    onChange={() => setForm((previous) => ({ ...previous, accentKey: accent }))}
                  />
                  <span>{ACCENT_LABELS[accent]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="field">
            <span>About you</span>
            <textarea
              className="community-textarea community-textarea--short"
              maxLength={1600}
              placeholder="Share a short bio, favorite genres, or how you use M-Music."
              rows={6}
              value={form.about}
              onChange={(event) => setForm((previous) => ({ ...previous, about: event.target.value }))}
            />
          </label>

          <p className={`form-message form-message--${tone}`}>{message}</p>

          <div className="profile-form__actions">
            <button className="button" disabled={isSaving} type="submit">
              {isSaving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>

        <section className="profile-card profile-card--saved" aria-label="Saved songs">
          <div className="profile-card__header">
            <p className="section-eyebrow">Favorites</p>
            <h2>Saved songs</h2>
          </div>

          {favoritesLoading ? (
            <p className="muted-copy">Loading saved songs…</p>
          ) : favorites.length === 0 ? (
            <p className="muted-copy">
              Save songs from the detail page to access them here anytime.
            </p>
          ) : null}

          <div className="saved-song-list">
            {favorites.map((song) => (
              <div className="saved-song-item" key={song._id}>
                <Link className="search-result-card" to={buildSongPath(song._id)}>
                  <h3>{song['Song Title'] || 'Untitled song'}</h3>
                  <p>{song.Artist}</p>
                </Link>
                <button
                  className="button button--secondary"
                  disabled={isRemovingFavorite}
                  type="button"
                  onClick={() => handleRemoveFavorite(song._id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

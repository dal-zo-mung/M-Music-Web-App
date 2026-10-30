import type { PublicUser } from "@shared/types";

export function ProfileSummary({
  user,
  onEdit,
}: {
  user: PublicUser;
  onEdit?: () => void;
}): React.JSX.Element {
  const fullName = [user.firstName, user.lastName]
    .map((name) => name?.trim())
    .filter(Boolean)
    .join(" ");
  const displayName = user.displayName?.trim() || fullName || user.username || "Your name";
  const about = user.about?.trim();

  return (
    <section
      className={`profile-card profile-card--preview profile-card--accent-${user.accentKey}`}
      aria-label="Your profile details"
    >
      <div className="profile-preview__avatar" aria-hidden="true">
        {user.profileImage ? (
          <img alt="" src={user.profileImage} />
        ) : (
          <span>{displayName.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="profile-preview__content">
        <h2 className="profile-preview__title">{displayName}</h2>
        {fullName && fullName !== displayName && (
          <p className="profile-preview__name">{fullName}</p>
        )}
        {user.tagline?.trim() && <p className="profile-preview__tagline">{user.tagline.trim()}</p>}
        {user.username && <p className="muted-copy profile-preview__username">@{user.username}</p>}
        <p className="profile-preview__provider">
          Signed in with {user.authProvider === "google" ? "Google" : "email"}
        </p>
      </div>
      {onEdit && (
        <button
          className="button button--secondary profile-preview__edit"
          type="button"
          aria-expanded={false}
          aria-controls="profile-edit-form"
          onClick={onEdit}
        >
          Edit profile
        </button>
      )}
      {about && (
        <div className="profile-preview__about">
          <h3>About me</h3>
          <p>{about}</p>
        </div>
      )}
    </section>
  );
}

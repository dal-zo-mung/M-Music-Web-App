const COMMUNITY_LINKS = [
  {
    name: "Facebook",
    label: "Follow M-Music",
    description:
      "Song updates, announcements, new releases, and a place to share ideas with the community.",
    url:
      import.meta.env.VITE_FACEBOOK_URL?.trim() || "https://www.facebook.com/profile.php?id=61550508762078",
    icon: "facebook",
  },
  {
    name: "Telegram",
    label: "Join the channel",
    description:
      "Get the latest M-Music announcements, song updates, and new releases.",
    url: import.meta.env.VITE_TELEGRAM_URL?.trim() || "https://t.me/+r6Fc1yMBkQ44MjQ9",
    icon: "telegram",
  },
] as const;

function SocialIcon({ type }: { type: "facebook" | "telegram" }) {
  if (type === "facebook") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M14.2 8.3V6.8c0-.7.5-.9.9-.9h2.3V2.1L14.2 2c-3.6 0-4.4 2.7-4.4 4.4v1.9H7.5v4.3h2.3V22h4.4v-9.4h3l.4-4.3h-3.4Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m21.4 3.4-3.1 16.1c-.2 1.1-.9 1.4-1.8.9l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.4-.1-.6-.6-.2L6 13.4l-4.8-1.5c-1-.3-1.1-1 .2-1.5L20 3.2c.9-.3 1.6.2 1.4 1.2Z" />
    </svg>
  );
}

export function CommunityPage(): React.JSX.Element {
  return (
    <main className="library-community" id="main-content">
      <div className="community-shell">
        <header className="community-heading">
          <p className="community-heading__eyebrow">M-MUSIC COMMUNITY</p>
          <h1>Stay connected with M-Music.</h1>
          <p>
              Follow the community for song updates, announcements, new releases, communication with each other, and suggestions.         
          </p>
        </header>

        <div className="community-links" aria-label="M-Music social links">
          {COMMUNITY_LINKS.map((link) => (
            <a
              className={`community-link community-link--${link.icon}`}
              href={link.url}
              key={link.name}
              rel="noreferrer"
              target="_blank"
            >
              <span className="community-link__icon">
                <SocialIcon type={link.icon} />
              </span>
              <span className="community-link__copy">
                <small>{link.label}</small>
                <strong>{link.name}</strong>
                <span>{link.description}</span>
              </span>
              <span className="community-link__arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

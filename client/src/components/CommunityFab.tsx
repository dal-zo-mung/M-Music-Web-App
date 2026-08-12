import { Link, useLocation } from 'react-router-dom';

export function CommunityFab(): React.JSX.Element {
  const location = useLocation();
  const onCommunity =
    location.pathname === '/community' || location.pathname.startsWith('/community/');

  return (
    <Link
      aria-current={onCommunity ? 'page' : undefined}
      aria-label="Open the community lyrics hub"
      className={`community-fab${onCommunity ? ' community-fab--active' : ''}`}
      title="Community lyrics — share and discuss"
      to="/community"
    >
      <span aria-hidden="true" className="community-fab__glyph">
        ♪
      </span>
      <span className="community-fab__label">Community</span>
    </Link>
  );
}

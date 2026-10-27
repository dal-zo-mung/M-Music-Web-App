import { useLocation } from "react-router-dom";

import type { PublicUser } from "@shared/types";

import { buildReturnTo } from "../lib/auth";
import { PageLink } from "./PageLink";

interface UserMenuProps {
  currentUser: PublicUser | null;
  isLoading: boolean;
}

function getUserLabel(user: PublicUser): string {
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return user.username || user.displayName || fullName || "User";
}

export function UserMenu({
  currentUser,
  isLoading,
}: UserMenuProps): React.JSX.Element {
  const location = useLocation();

  if (!currentUser) {
    return (
      <PageLink
        className="pill-link"
        to={`/login?returnTo=${encodeURIComponent(buildReturnTo(location))}`}
      >
        {isLoading ? "Checking..." : "Login / Sign up"}
      </PageLink>
    );
  }

  const displayName = getUserLabel(currentUser);

  return (
    <div className="user-menu">
      <PageLink className="user-menu__trigger" to="/profile">
        <span className="user-menu__avatar" aria-hidden="true">
          {currentUser.profileImage ? (
            <img alt="" src={currentUser.profileImage} />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </span>
        <span className="user-menu__label">{displayName}</span>
      </PageLink>
    </div>
  );
}

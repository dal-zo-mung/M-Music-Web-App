import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Lightweight reassurance that a server-side session exists for signed-in users.
 * Does not expose cookie values (those remain HTTP-only on the session cookie).
 */
export function SessionStatusChip(): React.JSX.Element | null {
  const { currentUser, isLoading } = useAuth();

  if (isLoading || !currentUser) {
    return null;
  }

  return (
    <Link
      className="session-status-chip"
      title="Go to your profile."
      to="/profile"
    >
      <span aria-hidden="true" className="session-status-chip__dot" />
      <span>Session active</span>
    </Link>
  );
}

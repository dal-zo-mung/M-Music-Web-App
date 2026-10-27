import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  type LinkProps,
  type NavLinkProps,
} from "react-router-dom";

import { supportsViewTransitions } from "../lib/motion";

export function PageLink({
  viewTransition,
  ...props
}: LinkProps): React.JSX.Element {
  return (
    <RouterLink
      {...props}
      viewTransition={viewTransition ?? supportsViewTransitions()}
    />
  );
}

export function PageNavLink({
  viewTransition,
  ...props
}: NavLinkProps): React.JSX.Element {
  return (
    <RouterNavLink
      {...props}
      viewTransition={viewTransition ?? supportsViewTransitions()}
    />
  );
}

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { PageLink, PageNavLink } from "./PageLink";
import { ThemeIcon } from "./ThemeIcon";
import { UserMenu } from "./UserMenu";

export function Header(): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const { currentUser, isLoading } = useAuth();
  const preferences = usePreferences();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.key]);
  useEffect(() => {
    function outside(event: PointerEvent): void {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    function escape(event: KeyboardEvent): void {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);

  return (
    <header className="library-header" ref={headerRef}>
      <PageLink className="library-brand" to="/" aria-label="M-Music song library">
        M-Music
      </PageLink>
      <button
        className="library-mobile-menu"
        ref={menuButton}
        type="button"
        aria-label="Menu"
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span className="library-mobile-menu__label">Menu</span>
        <span aria-hidden="true">☰</span>
      </button>
      <nav
        id="main-navigation"
        aria-label="Main navigation"
        className={`library-topnav ${menuOpen ? "is-open" : ""}`}
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget) &&
            event.relatedTarget !== menuButton.current
          )
            setMenuOpen(false);
        }}
      >
        <PageNavLink to="/" end>
          Search
        </PageNavLink>
        <PageNavLink to="/community">Community</PageNavLink>
        <PageNavLink to="/about">About</PageNavLink>
        <PageNavLink to="/download">Get app</PageNavLink>
        <UserMenu currentUser={currentUser} isLoading={isLoading} />
      </nav>
      <button
        className="library-theme-toggle"
        type="button"
        aria-label={`Switch to ${preferences.theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${preferences.theme === "dark" ? "light" : "dark"} mode`}
        onClick={() => preferences.setTheme(preferences.theme === "dark" ? "light" : "dark")}
      >
        <ThemeIcon mode={preferences.theme === "dark" ? "light" : "dark"} />
      </button>
    </header>
  );
}

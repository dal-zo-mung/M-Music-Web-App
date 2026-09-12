import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { buildSearchPath } from "../lib/auth";
import { MenuPanel } from "./MenuPanel";
import { UserMenu } from "./UserMenu";

export function Header(): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { currentUser, isLoading } = useAuth();
  const {
    fontSize,
    scrollSpeed,
    setFontSize,
    setScrollSpeed,
    setTheme,
    theme,
  } = usePreferences();

  useEffect(() => {
    const songSearchQuery = searchParams.get("q") || "";
    const currentPageSearchQuery =
      location.pathname === "/search" ? songSearchQuery : songSearchQuery;
    setSearchValue(currentPageSearchQuery);
  }, [location.pathname, searchParams]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent): void {
      const target = event.target;

      if (target instanceof Node && menuRef.current?.contains(target)) {
        return;
      }

      setIsMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("click", handleDocumentClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("click", handleDocumentClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const isSongPage = location.pathname.startsWith("/songs/");

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    navigate(buildSearchPath(searchValue));
  }

  return (
    <header className="site-header">
      <Link className="brand-link" to="/">
        <span className="brand-link__title">M-Music</span>
      </Link>

      <nav aria-label="Shortcuts" className="site-header__compact-links">
        <Link to="/community">Community</Link>
        {currentUser ? <Link to="/profile">Profile</Link> : null}
      </nav>

      <form className="search-form" onSubmit={handleSearchSubmit}>
        <input
          id="app-search-input"
          className="search-form__input"
          placeholder="Find a song or artist..."
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.currentTarget.value)}
        />
        <button className="button" type="submit">
          Search
        </button>
      </form>

      <div className="site-header__actions">
        <nav aria-label="Primary navigation" className="quick-links">
          <Link className="pill-link pill-link--subtle" to="/community">
            Community
          </Link>
          <Link className="pill-link pill-link--subtle" to="/download">
            Get App
          </Link>
        </nav>

        <div className="site-header__account">
          <UserMenu currentUser={currentUser} isLoading={isLoading} />

          <div className="site-header__menu" ref={menuRef}>
            <button
              aria-expanded={isMenuOpen}
              aria-haspopup="dialog"
              className="icon-button"
              type="button"
              onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            >
              <img alt="" src="/icons/menu4.png" />
            </button>

            <MenuPanel
              fontSize={fontSize}
              isOpen={isMenuOpen}
              scrollSpeed={scrollSpeed}
              setFontSize={setFontSize}
              setScrollSpeed={setScrollSpeed}
              setTheme={setTheme}
              showSongControls={isSongPage}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

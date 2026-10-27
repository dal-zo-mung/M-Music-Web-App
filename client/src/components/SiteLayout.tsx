import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";

import { Header } from "./Header";

function isBareAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

export function SiteLayout(): React.JSX.Element {
  const { pathname } = useLocation();
  const bareAuth = isBareAuthPath(pathname);

  return (
    <div className={`app-frame ${bareAuth ? "" : "library-app"}`}>
      <div className="app-scale-area">
        {bareAuth ? null : <Header />}
        <div className="app-scale-area__main page-transition" key={pathname}>
          <Outlet />
        </div>
        {bareAuth ? null : (
          <footer className="site-footer" role="contentinfo">
            <span className="site-footer__copyright">© M-Music</span>
          </footer>
        )}
      </div>
      <div
        id="reader-transport-root"
        className="song-page"
        style={{ display: "contents" }}
      />
      <ScrollRestoration
        getKey={(location) =>
          location.pathname === "/" || location.pathname === "/search"
            ? location.pathname + location.search
            : location.key
        }
      />
    </div>
  );
}

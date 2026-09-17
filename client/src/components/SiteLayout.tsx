import { Outlet, useLocation } from "react-router-dom";

import { Header } from "./Header";
import { SupportChat } from "./SupportChat";

function isBareAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

export function SiteLayout(): React.JSX.Element {
  const { pathname } = useLocation();
  const bareAuth = isBareAuthPath(pathname);

  return (
    <div className="app-frame">
      <div className="app-scale-area">
        {bareAuth ? null : <Header />}
        <div className="app-scale-area__main">
          <Outlet />
        </div>
        {bareAuth ? null : (
          <footer className="site-footer" role="contentinfo">
            © M-Music
          </footer>
        )}
      </div>
      <SupportChat />
    </div>
  );
}

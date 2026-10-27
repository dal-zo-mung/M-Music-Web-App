import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { SWRConfig } from "swr";

import { AuthProvider } from "./context/AuthContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import { router } from "./router";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./styles/app.css";
import "./styles/library.css";
import "./styles/error-screen.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <AppErrorBoundary>
    <SWRConfig
      value={{
        // Fetch on page entry and explicit actions; idle tabs must stay quiet.
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        refreshInterval: 0,
        shouldRetryOnError: false,
      }}
    >
      <PreferencesProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </PreferencesProvider>
    </SWRConfig>
  </AppErrorBoundary>,
);

import { createContext, useContext } from "react";

import useSWR from "swr";

import type {
  AuthMutationResponse,
  AuthStatusResponse,
  PublicUser,
} from "@shared/types";

import { fetchJson, postJson } from "../lib/api";

interface AuthContextValue {
  currentUser: PublicUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps): React.JSX.Element {
  const { data, isLoading, mutate } = useSWR<AuthStatusResponse>(
    "/api/me",
    fetchJson,
    {
      revalidateOnFocus: true,
    },
  );

  const currentUser = data?.authenticated ? (data.user ?? null) : null;

  async function refreshAuth(): Promise<void> {
    await mutate();
  }

  async function logout(): Promise<void> {
    try {
      await postJson<AuthMutationResponse>("/api/logout");
      await mutate({ authenticated: false }, { revalidate: false });
    } catch {
      await mutate(undefined, { revalidate: true });
      throw new Error("Logout failed");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

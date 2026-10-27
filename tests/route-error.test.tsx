import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { ErrorScreen } from "../client/src/components/ErrorScreen";
import { RouteErrorBoundary } from "../client/src/components/RouteErrorBoundary";
import { getRouteErrorContent } from "../client/src/lib/route-error";

describe("friendly route error recovery", () => {
  test("recognizes failed page imports across browsers without showing internal details", () => {
    for (const message of [
      "Failed to fetch dynamically imported module: https://m-music.site/assets/ProfilePage-old.js",
      "error loading dynamically imported module",
      "Importing a module script failed.",
      "Loading chunk 123 failed.",
      "Unable to preload CSS for /assets/profile.css",
    ]) {
      const content = getRouteErrorContent(new TypeError(message));
      expect(content.kind).toBe("page-load");
      expect(JSON.stringify(content)).not.toContain(message);
      expect(content.description).toContain("Reload");
    }
  });

  test("shows connection guidance while offline", () => {
    const content = getRouteErrorContent(new Error("private details"), false);
    expect(content.kind).toBe("offline");
    expect(content.description).toContain("internet connection");
    expect(getRouteErrorContent(new Error("private details"), true).kind).toBe(
      "unexpected",
    );
  });

  test("gives useful messages for missing pages and access failures", () => {
    for (const [status, kind] of [
      [404, "not-found"],
      [401, "access"],
      [403, "access"],
      [500, "unexpected"],
    ] as const) {
      const content = getRouteErrorContent({
        status,
        statusText: "Error",
        internal: true,
        data: "private details",
      });
      expect(content.kind).toBe(kind);
      expect(JSON.stringify(content)).not.toContain("private details");
    }
  });

  test("keeps the layout when a lazy page fails and supplies recovery actions", () => {
    const error = new TypeError(
      "Failed to fetch dynamically imported module: /assets/ProfilePage-old.js",
    );
    const router = createMemoryRouter(
      [
        {
          id: "layout",
          element: (
            <div data-testid="site-layout">
              <nav>Site navigation</nav>
              <Outlet />
            </div>
          ),
          errorElement: <RouteErrorBoundary standalone />,
          children: [
            {
              id: "profile",
              path: "/profile",
              element: <div>Profile</div>,
              errorElement: <RouteErrorBoundary />,
            },
          ],
        },
      ],
      {
        initialEntries: ["/profile"],
        hydrationData: { errors: { profile: error } },
      },
    );
    try {
      const html = renderToStaticMarkup(<RouterProvider router={router} />);
      expect(html).toContain("Site navigation");
      expect(html).toContain("This page missed a beat.");
      expect(html).toContain("Reload page");
      expect(html).toContain('href="/"');
      expect(html).not.toContain("ProfilePage-old.js");
      expect(html).not.toContain("Unexpected Application Error");
      expect(html).not.toContain("error-screen--standalone");
    } finally {
      router.dispose();
    }
  });

  test("unmatched URLs use the standalone branded fallback", () => {
    const router = createMemoryRouter(
      [
        {
          element: <Outlet />,
          errorElement: <RouteErrorBoundary standalone />,
          children: [{ path: "/", element: <div>Library</div> }],
        },
      ],
      { initialEntries: ["/missing-page"] },
    );
    try {
      const html = renderToStaticMarkup(<RouterProvider router={router} />);
      expect(html).toContain("Looks like this page moved.");
      expect(html).toContain("M-Music song library");
      expect(html).toContain("Go to library");
      expect(html).toContain("error-screen--standalone");
      expect(html).not.toContain("Reload page");
      expect(html).not.toContain("Hey developer");
    } finally {
      router.dispose();
    }
  });

  test("standalone recovery renders without auth, preferences, or router providers", () => {
    const html = renderToStaticMarkup(
      <ErrorScreen error={new Error("secret internal error")} standalone />,
    );
    expect(html).toContain("A little pause in the music.");
    expect(html).toContain("Reload page");
    expect(html).toContain("Go to library");
    expect(html).toContain('aria-labelledby="error-title"');
    expect(html).not.toContain("secret internal error");
  });
});

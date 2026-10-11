import { isRouteErrorResponse } from "react-router-dom";

export function getRouteErrorContent(error: unknown, online = true) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return {
      kind: "not-found",
      label: "Page not found",
      title: "Looks like this page moved.",
      description:
        "The link may have changed or the page may no longer exist. Head to the library to find your next song.",
      hint: "The library is a good place to start.",
    };
  }

  if (!online) {
    return {
      kind: "offline",
      label: "You're offline",
      title: "Let's get you reconnected.",
      description:
        "We couldn't reach this page. Check your internet connection, then reload when you're ready.",
      hint: "This page will stay here while you reconnect.",
    };
  }

  const message = error instanceof Error ? error.message : "";
  if (
    /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|loading chunk [\w-]+ failed|chunkloaderror|unable to preload css/i.test(
      message,
    )
  ) {
    return {
      kind: "page-load",
      label: "Page loading interrupted",
      title: "This page missed a beat.",
      description:
        "A connection problem or a recent update may have interrupted this page. Reload to get back to the music.",
      hint: "Still having trouble? Try again in a moment.",
    };
  }

  if (isRouteErrorResponse(error) && [401, 403].includes(error.status)) {
    return {
      kind: "access",
      label: "Access unavailable",
      title: "This page isn't available to you.",
      description:
        "You may need to sign in with an account that has access. You can also return to the public song library.",
      hint: "You can keep exploring the library.",
    };
  }

  return {
    kind: "unexpected",
    label: "Something went wrong",
    title: "A little pause in the music.",
    description:
      "We couldn't open this page right now. Reload to try again, or explore the library while we get things back on track.",
    hint: "If this keeps happening, please try again later.",
  };
}

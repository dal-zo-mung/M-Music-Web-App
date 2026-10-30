import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  setSystemTime,
  spyOn,
  test,
} from "bun:test";
import { JSDOM } from "jsdom";
import { act } from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:7002/login",
});
const globals = {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  sessionStorage: dom.window.sessionStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
};
const original = new Map(
  Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
);
for (const [key, value] of Object.entries(globals))
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value,
  });

const { createRoot } = await import("react-dom/client");
const { MemoryRouter, useLocation } = await import("react-router-dom");
const api = await import("../client/src/lib/api");
const auth = await import("../client/src/context/AuthContext");
const { LoginPage } = await import("../client/src/pages/LoginPage");

let root: ReturnType<typeof createRoot>;
let post: ReturnType<typeof spyOn>;
let authSpy: ReturnType<typeof spyOn>;
let refreshAuth: ReturnType<typeof mock>;

beforeEach(() => {
  sessionStorage.clear();
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById("root")!);
  refreshAuth = mock(async () => {});
  authSpy = spyOn(auth, "useAuth").mockReturnValue({
    currentUser: null,
    isLoading: false,
    refreshAuth,
    logout: mock(async () => {}),
  });
  post = spyOn(api, "postJson");
});

afterEach(async () => {
  await act(async () => root.unmount());
  post.mockRestore();
  authSpy.mockRestore();
  setSystemTime();
});
afterAll(() => {
  dom.window.close();
  for (const [key, descriptor] of original) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

async function renderLogin() {
  await act(async () =>
    root.render(
      <MemoryRouter>
        <LoginPage />
        <LocationProbe />
      </MemoryRouter>,
    ),
  );
}

function LocationProbe() {
  return <output data-testid="pathname">{useLocation().pathname}</output>;
}
async function submit() {
  await act(async () => {
    for (const [selector, value] of [
      ['input[autocomplete="username"]', "test_user"],
      ['input[autocomplete="current-password"]', "WrongPassword77#"],
    ]) {
      const input = document.querySelector(selector!)!;
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(
        input,
        value,
      );
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    }
  });
  await act(async () => {
    document
      .querySelector("form")!
      .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  });
}
const button = () => document.querySelector<HTMLButtonElement>('button[type="submit"]')!;

describe("login countdown UI", () => {
  test("uses the returned user and navigates immediately after a successful login", async () => {
    const user = { id: "listener", username: "test_user", role: "user" };
    post.mockResolvedValue({ status: true, user });
    await renderLogin();
    await submit();
    expect(refreshAuth).toHaveBeenCalledWith(user);
    expect(document.querySelector('[data-testid="pathname"]')?.textContent).toBe("/");
    expect(post).toHaveBeenCalledTimes(1);
  });

  test("prevents a second request while login is still pending", async () => {
    let reject!: (error: Error) => void;
    post.mockImplementation(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
    );
    await renderLogin();
    await submit();
    expect(button().disabled).toBe(true);
    await submit();
    expect(post).toHaveBeenCalledTimes(1);
    await act(async () => reject(new api.ApiError("Incorrect password.", 401, null)));
    expect(button().disabled).toBe(false);
    expect(document.querySelector('[role="status"]')?.textContent).toBe("Incorrect password.");
  });

  for (const kind of ["network", "account", "overlapping account and network"]) {
    test(`disables sign in until the ${kind} wait expires`, async () => {
      const now = Date.now();
      const payload =
        kind === "network"
          ? { retryAfterSeconds: 65 }
          : kind === "account"
            ? { lockoutUntil: new Date(now + 65_000).toISOString() }
            : {
                retryAfterSeconds: 300,
                lockoutUntil: new Date(now + 5 * 60_000).toISOString(),
              };
      post.mockRejectedValue(new api.ApiError("Too many attempts. Please wait.", 429, payload));
      await renderLogin();
      await submit();
      const deadline = Number(sessionStorage.getItem("m-music:login-cooldown-until"));
      expect(document.querySelector('[role="timer"]')?.textContent).toBe(
        kind === "overlapping account and network" ? "05:00" : "01:05",
      );
      expect(button().disabled).toBe(true);
      await act(async () => {
        button().click();
        document
          .querySelector("form")!
          .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
      });
      expect(post).toHaveBeenCalledTimes(1);
      await act(async () => {
        setSystemTime(deadline - 1000);
        await Bun.sleep(300);
      });
      expect(document.querySelector('[role="timer"]')?.textContent).toBe("00:01");
      await act(async () => {
        setSystemTime(deadline);
        await Bun.sleep(300);
      });
      expect(button().disabled).toBe(false);
      expect(document.querySelector('[role="timer"]')).toBeNull();
      post.mockRejectedValue(new api.ApiError("Incorrect password.", 401, null));
      await submit();
      expect(post).toHaveBeenCalledTimes(2);
    });
  }

  test("keeps a lock through a page remount", async () => {
    post.mockRejectedValue(new api.ApiError("Too many attempts.", 429, { retryAfterSeconds: 65 }));
    await renderLogin();
    await submit();
    await act(async () => root.unmount());
    root = createRoot(document.getElementById("root")!);
    await renderLogin();
    expect(button().disabled).toBe(true);
    expect(document.querySelector('[role="timer"]')?.textContent).toBe("01:05");
  });
});

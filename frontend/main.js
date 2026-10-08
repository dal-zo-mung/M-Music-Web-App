export {};
const apiUrl = (window.M_MUSIC_API_URL ?? "http://127.0.0.1:7000/api").replace(/\/$/, "");
const apiOrigin = apiUrl.replace(/\/api$/, "");
const page = document.body.dataset.page ?? "home";
const byId = (id) => document.getElementById(id);
const getQuery = (name) => new URLSearchParams(window.location.search).get(name)?.trim() ?? "";
async function request(path, init) {
    const response = await fetch(`${apiUrl}${path}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
        ...init,
    });
    const body = (await response.json().catch(() => null));
    if (!response.ok)
        throw new Error(body?.error?.message ??
            body?.message ??
            `Request failed (${response.status})`);
    return body;
}
function navigate(relativePath, params = {}) {
    const url = new URL(relativePath, window.location.href);
    for (const [key, value] of Object.entries(params))
        if (value)
            url.searchParams.set(key, value);
    window.location.href = url.toString();
}
function songTitle(song) {
    return song["Song Title"] || "Untitled";
}
function label(user) {
    return (user.username ||
        user.displayName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        "User");
}
async function syncUser() {
    const authButton = byId("authBtn");
    const profile = byId("userProfile");
    const username = byId("username");
    const dropdown = byId("dropdownUsername");
    const avatar = byId("avatar");
    try {
        const result = await request("/me");
        if (!result.authenticated || !result.user)
            return;
        const name = label(result.user);
        if (authButton)
            authButton.style.display = "none";
        profile?.classList.remove("hidden");
        if (profile)
            profile.style.display = "flex";
        if (username)
            username.textContent = name;
        if (dropdown)
            dropdown.textContent = name;
        if (avatar)
            avatar.textContent = name.charAt(0).toUpperCase();
    }
    catch {
        /* Offline UI remains usable. */
    }
}
function setupChrome() {
    const menu = byId("menu-panel");
    byId("menuButton")?.addEventListener("click", () => {
        if (menu)
            menu.style.display = menu.style.display === "block" ? "none" : "block";
    });
    byId("lightModeBtn")?.addEventListener("click", () => {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
    });
    byId("darkModeBtn")?.addEventListener("click", () => {
        document.body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
    });
    if (localStorage.getItem("theme") === "dark")
        document.body.classList.add("dark-mode");
    byId("logoutBtn")?.addEventListener("click", async () => {
        await request("/logout", { method: "POST" });
        window.location.href = "Index.html";
    });
    document
        .querySelectorAll("[href='/auth/google']")
        .forEach((link) => {
        link.href = `${apiOrigin}/auth/google?returnTo=${encodeURIComponent("/html/Index.html")}`;
    });
}
function setupSearchInput(run) {
    const input = byId("searchbox");
    byId("searchbt")?.addEventListener("click", () => run(input?.value.trim() ?? ""));
    input?.addEventListener("keydown", (event) => {
        if (event.key === "Enter")
            run(input.value.trim());
    });
}
function renderResults(items, query) {
    const target = byId("searchResults");
    if (!target)
        return;
    target.replaceChildren();
    const title = byId("searchPageTitle");
    const summary = byId("searchSummary");
    if (title)
        title.textContent = query
            ? `Results for "${query}"`
            : "Find the song you want to open";
    if (summary)
        summary.textContent = query
            ? `${items.length} match${items.length === 1 ? "" : "es"} found.`
            : "Search by song title or artist to see matching results.";
    if (!items.length) {
        target.textContent = query
            ? "No matching songs found."
            : "Search for a song or artist to see matching results.";
        return;
    }
    for (const item of items) {
        const button = document.createElement("button");
        button.className = "search-result";
        button.type = "button";
        const heading = document.createElement("h4");
        heading.textContent = songTitle(item);
        const detail = document.createElement("p");
        detail.textContent = [item.Artist, item["About Song"]]
            .filter(Boolean)
            .join(" — ");
        button.append(heading, detail);
        button.addEventListener("click", () => navigate("lyrics.html", { id: item._id, q: query }));
        target.append(button);
    }
}
async function setupSearch() {
    const run = async (query) => {
        history.replaceState({}, "", `${location.pathname}?q=${encodeURIComponent(query)}`);
        if (!query) {
            renderResults([], "");
            return;
        }
        try {
            renderResults(await request(`/songs/search/${encodeURIComponent(query)}?limit=50`), query);
        }
        catch {
            renderResults([], query);
        }
    };
    setupSearchInput(run);
    const query = getQuery("q");
    const input = byId("searchbox");
    if (input)
        input.value = query;
    await run(query);
}
async function setupSong() {
    const songId = getQuery("id");
    if (!songId)
        return;
    const title = byId("songTitle");
    const lyrics = byId("lyricsText");
    try {
        const item = await request(`/songs/${encodeURIComponent(songId)}`);
        if (title)
            title.textContent = songTitle(item);
        if (byId("artist"))
            byId("artist").textContent = item.Artist
                ? `Artist: ${item.Artist}`
                : "-";
        if (byId("releaseDate"))
            byId("releaseDate").textContent = item["Released Date"]
                ? `Released: ${item["Released Date"]}`
                : "-";
        if (byId("songGenre"))
            byId("songGenre").textContent = item["About Song"] ?? "-";
        if (lyrics)
            lyrics.textContent = item.Lyric?.join("\n") ?? "";
        const video = byId("youtubeLink");
        if (video)
            video.href = item["Direct to YT"] ?? "#";
        const cover = byId("albumCover");
        if (cover && item.albumCover)
            cover.src = item.albumCover;
        byId("copybt")?.addEventListener("click", () => navigator.clipboard.writeText(lyrics?.textContent ?? ""));
    }
    catch {
        if (title)
            title.textContent = "Song unavailable";
        if (lyrics)
            lyrics.textContent = "Please return to search and try again.";
    }
    setupSearchInput((query) => navigate("search.html", { q: query }));
}
function setupHome() {
    setupSearchInput((query) => navigate("search.html", { q: query }));
    byId("startSearchBtn")?.addEventListener("click", () => byId("searchbox")?.focus());
}
function formMessage(message) {
    const target = byId("formMessage");
    if (target)
        target.textContent = message;
}
function setupLogin() {
    const form = byId("container");
    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await request("/login", {
                method: "POST",
                body: JSON.stringify({
                    username: byId("usernameInput")?.value,
                    password: byId("passwordInput")?.value,
                }),
            });
            window.location.href = "Index.html";
        }
        catch (error) {
            formMessage(error instanceof Error ? error.message : "Login failed.");
        }
    });
}
function setupRegister() {
    const form = byId("container");
    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const password = byId("passwordInput")?.value ?? "";
        if (password !== (byId("confirmPasswordInput")?.value ?? "")) {
            formMessage("Passwords do not match.");
            return;
        }
        try {
            await request("/register", {
                method: "POST",
                body: JSON.stringify({
                    firstName: byId("box11")?.value,
                    lastName: byId("box12")?.value,
                    username: byId("usernameInput")?.value,
                    password,
                }),
            });
            window.location.href = "Index.html";
        }
        catch (error) {
            formMessage(error instanceof Error ? error.message : "Registration failed.");
        }
    });
}
document.addEventListener("DOMContentLoaded", () => {
    setupChrome();
    void syncUser();
    if (page === "home")
        setupHome();
    if (page === "search")
        void setupSearch();
    if (page === "song")
        void setupSong();
    if (location.pathname.toLowerCase().includes("login.html"))
        setupLogin();
    if (location.pathname.toLowerCase().includes("register.html"))
        setupRegister();
});

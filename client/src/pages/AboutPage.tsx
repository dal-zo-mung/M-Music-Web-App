export function AboutPage(): React.JSX.Element {
  return (
    <main className="library-about" id="main-content">
      <p className="library-about__eyebrow">ABOUT M-MUSIC</p>
      <h1>A place for the songs you love.</h1>
      <p>
        Explore Myanmar and English worship songs, gospel music, Christmas songs, and hymns. Find a
        song by its title, artist, or a line you remember.
      </p>
      <p>
        Open a song to read its lyrics, adjust the reading size, or turn on auto-scroll. Sign in to
        save your favorites and find them again on your profile.
      </p>
      <section className="library-about__release" aria-labelledby="about-release-heading">
        <h2 id="about-release-heading">Released data</h2>
        <p>
          M-Music Web App was first released on <time dateTime="2026-10-08">8 October 2026</time>.
        </p>
      </section>
    </main>
  );
}

import { Link } from 'react-router-dom';

interface CategoryCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradient: string;
  /** slug passed as ?category= query param */
  slug: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    id: 'myanmar-worship',
    slug: 'myanmar-worship',
    icon: '🙏',
    title: 'Myanmar Worship Songs',
    description: 'Spirit-filled worship in Myanmar language.',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'english-worship',
    slug: 'english-worship',
    icon: '✨',
    title: 'English Worship Songs',
    description: 'Contemporary and classic English worship anthems for every gathering.',
    gradient: 'linear-gradient(135deg, #18c3c8 0%, #0e6e75 100%)',
  },
  {
    id: 'myanmar-gospel',
    slug: 'myanmar-gospel',
    icon: '🎶',
    title: 'Myanmar Gospel Songs',
    description: 'Joyful Myanmar gospel music.',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 'english-gospel',
    slug: 'english-gospel',
    icon: '🎺',
    title: 'English Gospel Songs',
    description: 'Soulful English gospel tracks filled with hope, faith, and celebration.',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    id: 'myanmar-hymns',
    slug: 'myanmar-hymns',
    icon: '📖',
    title: 'Myanmar Hymns',
    description: 'Traditional hymns translated and adapted in the Myanmar language.',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    id: 'english-hymns',
    slug: 'english-hymns',
    icon: '🕊️',
    title: 'English Hymns',
    description: 'Beloved classic English hymns.',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
];


export function HomePage(): React.JSX.Element {
  function focusSearch(): void {
    const searchInput = document.getElementById('app-search-input');

    if (searchInput instanceof HTMLInputElement) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return (
    <main className="home-page">
      {/* ── Hero ── */}
      <section className="hero-page hero-page--home">
        <div className="hero-card">
          <span aria-hidden="true" className="hero-card__icon">
            ♫
          </span>
          <p className="hero-card__eyebrow">Music Discovery</p>
          <h2>Find your favorite songs and lyrics in one calm place.</h2>
          <p>
            Search by title, artist, or song notes, then move through results without
            losing your rhythm.
          </p>
          <div className="hero-card__cta-row">
            <button className="button button--large" type="button" onClick={focusSearch}>
              Find your love here
            </button>
            <Link className="button button--large button--secondary" to="/download">
              ⬇ Get the App
            </Link>
          </div>
        </div>
      </section>

      {/* ── Category cards ── */}
      <section className="category-section" aria-labelledby="categories-heading">
        <div className="category-section__header">
          <h2 id="categories-heading" className="category-section__title">
            Categories
          </h2>
        </div>

        <ul className="category-grid" role="list">
          {CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <Link
                className="category-card"
                to={`/search?category=${encodeURIComponent(cat.slug)}`}
                aria-label={`Browse ${cat.title}`}
              >
                {/* gradient band */}
                <div
                  className="category-card__band"
                  style={{ background: cat.gradient }}
                  aria-hidden="true"
                >
                  <span className="category-card__emoji">{cat.icon}</span>
                </div>

                <div className="category-card__body">
                  <h3 className="category-card__title">{cat.title}</h3>
                  <p className="category-card__desc">{cat.description}</p>
                  <span className="category-card__arrow" aria-hidden="true">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

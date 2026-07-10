import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';
import { GridSkeleton, EmptyState, ErrorState } from '../components/StateViews.jsx';
import Img from '../components/Img.jsx';
import { formatNaira } from '../lib/format.js';

const CUISINES = ['All', 'Nigerian', 'Continental', 'Chinese', 'Fast Food', 'Grills', 'Seafood', 'Pastries'];

export default function Home() {
  const { isAuthenticated, profile } = useAuth();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [openOnly, setOpenOnly] = useState(false);

  const [restaurants, setRestaurants] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  // Debounce the search box so we're not hitting the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset to page 1 whenever the search/filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, cuisine, openOnly]);

  useEffect(() => {
    let cancelled = false;
    const isFirstPage = page === 1;

    async function load() {
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      setError('');
      try {
        if (debouncedQuery.length >= 2) {
          const { data } = await api.get('/search', { params: { q: debouncedQuery } });
          if (!cancelled) setSearchResults(data);
        } else {
          setSearchResults(null);
          const params = { page, limit: 12 };
          if (cuisine !== 'All') params.cuisine = cuisine;
          if (openOnly) params.is_open = true;
          const { data } = await api.get('/restaurants', { params });
          if (!cancelled) {
            setRestaurants((prev) => (isFirstPage ? data.restaurants : [...prev, ...data.restaurants]));
            setTotal(data.total);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load restaurants right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, cuisine, openOnly, page]);

  const hasMore = !searchResults && restaurants.length < total;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="ticket p-8 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-widest text-pepper">Lagos - Abuja - Port Harcourt</p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Order food from your favorite local spots
        </h1>
        <p className="mt-2 text-ink-soft">
          {isAuthenticated
            ? `Welcome back${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.`
            : 'Log in to start ordering.'}
        </p>

        <div className="mt-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search restaurants or dishes..."
            aria-label="Search restaurants or dishes"
            className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-ink placeholder:text-ink-soft/60 focus:border-pepper"
          />
        </div>
      </div>

      {!searchResults && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {CUISINES.map((c) => (
            <button
              key={c}
              onClick={() => setCuisine(c)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                cuisine === c
                  ? 'border-pepper bg-pepper/10 text-pepper'
                  : 'border-hairline text-ink-soft hover:border-ink-soft'
              }`}
            >
              {c}
            </button>
          ))}
          <label className="ml-2 flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="accent-pepper"
            />
            Open now
          </label>
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <GridSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : searchResults ? (
          <SearchResultsView results={searchResults} />
        ) : restaurants.length ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingMore}
                className="mt-6 w-full rounded-lg border border-hairline py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-pepper hover:text-pepper disabled:opacity-60"
              >
                {loadingMore ? 'Loading...' : 'Load more restaurants'}
              </button>
            )}
          </>
        ) : (
          <EmptyState message="No restaurants match those filters yet. Try clearing them." />
        )}
      </div>
    </div>
  );
}

function SearchResultsView({ results }) {
  const { restaurants, menu_items, query } = results;

  if (!restaurants.length && !menu_items.length) {
    return <EmptyState message={`No matches for "${query}". Try a different search.`} />;
  }

  return (
    <div className="space-y-10">
      {restaurants.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Restaurants</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        </section>
      )}

      {menu_items.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Dishes</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {menu_items.map((item) => (
              <Link
                key={item.id}
                to={`/restaurants/${item.restaurants?.id || item.restaurant_id}`}
                className="ticket flex items-center gap-4 p-4 transition-shadow hover:shadow-md"
              >
                <Img
                  src={item.image_url}
                  fallbackText={item.name?.[0]}
                  frameClassName="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-hairline"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-display text-sm font-bold text-ink">{item.name}</h4>
                  <p className="truncate text-xs text-ink-soft">{item.restaurants?.name}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-pepper">{formatNaira(item.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

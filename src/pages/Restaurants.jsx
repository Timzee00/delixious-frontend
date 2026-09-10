import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import RestaurantCard from '../components/RestaurantCard.jsx';
import { GridSkeleton, EmptyState, ErrorState } from '../components/StateViews.jsx';

const CUISINES = ['All', 'Nigerian', 'Continental', 'Chinese', 'Fast Food', 'Grills', 'Seafood', 'Pastries'];

export default function Restaurants() {
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [openOnly, setOpenOnly] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setPage(1); }, [query, cuisine, openOnly]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const first = page === 1;
      first ? setLoading(true) : setLoadingMore(true);
      setError('');
      try {
        const params = { page, limit: 12 };
        if (query.trim()) params.search = query.trim();
        if (cuisine !== 'All') params.cuisine = cuisine;
        if (openOnly) params.is_open = true;
        const { data } = await api.get('/restaurants', { params });
        if (!cancelled) {
          setRestaurants((current) => first ? data.restaurants : [...current, ...data.restaurants]);
          setTotal(data.total || 0);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load restaurants right now.');
      } finally {
        if (!cancelled) { setLoading(false); setLoadingMore(false); }
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, cuisine, openOnly, page]);

  const hasMore = restaurants.length < total;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="text-sm font-medium text-pepper hover:underline">Back to home</Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">All restaurants</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">Find a restaurant by name, cuisine, or opening status.</p>
        </div>
      </div>

      <div className="ticket mt-6 p-4 sm:p-5">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for your restaurant..."
          aria-label="Search restaurants"
          className="w-full rounded-lg border border-hairline bg-paper px-4 py-3 text-ink placeholder:text-ink-soft/60"
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {CUISINES.map((item) => (
            <button key={item} type="button" onClick={() => setCuisine(item)} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${cuisine === item ? 'border-pepper bg-pepper/10 text-pepper' : 'border-hairline text-ink-soft hover:border-ink-soft'}`}>
              {item}
            </button>
          ))}
          <label className="ml-1 flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} className="accent-pepper" />
            Open now
          </label>
        </div>
      </div>

      <div className="mt-8">
        {loading ? <GridSkeleton /> : error ? <ErrorState message={error} /> : restaurants.length ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
            </div>
            {hasMore && (
              <button type="button" disabled={loadingMore} onClick={() => setPage((value) => value + 1)} className="mt-6 w-full rounded-lg border border-hairline py-3 text-sm font-semibold text-ink-soft hover:border-pepper hover:text-pepper disabled:opacity-60">
                {loadingMore ? 'Loading...' : 'Load more restaurants'}
              </button>
            )}
          </>
        ) : <EmptyState message="No approved restaurants match your search yet." />}
      </div>
    </div>
  );
}

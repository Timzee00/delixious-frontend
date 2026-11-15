import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import FoodCard from '../components/FoodCard.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Modal from '../components/Modal.jsx';
import { GridSkeleton, EmptyState, ErrorState } from '../components/StateViews.jsx';

const CUISINES = [
  { label: 'All', icon: 'all' },
  { label: 'Nigerian', icon: 'nigerian' },
  { label: 'Continental', icon: 'continental' },
  { label: 'Chinese', icon: 'chinese' },
  { label: 'Fast Food', icon: 'fast-food' },
  { label: 'Grills', icon: 'grills' },
  { label: 'Seafood', icon: 'seafood' },
  { label: 'Pastries', icon: 'pastries' },
];
const DEFAULT_FILTERS = { minPrice: '', maxPrice: '', minRating: '', sort: 'newest' };
const PAGE_SIZE = 12;

function SearchIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" strokeLinecap="round" /></svg>;
}
function SlidersIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 6h5m4 0h7M4 12h2m4 0h10M4 18h8m4 0h4" /><circle cx="11" cy="6" r="2" fill="white" /><circle cx="8" cy="12" r="2" fill="white" /><circle cx="14" cy="18" r="2" fill="white" /></svg>;
}
function CategoryIcon({ type }) {
  const drawings = {
    all: <><path d="M3 13h18l-1.5 6h-15L3 13Z" /><path d="M6 10a6 6 0 0 1 12 0M12 3v2M5 21h14" /></>,
    nigerian: <><path d="M4 13h16l-1.5 6h-13L4 13Z" /><path d="M7 10c1-2 3-3 5-3s4 1 5 3M8 4l1 2m6-2-1 2" /></>,
    continental: <><path d="M4 9h16l-1 10H5L4 9Z" /><path d="M7 9V6h10v3M8 13h8M10 16h4" /></>,
    chinese: <><path d="M4 12h16l-2 7H6l-2-7Z" /><path d="M6 9c2-2 4-2 6 0 2-2 4-2 6 0M8 5h8M12 5V3" /></>,
    'fast-food': <><path d="M4 10h16l-2 9H6l-2-9Z" /><path d="M5 10c1-4 4-6 7-6s6 2 7 6M8 14h8m-7 3h6" /></>,
    grills: <><path d="M5 7h14M7 7 6 19h12L17 7M8 11h8M8 15h8" /><path d="M9 4v3m6-3v3" /></>,
    seafood: <><path d="M3 12c3-5 8-7 15-4l3 4-3 4c-7 3-12 1-15-4Z" /><path d="m3 12-2-3v6l2-3Zm11-2h.01M17 11l1 1-1 1" /></>,
    pastries: <><path d="M4 18h16M6 18c0-6 2-10 6-12 4 2 6 6 6 12" /><path d="M9 13h6m-5-4h4" /></>,
  };
  return <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawings[type] || drawings.all}</svg>;
}
function DeliveryIllustration() {
  return (
    <svg viewBox="0 0 260 150" className="h-28 w-44 shrink-0 sm:h-32 sm:w-56" fill="none" aria-hidden="true">
      <path d="M12 108h38M22 89h36M6 126h52" stroke="#F6A15B" strokeWidth="7" strokeLinecap="round" />
      <path d="M81 92h63l18 27H73l8-27Z" fill="#E9471B" /><path d="M96 92V73h34l14 19" fill="#FF6B2D" />
      <path d="M103 81h18" stroke="#FFF4E8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="103" cy="120" r="17" fill="#382016" /><circle cx="103" cy="120" r="8" fill="#FFF2E6" />
      <circle cx="214" cy="120" r="17" fill="#382016" /><circle cx="214" cy="120" r="8" fill="#FFF2E6" />
      <path d="M164 112h31l17-26h16l14 26h-12" stroke="#382016" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M184 83 171 64h22l11 19M178 64l-7-13h24l7 13" fill="#F24B20" />
      <path d="M178 50c0-11 8-19 18-19s18 8 18 19v7h-36v-7Z" fill="#F24B20" /><path d="M185 47a11 11 0 0 1 22 0v10h-22V47Z" fill="#382016" /><path d="M196 35v-7" stroke="#382016" strokeWidth="4" strokeLinecap="round" />
      <path d="M151 108h23" stroke="#382016" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterError, setFilterError] = useState('');
  const [foods, setFoods] = useState([]);
  const [foodTotal, setFoodTotal] = useState(0);
  const [foodPage, setFoodPage] = useState(1);
  const [favoriteFoods, setFavoriteFoods] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteBusy, setFavoriteBusy] = useState(new Set());
  const [foodLoading, setFoodLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [foodError, setFoodError] = useState('');
  const [restaurantError, setRestaurantError] = useState('');
  const [favoriteError, setFavoriteError] = useState('');
  const [addBusy, setAddBusy] = useState(null);
  const [cartConflict, setCartConflict] = useState(null);

  const activeFilterCount = [cuisine !== 'All', filters.minPrice !== '', filters.maxPrice !== '', filters.minRating !== '', filters.sort !== 'newest'].filter(Boolean).length;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => { setFoodPage(1); }, [debouncedQuery, cuisine, filters]);

  useEffect(() => {
    let cancelled = false;
    async function loadFoods() {
      if (foodPage === 1) { setFoodLoading(true); setFoodError(''); }
      else setLoadingMore(true);
      try {
        const params = {
          page: foodPage, limit: PAGE_SIZE,
          ...(debouncedQuery ? { q: debouncedQuery } : {}),
          ...(cuisine !== 'All' ? { cuisine } : {}),
          ...(filters.minPrice !== '' ? { min_price: filters.minPrice } : {}),
          ...(filters.maxPrice !== '' ? { max_price: filters.maxPrice } : {}),
          ...(filters.minRating !== '' ? { min_rating: filters.minRating } : {}),
          ...(filters.sort ? { sort: filters.sort } : {}),
        };
        const { data } = await api.get('/menu-items/feed', { params });
        if (!cancelled) {
          const incoming = data.menu_items || [];
          setFoods((current) => {
            if (foodPage === 1) return incoming;
            const known = new Set(current.map((item) => item.id));
            return [...current, ...incoming.filter((item) => !known.has(item.id))];
          });
          setFoodTotal(Number(data.total) || 0);
        }
      } catch (err) {
        if (!cancelled) setFoodError(err.response?.data?.error || 'Could not load dishes right now.');
      } finally {
        if (!cancelled) {
          if (foodPage === 1) setFoodLoading(false);
          else setLoadingMore(false);
        }
      }
    }
    loadFoods();
    return () => { cancelled = true; };
  }, [foodPage, debouncedQuery, cuisine, filters]);

  async function loadFavoriteFoods(ids) {
    if (!isAuthenticated || !ids.length) { setFavoriteFoods([]); return; }
    try {
      const { data } = await api.get('/menu-items/feed', { params: { page: 1, limit: 8, restaurant_ids: ids.join(',') } });
      setFavoriteFoods(data.menu_items || []);
    } catch {
      setFavoriteFoods([]);
      setFavoriteError('Could not load food from your favorite restaurants.');
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadRestaurants() {
      setRestaurantLoading(true); setRestaurantError('');
      try {
        const { data } = await api.get('/restaurants', { params: { page: 1, limit: 8 } });
        if (!cancelled) setRestaurants(data.restaurants || []);
      } catch (err) {
        if (!cancelled) setRestaurantError(err.response?.data?.error || 'Could not load restaurants right now.');
      } finally {
        if (!cancelled) setRestaurantLoading(false);
      }
    }
    loadRestaurants();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadFavorites() {
      if (!isAuthenticated) {
        setFavoriteIds(new Set()); setFavoriteFoods([]); setFavoriteError(''); return;
      }
      try {
        const { data } = await api.get('/favorites/restaurants');
        if (cancelled) return;
        const ids = data.restaurant_ids || [];
        setFavoriteIds(new Set(ids)); setFavoriteError('');
        await loadFavoriteFoods(ids);
      } catch (err) {
        if (!cancelled) {
          setFavoriteIds(new Set()); setFavoriteFoods([]);
          setFavoriteError(err.response?.data?.error || 'Could not load your favorites right now.');
        }
      }
    }
    loadFavorites();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  async function toggleFavorite(id) {
    if (!isAuthenticated) return;
    setFavoriteBusy((current) => new Set(current).add(id));
    setFavoriteError('');
    try {
      const nextIds = new Set(favoriteIds);
      if (nextIds.has(id)) { await api.delete('/favorites/restaurants/' + id); nextIds.delete(id); }
      else { await api.post('/favorites/restaurants/' + id); nextIds.add(id); }
      setFavoriteIds(nextIds);
      await loadFavoriteFoods([...nextIds]);
    } catch (err) {
      setFavoriteError(err.response?.data?.error || 'Could not update your favorites.');
    } finally {
      setFavoriteBusy((current) => { const next = new Set(current); next.delete(id); return next; });
    }
  }

  async function addToCart(item, replace = false) {
    if (!isAuthenticated) return setFoodError('Log in to add food to your cart.');
    setAddBusy(item.id);
    try {
      await api.post('/cart/items', { menu_item_id: item.id, quantity: 1, replace });
      await refreshCart(); setCartConflict(null);
    } catch (err) {
      if (err.response?.status === 409) setCartConflict({ item, message: err.response.data.error });
      else setFoodError(err.response?.data?.error || 'Could not add that dish to your cart.');
    } finally { setAddBusy(null); }
  }

  function openFilters() { setDraftFilters(filters); setFilterError(''); setFiltersOpen(true); }
  function applyFilters() {
    if (draftFilters.minPrice !== '' && draftFilters.maxPrice !== '' && Number(draftFilters.minPrice) > Number(draftFilters.maxPrice)) {
      setFilterError('The minimum price cannot be higher than the maximum price.'); return;
    }
    setFilters({ ...draftFilters }); setFiltersOpen(false); setFilterError('');
  }
  function clearFilters() {
    setDraftFilters(DEFAULT_FILTERS); setFilters(DEFAULT_FILTERS); setCuisine('All'); setFilterError('');
  }

  const heroItem = foods[0];
  const heroRestaurantId = heroItem?.restaurants?.id || heroItem?.restaurant_id;
  const hasMore = foods.length < foodTotal;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pt-7">
      <section className="mb-5 flex items-center gap-3 sm:mb-6">
        <div className="min-w-0 flex-1">
          <label htmlFor="dish-search" className="sr-only">Search meals and restaurants</label>
          <div className="flex h-14 items-center gap-3 rounded-full border border-hairline bg-white px-4 shadow-sm transition focus-within:border-pepper focus-within:ring-2 focus-within:ring-pepper/10 sm:h-16 sm:px-6">
            <span className="shrink-0 text-ink-soft"><SearchIcon /></span>
            <input id="dish-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for meals, restaurants..." className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-0 sm:text-base" />
            {query && <button type="button" onClick={() => setQuery('')} className="rounded-full p-1 text-xs font-semibold text-ink-soft hover:text-pepper" aria-label="Clear search">Clear</button>}
          </div>
        </div>
        <button type="button" onClick={openFilters} aria-haspopup="dialog" aria-expanded={filtersOpen} className="relative flex h-14 shrink-0 items-center gap-2 rounded-full border border-hairline bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:border-pepper hover:text-pepper sm:h-16 sm:px-6">
          <SlidersIcon /><span className="hidden sm:inline">Filter</span><span className="sm:hidden">Filters</span>
          {activeFilterCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-pepper px-1 text-[10px] font-bold text-white">{activeFilterCount}</span>}
        </button>
      </section>

      <section className="relative isolate min-h-[390px] overflow-hidden rounded-[28px] bg-[#35160E] text-white shadow-sm sm:min-h-[370px] sm:rounded-[34px] lg:min-h-[400px]">
        {heroItem?.image_url && <img src={heroItem.image_url} alt={heroItem.name} loading="eager" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-center" />}
        <div className="absolute inset-0 bg-gradient-to-r from-[#26100B] via-[#35160E]/95 to-[#35160E]/20 sm:via-[#35160E]/80 sm:to-transparent" />
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[34px] border-white/5 sm:h-[28rem] sm:w-[28rem]" />
        <div className="relative z-10 flex min-h-[390px] max-w-2xl flex-col items-start justify-center px-6 py-9 sm:min-h-[370px] sm:px-10 sm:py-12 lg:min-h-[400px] lg:px-12">
          <span className="inline-flex items-center rounded-full bg-pepper px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white sm:text-xs">Good food. Good mood.</span>
          <h1 className="mt-6 max-w-xl font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">Delicious Food<br />Delivered <span className="italic text-[#FF6A2C]">Fast!</span></h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/85 sm:text-lg sm:leading-7">Find your next favourite meal from kitchens around you. Discover dishes, choose a restaurant and order with confidence.</p>
          <Link to={heroRestaurantId ? '/restaurants/' + heroRestaurantId : '/restaurants'} className="mt-7 inline-flex items-center gap-4 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-ink shadow-lg transition hover:-translate-y-0.5 hover:bg-[#FFF3E9] sm:px-8 sm:py-4 sm:text-base">
            Order Now
            <span className="grid h-8 w-8 place-items-center rounded-full bg-pepper text-white"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          </Link>
          {heroItem && <p className="mt-5 text-xs font-medium text-white/75">Featured today: {heroItem.name}</p>}
        </div>
      </section>

      <section aria-label="Browse by cuisine" className="no-scrollbar mt-5 flex snap-x gap-3 overflow-x-auto rounded-[26px] border border-white/80 bg-white/90 p-3 shadow-sm sm:mt-6 sm:gap-4 sm:p-4">
        {CUISINES.map((item) => (
          <button key={item.label} type="button" onClick={() => setCuisine(item.label)} aria-pressed={cuisine === item.label} className={cuisine === item.label ? 'flex w-[94px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-[22px] border border-pepper bg-pepper px-2 py-3 text-center text-white shadow-md shadow-pepper/20 sm:w-[116px] sm:py-4' : 'flex w-[94px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-[22px] border border-[#F4E8DF] bg-[#FFF9F5] px-2 py-3 text-center text-ink transition hover:border-pepper/40 hover:bg-pepper/5 sm:w-[116px] sm:py-4'}>
            <span className={cuisine === item.label ? 'text-white' : 'text-pepper'}><CategoryIcon type={item.icon} /></span>
            <span className="text-xs font-semibold leading-tight sm:text-sm">{item.label === 'All' ? 'All dishes' : item.label}</span>
          </button>
        ))}
      </section>

      {isAuthenticated && favoriteFoods.length > 0 && !debouncedQuery && (
        <section className="mt-9 sm:mt-11">
          <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-pepper">Picked for you</p><h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">From your favourites</h2></div><Link to="/favorites" className="text-sm font-semibold text-pepper hover:underline">Manage</Link></div>
          {favoriteError && <p className="mt-3 text-sm text-ink-soft">{favoriteError}</p>}
          <div className="no-scrollbar mt-5 flex snap-x gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-4">
            {favoriteFoods.map((item) => <div key={item.id} className="w-[270px] shrink-0 snap-start lg:w-auto"><FoodCard item={item} onAdd={addToCart} adding={addBusy === item.id} /></div>)}
          </div>
        </section>
      )}

      <section id="discover" className="mt-9 scroll-mt-24 sm:mt-11">
        <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-pepper">Fresh from local kitchens</p><h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">Popular Dishes</h2>{debouncedQuery && <p className="mt-1 text-sm text-ink-soft">Showing results for “{debouncedQuery}”.</p>}</div><span className="shrink-0 text-sm font-semibold text-pepper">{foodTotal > 0 ? foodTotal + ' dishes' : 'Explore'}</span></div>
        {foodLoading ? <div className="mt-5"><GridSkeleton /></div> : foodError ? <div className="mt-5"><ErrorState message={foodError} /></div> : foods.length ? (
          <>
            <div className="no-scrollbar mt-5 flex snap-x gap-4 overflow-x-auto pb-3 sm:gap-5 lg:grid lg:grid-cols-3 xl:grid-cols-4">
              {foods.map((item) => <div key={item.id} className="w-[276px] shrink-0 snap-start sm:w-[310px] lg:w-auto"><FoodCard item={item} onAdd={addToCart} adding={addBusy === item.id} /></div>)}
            </div>
            {hasMore && <div className="mt-4 flex justify-center"><button type="button" onClick={() => setFoodPage((current) => current + 1)} disabled={loadingMore} className="rounded-full border border-hairline bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-pepper hover:text-pepper disabled:opacity-60">{loadingMore ? 'Loading dishes...' : 'Load more dishes'}</button></div>}
          </>
        ) : <div className="mt-5"><EmptyState message="No dishes match these choices. Try adjusting your search or filters." /></div>}
      </section>

      <section className="mt-10 sm:mt-12">
        <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-pepper">Explore by restaurant</p><h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">Restaurants to try</h2></div><Link to="/restaurants" className="text-sm font-semibold text-pepper hover:underline">See all</Link></div>
        {restaurantLoading ? <div className="mt-5"><GridSkeleton /></div> : restaurantError ? <div className="mt-5"><ErrorState message={restaurantError} /></div> : restaurants.length ? (
          <div className="no-scrollbar mt-5 flex snap-x gap-5 overflow-x-auto pb-3">{restaurants.map((restaurant) => <div key={restaurant.id} className="w-[280px] shrink-0 snap-start sm:w-[320px]"><RestaurantCard restaurant={restaurant} isFavorite={favoriteIds.has(restaurant.id)} favoriteBusy={favoriteBusy.has(restaurant.id)} onToggleFavorite={isAuthenticated ? () => toggleFavorite(restaurant.id) : undefined} /></div>)}</div>
        ) : <div className="mt-5"><EmptyState message="No approved restaurants are available yet." /></div>}
      </section>

      <section className="mt-10 flex items-center gap-4 overflow-hidden rounded-[28px] bg-[#FFE2C8] px-5 py-5 text-ink sm:mt-12 sm:gap-8 sm:px-8 sm:py-6">
        <DeliveryIllustration />
        <div className="min-w-0 flex-1"><p className="font-display text-xl font-bold leading-tight sm:text-3xl">Good food is closer than you think.</p><p className="mt-2 text-xs text-ink-soft sm:text-sm">Hot meals. Local kitchens. Easy ordering.</p></div>
        <Link to="/restaurants" className="hidden shrink-0 items-center gap-2 rounded-full bg-pepper px-5 py-3 text-sm font-bold text-white transition hover:bg-pepper-dark sm:inline-flex">Explore kitchens<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
      </section>

      {!isAuthenticated && <div className="mt-8 rounded-2xl border border-hairline bg-white p-5 text-sm text-ink-soft">Create an account to save favourite restaurants, build a personal food feed and place orders. <Link to="/signup" className="ml-1 font-semibold text-pepper hover:underline">Get started</Link></div>}

      {filtersOpen && (
        <Modal onClose={() => setFiltersOpen(false)} labelledBy="filter-dialog-title" className="max-w-lg">
          <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-pepper">Find your kind of food</p><h2 id="filter-dialog-title" className="mt-1 font-display text-2xl font-bold text-ink">Filter dishes</h2><p className="mt-1 text-sm text-ink-soft">Narrow the menu by budget, restaurant rating and price order.</p></div><button type="button" onClick={() => setFiltersOpen(false)} className="rounded-full p-2 text-ink-soft hover:bg-sand hover:text-ink" aria-label="Close filters"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg></button></div>
          <div className="mt-6 space-y-5">
            <div><label className="mb-2 block text-sm font-semibold text-ink">Price range (₦)</label><div className="grid grid-cols-2 gap-3"><input type="number" min="0" step="100" value={draftFilters.minPrice} onChange={(event) => setDraftFilters((current) => ({ ...current, minPrice: event.target.value }))} placeholder="Minimum" className="w-full rounded-xl border border-hairline bg-white px-3 py-3 text-sm text-ink outline-none focus:border-pepper" /><input type="number" min="0" step="100" value={draftFilters.maxPrice} onChange={(event) => setDraftFilters((current) => ({ ...current, maxPrice: event.target.value }))} placeholder="Maximum" className="w-full rounded-xl border border-hairline bg-white px-3 py-3 text-sm text-ink outline-none focus:border-pepper" /></div></div>
            <div><label htmlFor="minimum-rating" className="mb-2 block text-sm font-semibold text-ink">Minimum restaurant rating</label><select id="minimum-rating" value={draftFilters.minRating} onChange={(event) => setDraftFilters((current) => ({ ...current, minRating: event.target.value }))} className="w-full rounded-xl border border-hairline bg-white px-3 py-3 text-sm text-ink outline-none focus:border-pepper"><option value="">Any rating</option><option value="3">3.0 and above</option><option value="3.5">3.5 and above</option><option value="4">4.0 and above</option><option value="4.5">4.5 and above</option></select></div>
            <div><label htmlFor="dish-sort" className="mb-2 block text-sm font-semibold text-ink">Sort dishes by</label><select id="dish-sort" value={draftFilters.sort} onChange={(event) => setDraftFilters((current) => ({ ...current, sort: event.target.value }))} className="w-full rounded-xl border border-hairline bg-white px-3 py-3 text-sm text-ink outline-none focus:border-pepper"><option value="newest">Recently added</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option><option value="rating">Top-rated restaurants</option></select></div>
          </div>
          {filterError && <p role="alert" className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{filterError}</p>}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={clearFilters} className="rounded-xl px-4 py-3 text-sm font-semibold text-ink-soft transition hover:bg-sand hover:text-pepper">Clear all</button><button type="button" onClick={applyFilters} className="rounded-xl bg-pepper px-6 py-3 text-sm font-bold text-white transition hover:bg-pepper-dark">Apply filters</button></div>
        </Modal>
      )}
      {cartConflict && <ConfirmModal title="Switch restaurants?" message={cartConflict.message} confirmLabel="Replace cart" onCancel={() => setCartConflict(null)} onConfirm={() => addToCart(cartConflict.item, true)} />}
    </div>
  );
}

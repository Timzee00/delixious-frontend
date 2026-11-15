import { Link } from 'react-router-dom';
import Img from './Img.jsx';
import { formatNaira } from '../lib/format.js';

function StarIcon() {
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true"><path d="m12 2.7 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.3l6.3-.9L12 2.7Z" /></svg>;
}

export default function FoodCard({ item, onAdd, adding }) {
  const restaurant = item.restaurants;
  const restaurantPath = '/restaurants/' + (restaurant?.id || item.restaurant_id);
  const rating = Number(restaurant?.rating_avg || 0);

  return (
    <article className="group h-full overflow-hidden rounded-[24px] border border-[#F2E6DE] bg-white shadow-[0_8px_26px_rgba(76,38,19,0.07)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(76,38,19,0.12)]">
      <Link to={restaurantPath} className="relative block overflow-hidden">
        <Img
          src={item.image_url}
          alt={item.name}
          fallbackText={item.name?.[0]}
          frameClassName="h-48 w-full overflow-hidden bg-[#F7E7DD] sm:h-52"
          imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-ink shadow-sm">
          {item.category || 'Freshly prepared'}
        </span>
        {rating > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-xs font-bold text-ink shadow-sm">
            <span className="text-[#F59E0B]"><StarIcon /></span>{rating.toFixed(1)}
          </span>
        )}
      </Link>

      <div className="p-4 sm:p-4">
        <div className="min-w-0">
          <Link to={restaurantPath} className="line-clamp-1 font-display text-base font-bold text-ink transition-colors hover:text-pepper sm:text-lg">
            {item.name}
          </Link>
          <p className="mt-1 truncate text-xs text-ink-soft sm:text-sm">{restaurant?.name || 'Restaurant'}</p>
        </div>
        {item.description && <p className="mt-2 line-clamp-2 min-h-8 text-xs leading-5 text-ink-soft">{item.description}</p>}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#F4E8DF] pt-3">
          <span className="font-display text-lg font-bold text-pepper sm:text-xl">{formatNaira(item.price)}</span>
          <button
            type="button"
            onClick={() => onAdd?.(item)}
            disabled={!onAdd || adding}
            className="inline-flex items-center gap-2 rounded-full bg-pepper px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-pepper-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding ? 'Adding...' : 'Add'}
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </div>
    </article>
  );
}

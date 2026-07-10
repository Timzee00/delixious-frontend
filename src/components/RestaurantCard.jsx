import { Link } from 'react-router-dom';
import Img from './Img.jsx';

export default function RestaurantCard({ restaurant }) {
  return (
    <Link to={`/restaurants/${restaurant.id}`} className="ticket group block transition-shadow hover:shadow-md">
      <div className="relative">
        <Img
          src={restaurant.cover_image_url}
          fallbackText={restaurant.name?.[0]}
          frameClassName="h-36 w-full overflow-hidden rounded-t-xl bg-hairline"
          imgClassName="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
            restaurant.is_open ? 'bg-jade text-white' : 'bg-ink-soft text-white'
          }`}
        >
          {restaurant.is_open ? 'Open' : 'Closed'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold text-ink">{restaurant.name}</h3>
          {restaurant.rating_count > 0 && (
            <span className="flex shrink-0 items-center gap-1 font-mono text-xs font-semibold text-gold">
              ★ {restaurant.rating_avg}
            </span>
          )}
        </div>
        {restaurant.cuisine_type && <p className="mt-1 text-sm text-ink-soft">{restaurant.cuisine_type}</p>}
      </div>
    </Link>
  );
}

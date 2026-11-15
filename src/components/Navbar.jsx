import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';

function Icon({ name, className = 'h-5 w-5' }) {
  const icons = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.8 8.2-2.5 5.1-5.1 2.5 2.5-5.1 5.1-2.5Z" /></>,
    store: <><path d="M3 10h18l-1.3-6H4.3L3 10Z" /><path d="M5 10v10h14V10M9 20v-6h6v6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>,
    cart: <><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 8H6" /><circle cx="10" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}

export default function Navbar() {
  const { isAuthenticated, profile, logout } = useAuth();
  const { itemCount: cartCount } = useCart();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const navClass = ({ isActive }) => isActive ? 'text-sm font-semibold text-pepper' : 'text-sm font-medium text-ink-soft transition hover:text-ink';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#F0E6DD] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="shrink-0 leading-none">
            <span className="font-display text-[25px] font-bold tracking-[-0.06em] text-[#21120F] sm:text-3xl">Deli<span className="text-pepper">xious.</span></span>
            <span className="mt-1 block text-[10px] italic text-ink-soft sm:text-xs">Good Food. Good Mood.</span>
          </Link>

          <div className="hidden items-center gap-3 rounded-full bg-[#FFF5EF] px-4 py-2.5 md:flex">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-pepper/10 text-pepper"><Icon name="pin" className="h-5 w-5" /></span>
            <div className="leading-tight">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Delivery details</span>
              <span className="mt-1 block text-sm font-semibold text-ink">Confirmed at checkout</span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 lg:flex">
            <NavLink to="/" end className={navClass}>Home</NavLink>
            <NavLink to="/restaurants" className={navClass}>Restaurants</NavLink>
            {isAuthenticated && <NavLink to="/orders" className={navClass}>Orders</NavLink>}
            {(profile?.role === 'restaurant_owner' || profile?.role === 'admin') && <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>}
            {profile?.role === 'admin' && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {isAuthenticated && (
              <Link to="/notifications" className="relative rounded-full p-2.5 text-ink-soft transition hover:bg-sand hover:text-ink" aria-label="Notifications">
                <Icon name="bell" />
                {unreadCount > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-pepper px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </Link>
            )}
            <Link to={isAuthenticated ? '/cart' : '/login'} className="relative rounded-full p-2.5 text-ink-soft transition hover:bg-sand hover:text-ink" aria-label="Shopping bag">
              <Icon name="cart" className="h-6 w-6" />
              {cartCount > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-pepper px-1 text-[9px] font-bold text-white">{cartCount}</span>}
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="rounded-full border border-hairline px-3 py-2 text-xs font-semibold text-ink-soft transition hover:border-pepper hover:text-pepper">Account</Link>
                  <button type="button" onClick={handleLogout} className="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft transition hover:bg-sand hover:text-pepper">Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft hover:text-pepper">Log in</Link>
                  <Link to="/signup" className="rounded-full bg-pepper px-4 py-2 text-xs font-bold text-white transition hover:bg-pepper-dark">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EFE5DC] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-8px_28px_rgba(57,30,18,0.07)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          <BottomLink to="/" label="Home" icon="home" />
          <BottomLink to="/#discover" label="Explore" icon="compass" />
          <BottomLink to="/restaurants" label="Restaurants" icon="store" />
          <BottomLink to={isAuthenticated ? '/cart' : '/login'} label="Cart" icon="cart" count={cartCount} />
          <BottomLink to={isAuthenticated ? '/profile' : '/login'} label="Account" icon="user" />
        </div>
      </nav>
    </>
  );
}

function BottomLink({ to, label, icon, count = 0 }) {
  return (
    <NavLink to={to} end={label === 'Home'} className={({ isActive }) => 'relative flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition ' + (isActive ? 'text-pepper' : 'text-ink-soft')}>
      <span className="relative"><Icon name={icon} className="h-[22px] w-[22px]" />{count > 0 && <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-pepper px-1 text-[9px] font-bold text-white">{count > 9 ? '9+' : count}</span>}</span>
      <span>{label}</span>
    </NavLink>
  );
}

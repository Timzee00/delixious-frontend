import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';

export default function Navbar() {
  const { isAuthenticated, profile, logout } = useAuth();
  const { itemCount: cartCount } = useCart();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-pepper' : 'text-ink-soft hover:text-ink'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="font-display text-xl font-bold tracking-tight text-ink">
          Deli<span className="text-pepper">xious</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className={linkClass}>
              Orders
            </NavLink>
          )}
          {profile?.role === 'restaurant_owner' && (
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/notifications"
                className="relative rounded-full p-2 text-ink-soft transition-colors hover:bg-sand hover:text-ink"
                aria-label="Notifications"
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-pepper px-1 font-mono text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                className="relative rounded-full p-2 text-ink-soft transition-colors hover:bg-sand hover:text-ink"
                aria-label="Cart"
              >
                <CartIcon />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-jade px-1 font-mono text-[10px] font-semibold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                className="rounded-full p-2 text-ink-soft transition-colors hover:bg-sand hover:text-ink"
                aria-label="Profile"
              >
                <ProfileIcon />
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-pepper hover:text-pepper"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-pepper px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pepper-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

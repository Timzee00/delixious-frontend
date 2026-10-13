import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import RestaurantProfileSection from '../components/dashboard/RestaurantProfileSection.jsx';
import MenuManagementSection from '../components/dashboard/MenuManagementSection.jsx';
import OrdersQueueSection from '../components/dashboard/OrdersQueueSection.jsx';
import MerchantSettings from '../components/dashboard/MerchantSettings.jsx';
import MerchantOrderSummary from '../components/dashboard/MerchantOrderSummary.jsx';
import RestaurantTeamSection from '../components/dashboard/RestaurantTeamSection.jsx';
import RestaurantHiringSection from '../components/dashboard/RestaurantHiringSection.jsx';

const TABS = ['Overview', 'Profile', 'Menu', 'Orders', 'Team', 'Hiring', 'Settings'];

export default function Dashboard() {
  const [restaurants, setRestaurants] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [error, setError] = useState('');
  const [shareNotice, setShareNotice] = useState('');
  const [inviteCandidateEmail, setInviteCandidateEmail] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setError('');
    try {
      const { data } = await api.get('/restaurants/mine');
      setRestaurants(data.restaurants || []);
      setActiveId((id) => id && data.restaurants.some((r) => r.id === id) ? id : data.restaurants[0]?.id || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load your restaurants.');
      setRestaurants([]);
    }
  }

  function handleRestaurantUpdated(updated) {
    setRestaurants((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
  }

  function handleRestaurantCreated(created) {
    setRestaurants((prev) => [...(prev || []), created]);
    setActiveId(created.id);
    setTab('Settings');
  }

  const activeRestaurant = restaurants?.find((r) => r.id === activeId) || null;

  async function shareStorefront() {
    if (!activeId) return;
    const url = `${window.location.origin}/share/restaurants/${activeId}`;
    try {
      if (navigator.share) await navigator.share({ title: activeRestaurant?.name || 'Restaurant', url });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareNotice('Your restaurant social link has been copied.');
      } else setShareNotice(url);
    } catch (err) {
      if (err?.name !== 'AbortError') setShareNotice(url);
    }
  }



  if (restaurants === null) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-ink-soft" role="status">Loading your business workspace...</div>;
  }
  if (!restaurants.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-ink">Create your restaurant</h1>
        <p className="mt-2 text-ink-soft">Build your restaurant profile, upload food and complete payouts before taking online orders.</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        <div className="mt-6"><RestaurantProfileSection restaurant={null} onCreated={handleRestaurantCreated} /></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-pepper">Restaurant workspace</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{activeRestaurant?.name || 'Restaurant dashboard'}</h1>
            <p className="mt-1 text-sm text-ink-soft">Manage your storefront, orders, opening hours and payout settings.</p>
          </div>
          {restaurants.length > 1 && (
            <label className="text-sm text-ink-soft">Your restaurants
              <select value={activeId || ''} onChange={(e) => { setActiveId(e.target.value); setTab('Overview'); }}
                className="ml-2 rounded-lg border border-hairline bg-paper px-3 py-2 text-ink">
                {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={shareStorefront}
            className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-pepper hover:border-pepper">
            Share your restaurant
          </button>
          <button type="button" onClick={() => setTab('Hiring')}
            className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-ink hover:border-pepper">
            Publish a vacancy
          </button>
          <button type="button" onClick={() => setTab('Team')}
            className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-ink hover:border-pepper">
            Invite staff
          </button>
        </div>
        {shareNotice && <p role="status" className="mt-2 rounded-lg bg-jade-soft p-3 text-sm text-jade">{shareNotice}</p>}
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-sand px-3 py-1.5 capitalize text-ink">Approval: {activeRestaurant?.approval_status || 'pending'}</span>
          <span className={`rounded-full px-3 py-1.5 ${activeRestaurant?.is_open ? 'bg-jade-soft text-jade' : 'bg-sand text-ink-soft'}`}>
            {activeRestaurant?.is_open ? 'Accepting orders manually' : 'Manually paused'}
          </span>
          {activeRestaurant?.payout && (
            <span className="rounded-full bg-sand px-3 py-1.5 text-ink-soft">{activeRestaurant.payout.ready ? 'Payout ready' : 'Payout setup required'}</span>
          )}
        </div>
        <nav className="no-scrollbar mt-6 flex gap-1 overflow-x-auto border-b border-hairline" aria-label="Restaurant dashboard navigation">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab === t ? 'page' : undefined}
              className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${tab === t ? 'border-pepper text-pepper' : 'border-transparent text-ink-soft hover:text-ink'}`}>
              {t}
            </button>
          ))}
        </nav>
      </header>
      {error && <p role="alert" className="mt-5 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      <div className="mt-6">
        {tab === 'Overview' && (
          <div className="space-y-5">
            <MerchantOrderSummary key={activeId} restaurant={activeRestaurant} onOpenOrders={() => setTab('Orders')} />
            <section className="grid gap-4 md:grid-cols-3">
              <button type="button" onClick={() => setTab('Orders')} className="rounded-2xl border border-hairline bg-paper p-6 text-left hover:border-pepper">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Orders</p>
                <h2 className="mt-2 font-display text-lg font-bold text-ink">View order queue</h2>
                <p className="mt-2 text-sm text-ink-soft">Prepare, manage and complete active orders.</p>
              </button>
              <button type="button" onClick={() => setTab('Menu')} className="rounded-2xl border border-hairline bg-paper p-6 text-left hover:border-pepper">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Catalog</p>
                <h2 className="mt-2 font-display text-lg font-bold text-ink">Manage your dishes</h2>
                <p className="mt-2 text-sm text-ink-soft">Edit prices, availability, images and descriptions.</p>
              </button>
              <button type="button" onClick={() => setTab('Settings')} className="rounded-2xl border border-hairline bg-paper p-6 text-left hover:border-pepper">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Onboarding</p>
                <h2 className="mt-2 font-display text-lg font-bold text-ink">Business settings</h2>
                <p className="mt-2 text-sm text-ink-soft">Bank verification, operating schedule and account readiness.</p>
              </button>
            </section>
            <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
              <h2 className="font-display text-lg font-bold text-ink">Complete your business setup</h2>
              <p className="mt-2 text-sm text-ink-soft">Get your restaurant approved, connect a verified payout account and publish available dishes so customers can order.</p>
              <button type="button" onClick={() => setTab('Settings')} className="mt-4 rounded-lg bg-pepper px-5 py-3 text-sm font-semibold text-white">Open business settings</button>
            </section>
          </div>
        )}
        {tab === 'Profile' && <RestaurantProfileSection key={activeId} restaurant={activeRestaurant} onUpdated={handleRestaurantUpdated} />}
        {tab === 'Menu' && <MenuManagementSection key={activeId} restaurant={activeRestaurant} />}
        {tab === 'Orders' && <OrdersQueueSection key={activeId} restaurant={activeRestaurant} />}
        {tab === 'Team' && <RestaurantTeamSection key={activeId} restaurant={activeRestaurant} initialEmail={inviteCandidateEmail} onInviteCreated={() => setInviteCandidateEmail('')} />}
        {tab === 'Hiring' && <RestaurantHiringSection key={activeId} restaurant={activeRestaurant} onInviteApplicant={(email) => { setInviteCandidateEmail(email); setTab('Team'); }} />}
        {tab === 'Settings' && (
          <MerchantSettings restaurant={activeRestaurant} onUpdated={handleRestaurantUpdated}
            openProfile={() => setTab('Profile')} openMenu={() => setTab('Menu')} />
        )}
      </div>
    </div>
  );
}

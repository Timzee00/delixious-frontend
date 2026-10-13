import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import StaffMenuAvailability from '../components/staff/StaffMenuAvailability.jsx';

function StaffOrderQueue({ membership }) {
  const [orders, setOrders] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const restaurantId = membership.restaurant_id;
  const role = membership.staff_role;

  async function refresh(currentPage = page) {
    setError('');
    try {
      const { data } = await api.get(`/staff/restaurants/${restaurantId}/orders`, { params: { page: currentPage, limit: 20 } });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) { setError(err.response?.data?.error || 'Could not load staff orders.'); }
  }

  useEffect(() => {
    setPage(1);
    setOrders(null);
    refresh(1);
    const id = setInterval(() => { if (document.visibilityState === 'visible') refresh(1); }, 30000);
    return () => clearInterval(id);
  }, [restaurantId]);

  function allowedNext(status) {
    if (role === 'kitchen') return status === 'confirmed' ? 'preparing' : null;
    if (role === 'counter') return status === 'pending' ? 'confirmed' : null;
    return { pending: 'confirmed', confirmed: 'preparing' }[status] || null;
  }

  async function advance(order, next) {
    setError(''); setBusy(order.id);
    try {
      await api.patch(`/staff/orders/${order.id}/status`, { status: next });
      await refresh();
    } catch (err) { setError(err.response?.data?.error || 'Could not update this order.'); }
    finally { setBusy(null); }
  }

  return (
    <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Kitchen & order queue</h2>
          <p className="mt-1 text-sm text-ink-soft">Paid orders for {membership.restaurants?.name}, with actions permitted by your staff role.</p>
        </div>
        <button type="button" onClick={() => refresh()} className="rounded-lg border border-hairline px-3 py-2 text-sm font-semibold text-ink">Refresh</button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {orders === null && <p role="status" className="mt-4 text-sm text-ink-soft">Loading your orders...</p>}
      {orders?.length === 0 && <p className="mt-4 text-sm text-ink-soft">No paid orders found for this restaurant.</p>}
      <div className="mt-4 space-y-3">
        {orders?.map((order) => {
          const next = allowedNext(order.status);
          return <article key={order.id} className="rounded-xl border border-hairline bg-sand p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-mono text-sm font-semibold text-ink">Order #{order.id.slice(0,8)}</p>
              <span className="rounded-lg bg-paper px-2 py-1 text-xs capitalize text-ink">{order.status.replace(/_/g,' ')}</span>
            </div>
            <p className="mt-2 text-xs text-ink-soft">{new Date(order.created_at).toLocaleString()}</p>
            <div className="mt-3 space-y-1 text-sm text-ink">
              {order.order_items?.map((item) => <p key={item.id}>{item.quantity} × {item.name_snapshot}</p>)}
            </div>
            {next && <button type="button" disabled={busy === order.id} onClick={() => advance(order,next)}
              className="mt-4 rounded-lg bg-pepper px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
              {busy === order.id ? 'Updating...' : next === 'confirmed' ? 'Confirm paid order' : 'Start preparing'}
            </button>}
          </article>;
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-soft">
        <span>Page {page} · {total} orders</span>
        <div className="flex gap-2">
          <button type="button" disabled={page === 1} onClick={() => { setPage(page - 1); refresh(page - 1); }}
            className="rounded-lg border border-hairline px-3 py-2 disabled:opacity-40">Previous</button>
          <button type="button" disabled={page * 20 >= total} onClick={() => { setPage(page + 1); refresh(page + 1); }}
            className="rounded-lg border border-hairline px-3 py-2 disabled:opacity-40">Next</button>
        </div>
      </div>
    </section>
  );
}

export default function StaffWorkspace() {
  const [memberships, setMemberships] = useState(null);
  const [activeId, setActiveId] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    api.get('/staff/mine').then(({ data }) => {
      if (!mounted) return;
      setMemberships(data.memberships || []);
      setActiveId((data.memberships || [])[0]?.restaurant_id || '');
    }).catch((err) => { if (mounted) { setError(err.response?.data?.error || 'Cannot load staff access.'); setMemberships([]); } });
    return () => { mounted = false; };
  }, []);
  const membership = memberships?.find((item) => item.restaurant_id === activeId);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wider text-pepper">Delixious Teams</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Staff workspace</h1>
        <p className="mt-2 text-sm text-ink-soft">Your personal login is linked only to restaurants that invited you. Roles control what you can see and change.</p>
        {memberships?.length > 0 && <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="text-sm text-ink">Restaurant
            <select value={activeId} onChange={(e) => setActiveId(e.target.value)}
              className="ml-2 rounded-lg border border-hairline bg-paper px-3 py-2 text-ink">
              {memberships.map((m) => <option value={m.restaurant_id} key={m.restaurant_id}>{m.restaurants?.name || m.restaurant_id.slice(0,8)}</option>)}
            </select>
          </label>
          <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold capitalize text-ink-soft">{membership?.staff_role}</span>
        </div>}
      </header>
      {error && <p role="alert" className="mt-5 rounded-lg bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      {memberships === null && <p role="status" className="mt-6 text-sm text-ink-soft">Loading staff workspace...</p>}
      {memberships?.length === 0 && <section className="mt-6 rounded-2xl border border-hairline bg-paper p-6">
        <h2 className="font-display text-lg font-bold text-ink">No active restaurant access</h2>
        <p className="mt-2 text-sm text-ink-soft">Ask the restaurant owner for an invitation to the email address on your Delixious account.</p>
        <Link to="/profile" className="mt-3 inline-block text-sm font-semibold text-pepper">Check your profile</Link>
      </section>}
      {membership && <div className="mt-6 space-y-5">
        <StaffOrderQueue key={membership.restaurant_id} membership={membership}/>
        {['owner','manager','kitchen'].includes(membership.staff_role) &&
          <StaffMenuAvailability key={membership.restaurant_id} membership={membership}/>}
      </div>}
    </div>
  );
}

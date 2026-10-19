import { useEffect, useState } from 'react';
import api from '../../lib/api.js';

export default function StaffMenuAvailability({ membership }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const restaurantId = membership.restaurant_id;

  async function load() {
    setError('');
    try {
      const { data } = await api.get(`/staff/restaurants/${restaurantId}/menu`);
      setItems(data.menu_items || []);
    } catch (err) { setError(err.response?.data?.error || 'Cannot load restaurant menu.'); }
  }
  useEffect(() => { setItems(null); load(); }, [restaurantId]);

  async function update(item) {
    setBusy(item.id); setError('');
    try {
      const { data } = await api.patch(
        `/staff/restaurants/${restaurantId}/menu/${item.id}/availability`,
        { is_available: !item.is_available }
      );
      setItems((existing) => existing.map((current) => current.id === item.id ? data.menu_item : current));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update this item.');
    } finally { setBusy(''); }
  }
  return (
    <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Dish availability</h2>
          <p className="mt-1 text-sm text-ink-soft">Kitchen and managers can mark a dish sold out or available. Price and payout changes remain owner-controlled.</p>
        </div>
        <button type="button" onClick={load} className="rounded-lg border border-hairline px-3 py-2 text-sm font-semibold text-ink">Refresh</button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {!items && <p role="status" className="mt-3 text-sm text-ink-soft">Loading menu...</p>}
      {items?.length === 0 && <p className="mt-3 text-sm text-ink-soft">No menu items added yet.</p>}
      <div className="mt-4 space-y-2">
        {items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-hairline p-3">
            <div>
              <p className="font-semibold text-ink">{item.name}</p>
              <p className="text-xs text-ink-soft">{item.category || 'Menu'} · {item.is_available ? 'Available' : 'Sold out'}</p>
            </div>
            <button type="button" disabled={busy === item.id} onClick={() => update(item)}
              className="shrink-0 rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-pepper disabled:opacity-40">
              {busy === item.id ? 'Saving...' : item.is_available ? 'Mark sold out' : 'Make available'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

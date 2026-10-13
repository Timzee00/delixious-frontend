import { useCallback, useEffect, useState } from 'react';
import api from '../../lib/api.js';

const PAGE_SIZE = 12;
const money = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;

export default function AvailableDeliveriesSection({ onClaim }) {
  const [deliveries, setDeliveries] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (requestedPage = page, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/delivery/available', { params: { page: requestedPage, limit: PAGE_SIZE } });
      setDeliveries(data.deliveries || []);
      setTotal(data.total ?? 0);
      setPage(requestedPage);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load available deliveries.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(page); }, [page]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load(page, true);
    }, 30000);
    return () => clearInterval(timer);
  }, [page, load]);

  async function claim(orderId) {
    setClaiming(orderId);
    setError('');
    setNotice('');
    try {
      await api.patch(`/delivery/${orderId}/claim`);
      setNotice('Delivery claimed. Pickup and drop-off details are now available in My Deliveries.');
      await load(page, true);
      onClaim?.();
    } catch (err) {
      setError(err.response?.data?.error || 'This delivery may have just been claimed by someone else.');
      await load(page, true);
    } finally { setClaiming(null); }
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Available delivery offers</h2>
          <p className="mt-1 text-sm text-ink-soft">Only paid, restaurant-confirmed offers are available. Your customer’s detailed address is protected until you claim the job.</p>
        </div>
        <button type="button" onClick={() => load(page)}
          className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-ink">Refresh offers</button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg bg-jade-soft p-3 text-sm text-jade">{notice}</p>}
      {loading ? <p role="status" className="mt-5 text-sm text-ink-soft">Looking for available deliveries...</p> : (
        <>
          {!deliveries.length && !error && (
            <div className="mt-5 rounded-2xl border border-hairline bg-paper p-8 text-center">
              <p className="font-semibold text-ink">No available deliveries</p>
              <p className="mt-2 text-sm text-ink-soft">New offers appear after customers pay and restaurants accept their orders. The feed refreshes every 30 seconds while open.</p>
            </div>
          )}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {deliveries.map((delivery) => {
              const order = delivery.orders;
              return <article key={delivery.order_id} className="rounded-2xl border border-hairline bg-paper p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">Delivery #{String(delivery.order_id).slice(0,8)}</p>
                    <h3 className="mt-2 font-display text-lg font-bold text-ink">{order?.restaurants?.name || 'Restaurant'}</h3>
                  </div>
                  <div className="rounded-xl bg-jade-soft px-4 py-2 text-right">
                    <p className="text-xs text-jade">Estimated rider payout</p>
                    <p className="mt-1 text-lg font-bold text-jade">{money(order?.rider_payout_amount)}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium text-ink">Pickup location</p>
                <p className="mt-1 text-sm text-ink-soft">{order?.restaurants?.address || 'Pickup address unavailable'}</p>
                <div className="mt-3 rounded-lg bg-sand p-3 text-xs text-ink-soft">
                  Customer’s exact drop-off location, contact details and directions are available only to the assigned rider.
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-sand px-3 py-1 text-xs capitalize text-ink-soft">{order?.status?.replace(/_/g,' ')}</span>
                  <button type="button" disabled={Boolean(claiming)}
                    onClick={() => claim(delivery.order_id)}
                    className="rounded-lg bg-pepper px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                    {claiming === delivery.order_id ? 'Claiming...' : 'Accept delivery'}
                  </button>
                </div>
              </article>;
            })}
          </div>
          <nav aria-label="Delivery offers pages" className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
            <p className="text-sm text-ink-soft">Page {page} · {total.toLocaleString()} available deliveries</p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-hairline px-3 py-2 text-sm text-ink disabled:opacity-40">Previous</button>
              <button type="button" disabled={page * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-hairline px-3 py-2 text-sm text-ink disabled:opacity-40">Next</button>
            </div>
          </nav>
        </>
      )}
    </section>
  );
}

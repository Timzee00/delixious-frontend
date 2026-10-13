import { useCallback, useEffect, useState } from 'react';
import api from '../../lib/api.js';

const METRICS = [
  ['Pending', 'pending'],
  ['Confirmed', 'confirmed'],
  ['Preparing', 'preparing'],
  ['Out for delivery', 'out_for_delivery'],
  ['Paid orders today', 'orders_today'],
];

export default function MerchantOrderSummary({ restaurant, onOpenOrders }) {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const refresh = useCallback(async (signal) => {
    setStatus('loading');
    setError('');
    try {
      const { data } = await api.get(`/restaurants/${restaurant.id}/overview`, { signal });
      if (!signal?.aborted) {
        setStats(data.stats);
        setStatus('ready');
      }
    } catch (err) {
      if (signal?.aborted) return;
      setError(err.response?.data?.error || 'Operational metrics are not available yet. Please try again.');
      setStatus('error');
    }
  }, [restaurant.id]);

  useEffect(() => {
    const controller = new AbortController();
    setStats(null);
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  return (
    <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Live order operations</h2>
          <p className="mt-1 text-sm text-ink-soft">Only paid orders are counted. Today uses Lagos local time.</p>
        </div>
        <button type="button" onClick={() => refresh()} disabled={status === 'loading'}
          className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
          {status === 'loading' ? 'Updating...' : 'Refresh'}
        </button>
      </div>
      {status === 'loading' && !stats && <p role="status" className="mt-4 text-sm text-ink-soft">Loading operational counts...</p>}
      {status === 'error' && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {METRICS.map(([label, key]) => (
            <div key={key} className="rounded-xl border border-hairline bg-sand p-4">
              <p className="text-xs font-medium text-ink-soft">{label}</p>
              <p className="mt-2 font-display text-2xl font-bold text-ink">{(stats[key] ?? 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={onOpenOrders}
        className="mt-5 text-sm font-semibold text-pepper hover:underline">Open order management</button>
    </section>
  );
}

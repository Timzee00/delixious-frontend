import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi.js';

export default function RestaurantsApprovalSection() {
  const [restaurants, setRestaurants] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    load();
  }, [filter, page]);

  async function load() {
    try {
      const { data } = await adminApi.listRestaurants({ status: filter || undefined, page, limit: 20 });
      setRestaurants(data.restaurants);
      setTotal(data.total || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load restaurants.');
    }
  }

  async function setApproval(id, status) {
    try {
      await adminApi.setRestaurantApproval(id, status);
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update restaurant.');
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === s ? 'bg-pepper text-white' : 'bg-sand text-ink-soft hover:text-ink'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-4 space-y-3">
        {restaurants === null && <p className="text-sm text-ink-soft">Loading...</p>}
        {restaurants?.length === 0 && <p className="text-sm text-ink-soft">No restaurants here.</p>}
        {restaurants?.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-paper p-4">
            <div>
              <p className="font-medium text-ink">{r.name}</p>
              <p className="text-sm text-ink-soft">{r.address}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-ink-soft">
                Status: {r.approval_status} {r.paystack_subaccount_code ? '· has payout account' : '· no payout account yet'}
              </p>
            </div>
            {r.approval_status !== 'approved' && (
              <button
                onClick={() => setApproval(r.id, 'approved')}
                className="rounded-lg bg-jade px-3 py-1.5 text-sm font-semibold text-white"
              >
                Approve
              </button>
            )}
            {r.approval_status !== 'rejected' && (
              <button
                onClick={() => setApproval(r.id, 'rejected')}
                className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-danger"
              >
                Reject
              </button>
            )}
          </div>
        ))}
      </div>
      <nav className="mt-5 flex items-center justify-between gap-3 border-t border-hairline pt-4" aria-label="restaurants pagination">
        <span className="text-sm text-ink-soft">Page {page} · {total.toLocaleString()} total</span>
        <div className="flex gap-2">
          <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-hairline px-3 py-2 text-sm disabled:opacity-40">Previous</button>
          <button type="button" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-hairline px-3 py-2 text-sm disabled:opacity-40">Next</button>
        </div>
      </nav>
    </div>
  );
      }

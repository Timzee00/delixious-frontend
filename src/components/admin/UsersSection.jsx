import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi.js';

const ROLES = ['', 'customer', 'restaurant_owner', 'delivery_agent', 'admin'];

export default function UsersSection() {
  const [users, setUsers] = useState(null);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    load();
  }, [role, page]);

  async function load() {
    try {
      const { data } = await adminApi.listUsers({ role: role || undefined, page, limit: 20 });
      setUsers(data.users);
      setTotal(data.total || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load users.');
    }
  }

  async function toggleSuspend(id, current) {
    try {
      await adminApi.setUserSuspension(id, !current);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_suspended: !current } : u)));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update user.');
    }
  }

  return (
    <div>
      <select
        value={role}
        onChange={(e) => { setRole(e.target.value); setPage(1); }}
        className="rounded-lg border border-hairline bg-paper px-3 py-1.5 text-sm text-ink"
      >
        {ROLES.map((r) => (
          <option key={r || 'all'} value={r}>
            {r || 'All roles'}
          </option>
        ))}
      </select>

      {error && <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-4 space-y-2">
        {users === null && <p className="text-sm text-ink-soft">Loading...</p>}
        {users?.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-paper p-3">
            <div>
              <p className="font-medium text-ink">{u.full_name} <span className="text-xs text-ink-soft">({u.role})</span></p>
              <p className="text-sm text-ink-soft">{u.email} · {u.phone}</p>
            </div>
            <button
              onClick={() => toggleSuspend(u.id, u.is_suspended)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                u.is_suspended ? 'bg-jade text-white' : 'border border-hairline text-danger'
              }`}
            >
              {u.is_suspended ? 'Unsuspend' : 'Suspend'}
            </button>
          </div>
        ))}
      </div>
      <nav className="mt-5 flex items-center justify-between gap-3 border-t border-hairline pt-4" aria-label="users pagination">
        <span className="text-sm text-ink-soft">Page {page} · {total.toLocaleString()} total</span>
        <div className="flex gap-2">
          <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-hairline px-3 py-2 text-sm disabled:opacity-40">Previous</button>
          <button type="button" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-hairline px-3 py-2 text-sm disabled:opacity-40">Next</button>
        </div>
      </nav>
    </div>
  );
                             }

import { useEffect, useState } from 'react';
import api from '../../lib/api.js';

const STATES = [
  ['Pending','pending'], ['Processing','processing'], ['Provider accepted','accepted'],
  ['Delivered','delivered'], ['Deferred','deferred'], ['Bounced','bounced'],
  ['Blocked','blocked'], ['Failed','failed'], ['Needs reconciliation','uncertain'],
];

export default function EmailOperationsSection() {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  async function refresh() {
    setLoading(true); setError('');
    try {
      const result = await api.get('/email/health');
      setData(result.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Email queue metrics are not available yet. The new backend and migration are required.');
    } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); },[]);
  return <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
    <div className="flex flex-wrap justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Brevo email operations</h2>
        <p className="mt-1 text-sm text-ink-soft">Transactional delivery metrics, without exposing addresses, invitation links, message content or API keys.</p>
      </div>
      <button type="button" onClick={refresh} disabled={loading}
        className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40">
        {loading ? 'Checking...' : 'Refresh'}
      </button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-4 text-sm text-danger">{error}</p>}
    {data && <>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink">Brevo configuration: {data.configured ? 'Configured' : 'Not configured'}</span>
        <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink">Background delivery: {data.worker_enabled ? 'Enabled' : 'Disabled'}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STATES.map(([label,key]) => <div key={key} className="rounded-xl border border-hairline bg-sand p-4">
          <p className="text-xs font-semibold text-ink-soft">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{(data.counts?.[key] ?? 0).toLocaleString()}</p>
        </div>)}
      </div>
      <p className="mt-5 text-sm text-ink-soft">Accepted means Brevo received the request; it does not guarantee inbox delivery. Uncertain messages need reconciliation before any manual resend to prevent duplicates.</p>
    </>}
  </section>;
}

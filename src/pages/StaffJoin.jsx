import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function StaffJoin() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState(() => params.get('token') || '');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  async function accept(event) {
    event.preventDefault();
    setWorking(true); setError('');
    try {
      await api.post('/staff/accept', { token });
      setToken('');
      navigate('/staff', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not accept your invitation. Ask your manager for a new link.');
    } finally { setWorking(false); }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-hairline bg-paper p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-pepper">Delixious business workspace</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Join your restaurant team</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          A restaurant owner has sent you a private invitation. Your own verified account will receive access to their restaurant according to your role.
        </p>
        <p className="mt-3 text-sm text-ink-soft">Signed in as: <strong className="text-ink">{user?.email}</strong></p>
        {!token ? <p className="mt-4 text-sm text-danger">No invitation token found. Request a fresh invitation from the owner.</p> :
          <form onSubmit={accept} className="mt-5 space-y-4">
            <p className="text-xs text-ink-soft">Only the verified email address invited by the restaurant can accept. Invitations expire after seven days.</p>
            <button type="submit" disabled={working} className="w-full rounded-lg bg-pepper px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {working ? 'Joining restaurant...' : 'Accept invitation'}
            </button>
          </form>}
        <Link to="/staff" className="mt-4 inline-block text-sm font-semibold text-pepper">Go to staff workspace</Link>
        {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}

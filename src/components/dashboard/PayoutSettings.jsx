import { useEffect, useState } from 'react';
import api from '../../lib/api.js';

export default function PayoutSettings({ restaurant, onUpdated }) {
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [providerMode, setProviderMode] = useState('');
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const payout = restaurant.payout;
  const ready = payout?.ready === true;
  const statusKnown = typeof payout?.ready === 'boolean';

  useEffect(() => {
    let active = true;
    setBanks([]);
    setError('');
    setLoadingBanks(true);
    api.get('/restaurants/banks')
      .then(({ data }) => {
        if (!active) return;
        setBanks(data.banks || []);
        setProviderMode(data.mode || '');
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.error || 'Bank directory unavailable. The settings API may not be deployed yet.');
      })
      .finally(() => { if (active) setLoadingBanks(false); });
    return () => { active = false; };
  }, [restaurant.id]);

  async function connect(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
      setError('Select your bank and enter exactly 10 digits for your account number.');
      return;
    }
    if (!window.confirm('Connect this bank account to receive restaurant payouts? To change an existing account later, contact support.')) return;
    setSaving(true);
    try {
      const { data } = await api.post(`/restaurants/${restaurant.id}/bank-details`, {
        bank_code: bankCode,
        account_number: accountNumber,
      });
      onUpdated(data.restaurant);
      setAccountNumber('');
      setBankCode('');
      setMessage(data.message || 'Payout account connected successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to connect this account. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7" aria-labelledby="payout-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="payout-title" className="font-display text-xl font-bold text-ink">Payments & payouts</h2>
          <p className="mt-1 text-sm text-ink-soft">Verify a Nigerian bank account so eligible orders can be paid and settled through Paystack.</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${ready ? 'bg-jade-soft text-jade' : 'bg-sand text-ink-soft'}`}>
          {ready ? 'Payout connected' : statusKnown ? 'Setup required' : 'Status not available'}
        </span>
      </div>
      {ready ? (
        <div className="mt-5 rounded-xl border border-hairline bg-sand p-4">
          <p className="font-medium text-ink">{payout.bank_name || 'Verified bank'}</p>
          <p className="mt-1 text-sm text-ink-soft">{payout.account_name || 'Connected payout account'}</p>
          <p className="mt-1 font-mono text-sm text-ink-soft">{payout.account_last4 ? `Account ending ••••${payout.account_last4}` : 'Account details protected'}</p>
          <p className="mt-3 text-xs text-ink-soft">For bank changes, contact support. We never show your complete account number here.</p>
          <a href="/contact" className="mt-3 inline-block text-sm font-semibold text-pepper hover:underline">Contact support</a>
        </div>
      ) : (
        <form onSubmit={connect} className="mt-5 space-y-4">
          {providerMode && <p className="rounded-lg bg-sand px-3 py-2 text-xs font-medium text-ink-soft">Paystack environment: {providerMode === 'test' ? 'Test mode — no real payouts' : 'Live mode'}</p>}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Bank</span>
            <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}
              disabled={loadingBanks || saving || !statusKnown}
              required className="w-full rounded-lg border border-hairline bg-paper px-3 py-3 text-ink">
              <option value="">{loadingBanks ? 'Loading supported banks...' : 'Choose a bank'}</option>
              {banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">10-digit account number</span>
            <input type="text" inputMode="numeric" autoComplete="off" pattern="[0-9]{10}" maxLength={10}
              value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              disabled={saving || !statusKnown} required
              className="w-full rounded-lg border border-hairline bg-paper px-3 py-3 text-ink" placeholder="Enter 10 digits" />
          </label>
          <p className="text-xs text-ink-soft">Your bank information is sent to the authenticated backend for verification. It is never stored in browser preferences.</p>
          <button type="submit" disabled={saving || loadingBanks || !statusKnown || !banks.length}
            className="rounded-lg bg-pepper px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Verifying with Paystack...' : 'Verify and connect bank'}
          </button>
        </form>
      )}
      {message && <p role="status" className="mt-4 rounded-lg bg-jade-soft p-3 text-sm text-jade">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {!statusKnown && <p className="mt-3 text-xs text-ink-soft">Payout status requires the updated merchant backend. The connection form is locked until it is available.</p>}
    </section>
  );
}

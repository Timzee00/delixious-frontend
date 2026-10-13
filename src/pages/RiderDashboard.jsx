import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import AvailableDeliveriesSection from '../components/rider/AvailableDeliveriesSection.jsx';
import MyDeliveriesSection from '../components/rider/MyDeliveriesSection.jsx';
import EarningsSection from '../components/rider/EarningsSection.jsx';
import PayoutSetupSection from '../components/rider/PayoutSetupSection.jsx';

const TABS = ['Available Jobs', 'My Deliveries', 'Earnings', 'Payout Setup'];

export default function RiderDashboard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('Available Jobs');

  const isApproved = profile?.rider_approval_status === 'approved';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wider text-pepper">Delixious delivery partners</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Your rider workspace</h1>
      <p className="mt-2 text-sm text-ink-soft">Find available deliveries, manage assigned jobs, review earnings and payout setup.</p>

      {!isApproved && (
        <p className="mt-4 rounded-lg bg-sand px-3 py-2 text-sm text-ink-soft">
          Your rider account is pending approval. You'll be able to claim deliveries once an admin approves your account -
          you can still set up your payout account below in the meantime.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-b border-hairline">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-pepper text-pepper' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Available Jobs' && (isApproved ? <AvailableDeliveriesSection onClaim={() => setTab('My Deliveries')} /> : <p className="text-sm text-ink-soft">Awaiting approval.</p>)}
        {tab === 'My Deliveries' && <MyDeliveriesSection />}
        {tab === 'Earnings' && <EarningsSection />}
        {tab === 'Payout Setup' && <PayoutSetupSection />}
      </div>
    </div>
  );
}

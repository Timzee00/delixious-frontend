import { useState } from 'react';
import StatsSection from '../components/admin/StatsSection.jsx';
import RestaurantsApprovalSection from '../components/admin/RestaurantsApprovalSection.jsx';
import RidersApprovalSection from '../components/admin/RidersApprovalSection.jsx';
import UsersSection from '../components/admin/UsersSection.jsx';
import BroadcastSection from '../components/admin/BroadcastSection.jsx';

const TABS = ['Overview', 'Restaurants', 'Riders', 'Users', 'Broadcast'];

export default function Admin() {
  const [tab, setTab] = useState('Overview');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Admin</h1>

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
        {tab === 'Overview' && <StatsSection />}
        {tab === 'Restaurants' && <RestaurantsApprovalSection />}
        {tab === 'Riders' && <RidersApprovalSection />}
        {tab === 'Users' && <UsersSection />}
        {tab === 'Broadcast' && <BroadcastSection />}
      </div>
    </div>
  );
}

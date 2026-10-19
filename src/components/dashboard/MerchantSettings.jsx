import { Link } from 'react-router-dom';
import PayoutSettings from './PayoutSettings.jsx';
import OperatingHoursSettings from './OperatingHoursSettings.jsx';

export default function MerchantSettings({ restaurant, onUpdated, openProfile, openMenu }) {
  const approved = restaurant.approval_status === 'approved';
  const bankReady = restaurant.payout?.ready === true;
  const bankKnown = typeof restaurant.payout?.ready === 'boolean';
  const profileReady = Boolean(restaurant.name && restaurant.address && restaurant.cover_image_url);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
        <div className="flex flex-wrap justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Business readiness</h2>
            <p className="mt-1 text-sm text-ink-soft">Review the steps required to operate smoothly on Delixious.</p>
          </div>
          <span className="rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-ink-soft">
            {approved && bankReady ? 'Payment onboarding complete' : 'Action may be required'}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={openProfile} className="rounded-xl border border-hairline bg-sand p-4 text-left hover:border-pepper">
            <span className="text-xs font-medium text-ink-soft">Marketplace listing</span>
            <strong className="mt-2 block text-base text-ink">{profileReady ? 'Profile ready' : 'Improve listing'}</strong>
            <span className="mt-1 block text-xs text-ink-soft">Name, address, branding and profile details</span>
          </button>
          <div className="rounded-xl border border-hairline bg-sand p-4">
            <span className="text-xs font-medium text-ink-soft">Approval</span>
            <strong className="mt-2 block text-base capitalize text-ink">{restaurant.approval_status || 'Pending review'}</strong>
            <span className="mt-1 block text-xs text-ink-soft">Reviewed by marketplace operations</span>
          </div>
          <a href="#merchant-payouts" className="rounded-xl border border-hairline bg-sand p-4 hover:border-pepper">
            <span className="text-xs font-medium text-ink-soft">Online payments</span>
            <strong className="mt-2 block text-base text-ink">{!bankKnown ? 'Status unavailable' : bankReady ? 'Payout connected' : 'Connect payout account'}</strong>
            <span className="mt-1 block text-xs text-ink-soft">Verified bank and Paystack setup</span>
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={openMenu} type="button" className="rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink hover:border-pepper">Manage food menu</button>
          <Link to="/profile" className="rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink hover:border-pepper">Manage personal account</Link>
          <Link to="/contact" className="rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink hover:border-pepper">Support & assistance</Link>
        </div>
      </section>
      <div id="merchant-payouts"><PayoutSettings key={restaurant.id} restaurant={restaurant} onUpdated={onUpdated} /></div>
      <OperatingHoursSettings key={restaurant.id} restaurant={restaurant} />
      <section className="rounded-2xl border border-hairline bg-paper p-5">
        <h2 className="font-display text-lg font-bold text-ink">Account & support</h2>
        <p className="mt-2 text-sm text-ink-soft">Update your personal contact details and profile image in Account Profile. For changes to connected payout accounts or ownership, contact support; they require additional verification.</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
          <Link to="/profile" className="text-pepper hover:underline">Edit account profile</Link>
          <Link to="/contact" className="text-pepper hover:underline">Contact Delixious support</Link>
        </div>
      </section>
    </div>
  );
}

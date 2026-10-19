import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import ReorderButton from '../orders/ReorderButton.jsx';
import { formatNaira } from '../../lib/format.js';

export default function ReturningCustomerShelf() {
  const [result,setResult] = useState(null);
  const [error,setError] = useState('');
  useEffect(()=>{
    let active=true;
    api.get('/orders/returning-home')
      .then(({data})=>{if(active)setResult(data);})
      .catch(()=>{if(active)setError('Returning-customer history is temporarily unavailable.');});
    return()=>{active=false;};
  },[]);
  if (error) return null; // core discovery stays available if this enhancement fails
  if (!result) return null;
  const recent=result.recent_orders||[];
  const journey=result.journey;
  if(!recent.length&&!journey.completed_orders) return null;
  return <section className="mt-9 rounded-2xl border border-hairline bg-paper p-5 sm:p-7"
    aria-labelledby="returning-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-pepper">Made for your next meal</p>
        <h2 id="returning-title" className="mt-1 font-display text-2xl font-bold text-ink">Welcome back to your favourites</h2>
        <p className="mt-1 text-sm text-ink-soft">Your latest meals, ready to reorder at today's menu prices.</p>
      </div>
      <Link to="/orders" className="text-sm font-semibold text-pepper hover:underline">See order history</Link>
    </div>
    {recent.length>0 && <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {recent.map((order)=><article key={order.id} className="flex flex-col justify-between gap-4 rounded-xl border border-hairline bg-sand p-4">
        <div>
          <p className="text-xs text-ink-soft">{new Date(order.created_at).toLocaleDateString('en-NG',{month:'short',day:'numeric',year:'numeric'})}</p>
          <h3 className="mt-2 font-display text-base font-bold text-ink">{order.restaurants?.name || 'Restaurant'}</h3>
          <p className="mt-1 text-xs text-ink-soft">{formatNaira(order.total_amount)} last time, including delivery</p>
        </div>
        <ReorderButton orderId={order.id} compact />
      </article>)}
    </div>}
    {journey && <div className="mt-5 flex flex-col gap-3 rounded-xl border border-hairline p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Your food journey</p>
        <h3 className="mt-1 font-display text-lg font-bold text-ink">{journey.badge}</h3>
        <p className="mt-1 text-xs text-ink-soft">
          {journey.completed_orders} completed order{journey.completed_orders===1?'':'s'}.
          {journey.next_milestone ? ` Next milestone at ${journey.next_milestone.at} completed orders.` : ' All current milestones earned.'}
        </p>
        <p className="mt-1 text-[11px] text-ink-soft">Recognition only — no cash or discount value.</p>
      </div>
      {journey.next_milestone && <div className="w-full shrink-0 sm:w-36">
        <p className="text-xs text-ink-soft">{journey.next_progress}% to next</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-hairline">
          <div className="h-full rounded-full bg-pepper" style={{width:`${journey.next_progress}%`}} />
        </div>
      </div>}
    </div>}
  </section>;
}

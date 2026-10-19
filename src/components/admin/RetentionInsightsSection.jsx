import { useEffect,useState } from 'react';
import api from '../../lib/api.js';

const fmt=(number)=>Number(number||0).toLocaleString('en-NG');
export default function RetentionInsightsSection(){
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  async function refresh(){
    setLoading(true);setError('');
    try{
      const result=await api.get('/admin/retention');
      setData(result.data);
    }catch(err){setError(err.response?.data?.error||'Retention metrics are not available until the matching staging backend and migration are enabled.');}
    finally{setLoading(false);}
  }
  useEffect(()=>{refresh();},[]);
  const metrics=[
    ['Completed orders',data?.kpis?.completed_orders],
    ['Repeat orders',data?.kpis?.repeat_orders],
    ['Active customers',data?.kpis?.active_customers],
    ['Returning customers',data?.kpis?.returning_customers],
    ['Repeat-order share',`${data?.kpis?.repeat_order_share_percent??0}%`],
    ['Returning-customer share',`${data?.kpis?.returning_customer_share_percent??0}%`],
  ];
  return <section className="space-y-5">
    <div className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-pepper">Evidence, not vanity metrics</p>
          <h2 className="mt-2 font-display text-xl font-bold text-ink">Customer Retention Insights</h2>
          <p className="mt-1 text-sm text-ink-soft">Trailing 30 days, using only verified paid-and-delivered orders.</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading}
          className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
          {loading?'Checking...':'Refresh'}
        </button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      {data && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map(([label,value])=><div key={label} className="rounded-xl border border-hairline bg-sand p-4">
          <p className="text-xs font-medium text-ink-soft">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {typeof value==='number'?fmt(value):value}
          </p>
        </div>)}
      </div>}
      {data && <p className="mt-4 text-xs leading-5 text-ink-soft">{data.definition} Metrics describe orders and returning customers, not app sessions, open rates or campaign attribution.</p>}
    </div>
    <div className="rounded-2xl border border-hairline bg-paper p-5">
      <h3 className="font-display text-lg font-bold text-ink">Retention features being evaluated</h3>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        Saved dishes, favorite restaurants, order-again checkout, reusable delivery addresses, and optional communication preferences are designed to reduce repeat purchase friction.
        These are product hypotheses; the order data above will help determine whether they actually improve repeat purchase behaviour.
      </p>
    </div>
  </section>;
}

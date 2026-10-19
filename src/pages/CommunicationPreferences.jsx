import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

export default function CommunicationPreferences() {
  const [settings,setSettings]=useState(null);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    let active=true;
    api.get('/preferences/email')
      .then(({data})=>{if(active)setSettings(data.preferences);})
      .catch((err)=>{if(active)setError(err.response?.data?.error||'Your communication preferences could not be loaded.');});
    return()=>{active=false;};
  },[]);
  async function save(event) {
    event.preventDefault();
    setSaving(true);setError('');setNotice('');
    try {
      const {data}=await api.put('/preferences/email',{
        order_updates_email:Boolean(settings.order_updates_email),
        promotional_email_opt_in:Boolean(settings.promotional_email_opt_in),
      });
      setSettings(data.preferences);
      setNotice('Your email preferences were saved. In-app order tracking remains available.');
    }catch(err){setError(err.response?.data?.error||'Could not save your email preferences.');}
    finally{setSaving(false);}
  }
  return <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
    <Link to="/profile" className="text-sm font-semibold text-pepper hover:underline">← Back to profile</Link>
    <div className="mt-5 rounded-2xl border border-hairline bg-paper p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-pepper">Your account, your choices</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">Communication preferences</h1>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        Decide which optional messages Delixious sends. Your transaction records and in-app order updates always remain available.
      </p>
      {!settings&&!error&&<p role="status" className="mt-5 text-sm text-ink-soft">Loading your preferences...</p>}
      {settings&&<form onSubmit={save} className="mt-6 space-y-4">
        <label className="flex items-start gap-3 rounded-xl border border-hairline bg-sand p-4">
          <input type="checkbox" checked={Boolean(settings.order_updates_email)}
            onChange={(e)=>setSettings((old)=>({...old,order_updates_email:e.target.checked}))}
            className="mt-1 h-4 w-4 accent-pepper" disabled={saving} />
          <span>
            <strong className="block text-sm text-ink">Order update emails</strong>
            <span className="mt-1 block text-xs leading-5 text-ink-soft">Email me when my order is accepted or assigned to a rider, and when payment is received. Switching this off does not stop in-app updates.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-hairline p-4">
          <input type="checkbox" checked={Boolean(settings.promotional_email_opt_in)}
            onChange={(e)=>setSettings((old)=>({...old,promotional_email_opt_in:e.target.checked}))}
            className="mt-1 h-4 w-4 accent-pepper" disabled={saving} />
          <span>
            <strong className="block text-sm text-ink">Future promotions — optional consent</strong>
            <span className="mt-1 block text-xs leading-5 text-ink-soft">Record my permission for future restaurant offers. No promotional campaigns are currently enabled. You can withdraw permission here at any time.</span>
          </span>
        </label>
        <p className="text-xs text-ink-soft">Account security and legally necessary messages are managed separately from optional marketing preferences.</p>
        <button type="submit" disabled={saving}
          className="rounded-lg bg-pepper px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {saving?'Saving...':'Save preferences'}
        </button>
      </form>}
      {error&&<p role="alert" className="mt-4 rounded-lg bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      {notice&&<p role="status" className="mt-4 rounded-lg bg-jade-soft p-4 text-sm text-jade">{notice}</p>}
    </div>
  </div>;
}

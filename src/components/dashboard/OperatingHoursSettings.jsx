import { useEffect, useState } from 'react';
import api from '../../lib/api.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT = {
  schedule_enabled: false,
  weekly_hours: DAYS.map((_, weekday) => ({
    weekday, closed: weekday === 0, opens: '09:00', closes: '21:00',
  })),
};

export default function OperatingHoursSettings({ restaurant }) {
  const [settings, setSettings] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    setNotice('');
    setLoading(true);
    setAvailable(false);
    api.get(`/restaurants/${restaurant.id}/operating-settings`).then(({ data }) => {
      if (!active) return;
      setSettings(data.settings);
      setAvailable(true);
    }).catch((err) => {
      if (active) setError(err.response?.data?.error || 'Operating hours service is not available yet.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [restaurant.id]);

  function editDay(weekday, patch) {
    setSettings((old) => ({
      ...old,
      weekly_hours: old.weekly_hours.map((d) =>
        d.weekday === weekday ? { ...d, ...patch } : d),
    }));
    setNotice('');
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (settings.weekly_hours.some((day) => !day.closed && day.opens === day.closes)) {
      setError('Opening and closing times cannot be the same.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put(`/restaurants/${restaurant.id}/operating-settings`, settings);
      setSettings(data.settings);
      setNotice('Operating hours saved. Checkout will honor the schedule when enabled.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save hours. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7" aria-labelledby="hours-title">
      <h2 id="hours-title" className="font-display text-xl font-bold text-ink">Opening hours & availability</h2>
      <p className="mt-1 text-sm text-ink-soft">Times use West Africa Time (Lagos, UTC+1). Owners can set overnight hours by choosing a closing time earlier than opening time.</p>
      <p className="mt-3 rounded-lg bg-sand p-3 text-sm text-ink-soft">
        Manual restaurant status: <strong className="text-ink">{restaurant.is_open ? 'Open' : 'Paused'}</strong>.
        Manual pause always takes priority over scheduled hours. Switch status in the Profile tab.
      </p>
      {loading ? <p className="mt-4 text-sm text-ink-soft">Loading operating settings...</p> : (
        <form className="mt-5 space-y-4" onSubmit={save}>
          <label className="flex items-start gap-3 rounded-lg border border-hairline bg-sand p-4">
            <input type="checkbox" checked={settings.schedule_enabled}
              disabled={!available || saving}
              onChange={(e) => setSettings((old) => ({ ...old, schedule_enabled: e.target.checked }))}
              className="mt-1 h-4 w-4 accent-pepper" />
            <span>
              <strong className="block text-sm text-ink">Use scheduled opening hours at checkout</strong>
              <span className="mt-1 block text-xs text-ink-soft">When disabled, only your manual Open/Paused status controls availability. New accounts start with schedules disabled.</span>
            </span>
          </label>
          <div className="grid gap-2">
            {settings.weekly_hours?.map((day) => (
              <div key={day.weekday} className="grid grid-cols-[minmax(100px,1fr)_auto] gap-2 rounded-lg border border-hairline px-3 py-3 sm:grid-cols-[minmax(105px,1fr)_auto_auto_auto] sm:items-center">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={!day.closed} disabled={!available || saving}
                    onChange={(e) => editDay(day.weekday, { closed: !e.target.checked })}
                    className="h-4 w-4 accent-pepper" />
                  {DAYS[day.weekday]}
                </label>
                <span className="text-xs text-ink-soft sm:hidden">{day.closed ? 'Closed' : 'Open'}</span>
                <label className="text-xs text-ink-soft">
                  Opens
                  <input type="time" value={day.opens} disabled={!available || saving || day.closed}
                    onChange={(e) => editDay(day.weekday, { opens: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-hairline bg-paper p-2 text-sm text-ink" />
                </label>
                <label className="text-xs text-ink-soft">
                  Closes
                  <input type="time" value={day.closes} disabled={!available || saving || day.closed}
                    onChange={(e) => editDay(day.weekday, { closes: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-hairline bg-paper p-2 text-sm text-ink" />
                </label>
                <span className="hidden text-xs text-ink-soft sm:inline">{day.closed ? 'Closed' : 'Open'}</span>
              </div>
            ))}
          </div>
          <button type="submit" disabled={!available || saving}
            className="rounded-lg bg-pepper px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Saving hours...' : 'Save operating hours'}
          </button>
        </form>
      )}
      {notice && <p role="status" className="mt-4 rounded-lg bg-jade-soft p-3 text-sm text-jade">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../lib/api.js';
import Img from '../components/Img.jsx';

const FORM = { applicant_name: '', applicant_email: '', applicant_phone: '', cover_note: '', privacy_consent: false };
export default function RestaurantCareers() {
  const { id } = useParams();
  const [query] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(query.get('job') || null);
  const [form, setForm] = useState(FORM);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let valid = true;
    setLoading(true);
    api.get(`/careers/restaurants/${id}`).then(({ data }) => {
      if (!valid) return;
      setRestaurant(data.restaurant);
      setJobs(data.jobs || []);
      setError('');
    }).catch((err) => { if (valid) setError(err.response?.data?.error || 'Could not load restaurant careers.'); })
      .finally(() => { if (valid) setLoading(false); });
    return () => { valid = false; };
  }, [id]);

  async function apply(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api.post(`/careers/jobs/${activeId}/apply`, form);
      setNotice(data.message);
      setForm(FORM);
      setActiveId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit your application. Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {loading && <p role="status" className="text-ink-soft">Loading careers...</p>}
      {restaurant && <>
        <header className="overflow-hidden rounded-2xl border border-hairline bg-paper">
          <Img src={restaurant.cover_image_url || restaurant.logo_url} alt={restaurant.name}
            frameClassName="h-44 w-full bg-sand sm:h-64" imgClassName="h-full w-full object-cover" />
          <div className="p-5 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-pepper">Careers at {restaurant.name}</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">Work with {restaurant.name}</h1>
            <p className="mt-2 text-sm text-ink-soft">{restaurant.description || 'Join our restaurant team and help us deliver great food.'}</p>
            <p className="mt-2 text-xs text-ink-soft">{restaurant.address}</p>
            <Link className="mt-3 inline-block text-sm font-semibold text-pepper" to={`/restaurants/${id}`}>Visit restaurant storefront</Link>
          </div>
        </header>
        <section className="mt-7 space-y-4">
          <h2 className="font-display text-xl font-bold text-ink">Open positions</h2>
          {!jobs.length && <p className="rounded-xl border border-hairline bg-paper p-6 text-sm text-ink-soft">No published vacancies at the moment. Check back soon.</p>}
          {jobs.map((job) => <article key={job.id} className="rounded-xl border border-hairline bg-paper p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">{job.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{job.location} · {job.job_type.replace(/_/g, ' ')}</p>
              </div>
              <button type="button" onClick={() => { setActiveId(job.id); setError(''); setNotice(''); }}
                className="rounded-lg bg-pepper px-4 py-2 text-sm font-semibold text-white">Apply to this role</button>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-ink-soft">{job.description}</p>
            <a href={`/share/jobs/${job.id}`} className="mt-3 inline-block text-sm font-semibold text-pepper">Share this vacancy</a>
            {activeId === job.id && <form onSubmit={apply} className="mt-6 space-y-3 rounded-xl bg-sand p-4">
              <h4 className="font-semibold text-ink">Apply for {job.title}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-ink">Full name
                  <input required minLength={2} maxLength={120} value={form.applicant_name} onChange={(e) => setForm((f) => ({ ...f, applicant_name: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-hairline bg-paper p-3 text-ink" />
                </label>
                <label className="text-sm font-medium text-ink">Email address
                  <input type="email" required value={form.applicant_email} onChange={(e) => setForm((f) => ({ ...f, applicant_email: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-hairline bg-paper p-3 text-ink" />
                </label>
              </div>
              <label className="block text-sm font-medium text-ink">Phone number (optional)
                <input type="tel" maxLength={30} value={form.applicant_phone} onChange={(e) => setForm((f) => ({ ...f, applicant_phone: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-hairline bg-paper p-3 text-ink" />
              </label>
              <label className="block text-sm font-medium text-ink">Tell us about your experience and availability
                <textarea required minLength={20} maxLength={4000} rows={5} value={form.cover_note}
                  onChange={(e) => setForm((f) => ({ ...f, cover_note: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-hairline bg-paper p-3 text-ink" />
              </label>
              <label className="flex gap-3 text-xs text-ink-soft">
                <input type="checkbox" required checked={form.privacy_consent}
                  onChange={(e) => setForm((f) => ({ ...f, privacy_consent: e.target.checked }))} />
                I consent to Delixious sharing this application with this restaurant for recruitment purposes. Do not include sensitive identity documents.
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={busy} className="rounded-lg bg-pepper px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  {busy ? 'Submitting...' : 'Submit application'}
                </button>
                <button type="button" onClick={() => setActiveId(null)} className="rounded-lg border border-hairline px-4 py-3 text-sm font-medium text-ink">Cancel</button>
              </div>
            </form>}
          </article>)}
        </section>
      </>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-jade-soft p-4 text-sm text-jade">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
    </div>
  );
}

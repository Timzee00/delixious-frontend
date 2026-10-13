import { useEffect, useState } from 'react';
import api from '../../lib/api.js';

const JOB_TYPES = [
  ['full_time','Full-time'], ['part_time','Part-time'],
  ['contract','Contract'], ['internship','Internship'],
];
const empty = { title: '', description: '', location: '', job_type: 'full_time', published: false };

export default function RestaurantHiringSection({ restaurant, onInviteApplicant }) {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(empty);
  const [applications, setApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    try {
      const { data } = await api.get(`/careers/restaurants/${restaurant.id}/manage`);
      setJobs(data.jobs || []);
      setError('');
    } catch (err) { setError(err.response?.data?.error || 'The careers backend is not available yet.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    setLoading(true);
    setJobs([]);
    setApplications({});
    setForm(empty);
    refresh();
  }, [restaurant.id]);

  async function createJob(event) {
    event.preventDefault();
    setBusy(true); setNotice(''); setError('');
    try {
      await api.post(`/careers/restaurants/${restaurant.id}/jobs`, form);
      setForm(empty);
      setNotice('Vacancy saved. Published jobs appear on your public restaurant careers page.');
      await refresh();
    } catch (err) { setError(err.response?.data?.error || 'Could not create vacancy.'); }
    finally { setBusy(false); }
  }

  async function toggleJob(job) {
    setBusy(true); setError(''); setNotice('');
    try {
      await api.patch(`/careers/restaurants/${restaurant.id}/jobs/${job.id}`, {
        published: !job.published,
      });
      setNotice(job.published ? 'Vacancy unpublished.' : 'Vacancy published.');
      await refresh();
    } catch (err) { setError(err.response?.data?.error || 'Could not update vacancy.'); }
    finally { setBusy(false); }
  }

  async function viewApplicants(jobId) {
    setError('');
    try {
      const { data } = await api.get(`/careers/restaurants/${restaurant.id}/jobs/${jobId}/applications`, { params: { page: 1, limit: 50 } });
      setApplications((previous) => ({ ...previous, [jobId]: data }));
    } catch (err) { setError(err.response?.data?.error || 'Could not load applications.'); }
  }

  async function changeApplication(jobId, applicationId, status) {
    setBusy(true); setError('');
    try {
      await api.patch(`/careers/restaurants/${restaurant.id}/jobs/${jobId}/applications/${applicationId}`, { status });
      await viewApplicants(jobId);
    } catch (err) { setError(err.response?.data?.error || 'Could not update application.'); }
    finally { setBusy(false); }
  }

  const careersUrl = `${window.location.origin}/restaurants/${restaurant.id}/careers`;
  const careersShareUrl = `${window.location.origin}/share/careers/${restaurant.id}`;
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wider text-pepper">Your branded hiring page</p>
        <h2 className="mt-2 font-display text-xl font-bold text-ink">{restaurant.name} Careers</h2>
        <p className="mt-2 text-sm text-ink-soft">Applicants see your restaurant's name, photos, location and open positions. Publish a vacancy before promoting its shareable link.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href={careersUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-pepper">Preview careers page</a>
          <button type="button" onClick={async () => {
            try {
              if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
              await navigator.clipboard.writeText(careersShareUrl);
              setNotice('Branded careers link copied.');
            } catch { setError(`Copy this careers share URL: ${careersShareUrl}`); }
          }}
            className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-ink">Copy careers link</button>
        </div>
      </section>
      <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
        <h3 className="font-display text-lg font-bold text-ink">Publish a new vacancy</h3>
        <form onSubmit={createJob} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-ink">Job title
            <input required minLength={3} maxLength={120} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Kitchen Assistant" className="mt-1 block w-full rounded-lg border border-hairline bg-paper p-3 text-ink" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-ink">Location
              <input required minLength={3} maxLength={180} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Ikeja, Lagos" className="mt-1 block w-full rounded-lg border border-hairline bg-paper p-3 text-ink" />
            </label>
            <label className="text-sm font-medium text-ink">Employment type
              <select value={form.job_type} onChange={(e) => setForm((f) => ({ ...f, job_type: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-hairline bg-paper p-3 text-ink">
                {JOB_TYPES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-ink">Responsibilities, requirements and pay details
            <textarea required minLength={20} rows={5} maxLength={5000} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the role, working hours, salary range and what applicants should know."
              className="mt-1 block w-full rounded-lg border border-hairline bg-paper p-3 text-ink" />
          </label>
          <label className="flex gap-3 text-sm text-ink">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            Publish vacancy immediately
          </label>
          <button type="submit" disabled={busy} className="rounded-lg bg-pepper px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Create vacancy</button>
        </form>
      </section>
      <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
        <h3 className="font-display text-lg font-bold text-ink">Your vacancies & applications</h3>
        {loading && <p className="mt-4 text-sm text-ink-soft">Loading vacancies...</p>}
        {!loading && jobs.length === 0 && <p className="mt-4 text-sm text-ink-soft">No vacancies yet. Create one above to start hiring.</p>}
        <div className="mt-4 space-y-4">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-xl border border-hairline bg-sand p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-ink">{job.title}</h4>
                  <p className="mt-1 text-xs text-ink-soft">{job.location} · {job.job_type.replace(/_/g, ' ')} · {job.published ? 'Published' : 'Draft'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => toggleJob(job)} disabled={busy} className="rounded-lg border border-hairline bg-paper px-3 py-2 text-xs font-semibold text-ink disabled:opacity-50">{job.published ? 'Unpublish' : 'Publish'}</button>
                  <button onClick={() => viewApplicants(job.id)} className="rounded-lg border border-hairline bg-paper px-3 py-2 text-xs font-semibold text-ink">View applicants</button>
                  {job.published && <a href={`/share/jobs/${job.id}`} target="_blank" rel="noreferrer" className="rounded-lg border border-hairline bg-paper px-3 py-2 text-xs font-semibold text-pepper">Share job</a>}
                </div>
              </div>
              {!!applications[job.id] && <div className="mt-4 border-t border-hairline pt-3">
                <p className="mb-3 text-xs font-semibold text-ink-soft">{applications[job.id].total} application(s) · First 50 shown</p>
                <div className="space-y-2">
                  {applications[job.id].applications.map((app) => <div key={app.id} className="rounded-lg border border-hairline bg-paper p-3">
                    <p className="font-semibold text-ink">{app.applicant_name}</p>
                    <p className="text-sm text-ink-soft">{app.applicant_email} {app.applicant_phone || ''}</p>
                    <p className="mt-2 whitespace-pre-line text-sm text-ink">{app.cover_note}</p>
                    <label className="mt-3 block text-sm text-ink">Review status
                      <select value={app.status} disabled={busy} onChange={(e) => changeApplication(job.id, app.id, e.target.value)}
                        className="ml-2 rounded-lg border border-hairline bg-paper px-3 py-2 text-ink">
                        {['new','reviewing','shortlisted','rejected'].map((status) => <option key={status} value={status} disabled={status === 'new'}>{status}</option>)}
                      </select>
                    </label>
                    <p className="mt-2 text-xs text-ink-soft">Only shortlisted candidates should be invited to staff access. Invitations are email-bound.</p>
                    {app.status === 'shortlisted' && (
                      <button type="button" onClick={() => onInviteApplicant?.(app.applicant_email)}
                        className="mt-2 rounded-lg border border-pepper px-3 py-2 text-xs font-semibold text-pepper">
                        Invite shortlisted candidate to team
                      </button>
                    )
                  </div>)}
                </div>
              </div>}
            </article>
          ))}
        </div>
      </section>
      {error && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-jade-soft p-3 text-sm text-jade">{notice}</p>}
    </div>
  );
}

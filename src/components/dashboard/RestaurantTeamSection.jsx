import { useEffect, useState } from 'react';
import api from '../../lib/api.js';

const ROLES = [
  ['manager', 'Manager — manage restaurant operations'],
  ['kitchen', 'Kitchen — view and prepare orders'],
  ['counter', 'Counter — confirm paid orders'],
];

export default function RestaurantTeamSection({ restaurant }) {
  const [team, setTeam] = useState({ members: [], invites: [] });
  const [email, setEmail] = useState('');
  const [staffRole, setStaffRole] = useState('kitchen');
  const [latestLink, setLatestLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    setError('');
    try {
      const { data } = await api.get(`/staff/restaurants/${restaurant.id}/team`);
      setTeam(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Team service is not yet available. Deploy the staging backend to enable it.');
    } finally { setLoading(false); }
  }
  useEffect(() => {
    setTeam({ members: [], invites: [] });
    setLatestLink('');
    setLoading(true);
    refresh();
  }, [restaurant.id]);

  async function invite(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLatestLink('');
    setWorking('invite');
    try {
      const { data } = await api.post(`/staff/restaurants/${restaurant.id}/invites`, {
        email: email.trim(), staff_role: staffRole,
      });
      setLatestLink(data.invite_url);
      setEmail('');
      setNotice('Invitation created. Share the single-use link privately with the intended recipient.');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create this invitation.');
    } finally { setWorking(''); }
  }

  async function updateMember(userId, active) {
    if (!window.confirm(active ? 'Restore this team member’s access?' : 'Revoke access to this restaurant?')) return;
    setError('');
    setWorking(userId);
    try {
      await api.patch(`/staff/restaurants/${restaurant.id}/members/${userId}`, { active });
      setNotice('Team access updated.');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update this team member.');
    } finally { setWorking(''); }
  }

  async function copyInvite() {
    try { await navigator.clipboard.writeText(latestLink); setNotice('Invitation link copied.'); }
    catch { setNotice('Copy the invitation link from the field below.'); }
  }

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
        <h2 className="font-display text-xl font-bold text-ink">Your restaurant team</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">Invite employees using their own verified Delixious account. Never share the owner password. Permissions are limited to this restaurant.</p>
        <form onSubmit={invite} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(190px,1fr)_auto] sm:items-end">
          <label className="text-sm font-medium text-ink">Staff email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off"
              required placeholder="employee@example.com"
              className="mt-1 block w-full rounded-lg border border-hairline bg-paper px-3 py-3 text-ink" />
          </label>
          <label className="text-sm font-medium text-ink">Access level
            <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-hairline bg-paper px-3 py-3 text-ink">
              {ROLES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </label>
          <button type="submit" disabled={working === 'invite'}
            className="rounded-lg bg-pepper px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {working === 'invite' ? 'Creating...' : 'Invite employee'}
          </button>
        </form>
        {latestLink && (
          <div className="mt-4 rounded-xl border border-jade bg-jade-soft p-4">
            <p className="font-semibold text-ink">Private invitation created — expires in 7 days</p>
            <input type="text" readOnly value={latestLink} onFocus={(e) => e.target.select()}
              className="mt-2 w-full rounded-lg border border-hairline bg-paper p-2 text-sm text-ink" aria-label="One-time invitation link" />
            <button type="button" onClick={copyInvite} className="mt-2 rounded-lg border border-jade px-4 py-2 text-sm font-medium text-jade">Copy private link</button>
            <p className="mt-2 text-xs text-ink-soft">Send privately to the invited email owner. Public posting of staff invite links is not recommended.</p>
          </div>
        )}
      </header>

      <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
        <h3 className="font-display text-lg font-bold text-ink">Team members</h3>
        {loading && <p className="mt-3 text-sm text-ink-soft">Loading your team...</p>}
        {!loading && !team.members.length && <p className="mt-3 text-sm text-ink-soft">No employees have joined yet.</p>}
        <div className="mt-3 space-y-2">
          {team.members.map((member) => (
            <div key={member.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline p-3">
              <div>
                <p className="text-sm font-semibold text-ink">{member.full_name || `Member •••${member.user_id.slice(-6)}`}</p>
                <p className="text-xs capitalize text-ink-soft">{member.staff_role} · {member.active ? 'Active' : 'Revoked'}</p>
              </div>
              <button type="button" disabled={Boolean(working)}
                onClick={() => updateMember(member.user_id, !member.active)}
                className="rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-pepper disabled:opacity-40">
                {member.active ? 'Revoke access' : 'Restore access'}
              </button>
            </div>
          ))}
        </div>
        {!!team.invites?.length && (
          <div className="mt-5 border-t border-hairline pt-4">
            <h4 className="text-sm font-bold text-ink">Recent invitations</h4>
            <div className="mt-3 space-y-2">
              {team.invites.map((item) => (
                <p key={item.id} className="text-sm text-ink-soft">
                  {item.email} · {item.staff_role} · {item.accepted_at ? 'Accepted' : new Date(item.expires_at) < new Date() ? 'Expired' : 'Pending'}
                </p>
              ))}
            </div>
          </div>
        )}
      </section>
      {error && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-jade-soft p-3 text-sm text-jade">{notice}</p>}
    </section>
  );
}

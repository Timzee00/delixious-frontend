import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import FormField from '../components/FormField.jsx';
import ImagePicker from '../components/ImagePicker.jsx';

export default function Profile() {
  const { profile, user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({ full_name: fullName, phone, avatar_url: avatarUrl });
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 12) {
      setPasswordError('Your new password must be at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Could not change password. Try again.');
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Your profile</h1>

      <form onSubmit={handleSubmit} className="ticket mt-6 space-y-4 p-6">
        <ImagePicker
          url={avatarUrl}
          category="avatar"
          shape="round"
          onUploaded={setAvatarUrl}
        />

        <FormField label="Full name" value={fullName} onChange={setFullName} required />
        <FormField label="Phone" value={phone} onChange={setPhone} type="tel" />

        <div>
          <span className="mb-1 block text-sm font-medium text-ink">Email</span>
          <p className="rounded-lg border border-hairline bg-sand px-3 py-2 text-sm text-ink-soft">{user?.email}</p>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-ink">Account type</span>
          <p className="rounded-lg border border-hairline bg-sand px-3 py-2 text-sm capitalize text-ink-soft">
            {profile?.role?.replace(/_/g, ' ')}
          </p>
        </div>

        {message && (
          <p role="status" aria-live="polite" className="rounded-lg bg-jade-soft px-3 py-2 text-sm text-jade">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" aria-live="polite" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-pepper py-2.5 font-semibold text-white transition-colors hover:bg-pepper-dark disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
      <section className="ticket mt-6 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Notifications & privacy</h2>
        <p className="mt-2 text-sm text-ink-soft">Choose optional emails and manage your consent. In-app order tracking always stays accessible.</p>
        <Link to="/preferences" className="mt-3 inline-block text-sm font-semibold text-pepper hover:underline">Manage communication preferences →</Link>
      </section>
      <form onSubmit={handlePasswordChange} className="ticket mt-6 space-y-4 p-6">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Password & account security</h2>
          <p className="mt-1 text-sm text-ink-soft">Confirm your current password to choose a new one. You will be asked to sign in again.</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Current password</span>
          <input type="password" autoComplete="current-password" required
            value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-paper px-3 py-3 text-ink" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">New password (12 characters minimum)</span>
          <input type="password" autoComplete="new-password" required minLength={12}
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-paper px-3 py-3 text-ink" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Confirm new password</span>
          <input type="password" autoComplete="new-password" required
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-paper px-3 py-3 text-ink" />
        </label>
        {passwordError && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{passwordError}</p>}
        <button type="submit" disabled={passwordBusy}
          className="w-full rounded-lg border border-hairline px-5 py-3 text-sm font-semibold text-ink hover:border-pepper disabled:opacity-50">
          {passwordBusy ? 'Updating password...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

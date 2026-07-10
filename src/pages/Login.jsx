import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import FormField from '../components/FormField.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not log in. Check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="ticket p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-pepper">Welcome back</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Log in to Delixious</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <FormField
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            required
          />

          {error && (
            <p role="alert" aria-live="polite" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-pepper py-2.5 font-semibold text-white transition-colors hover:bg-pepper-dark disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          New to Delixious?{' '}
          <Link to="/signup" className="font-medium text-pepper hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

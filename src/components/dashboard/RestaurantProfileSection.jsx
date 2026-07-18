import { useState } from 'react';
import api from '../../lib/api.js';
import FormField from '../FormField.jsx';
import ImagePicker from '../ImagePicker.jsx';

const CUISINES = ['Nigerian', 'Continental', 'Chinese', 'Fast Food', 'Grills', 'Seafood', 'Pastries', 'Other'];

export default function RestaurantProfileSection({ restaurant, onCreated, onUpdated }) {
  const isEdit = Boolean(restaurant);
  const [form, setForm] = useState({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    cuisine_type: restaurant?.cuisine_type || CUISINES[0],
    address: restaurant?.address || '',
    logo_url: restaurant?.logo_url || '',
    cover_image_url: restaurant?.cover_image_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      setError('Name and address are required.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (isEdit) {
        const { data } = await api.put(`/restaurants/${restaurant.id}`, form);
        onUpdated(data.restaurant);
        setMessage('Restaurant updated.');
      } else {
        const { data } = await api.post('/restaurants', form);
        onCreated(data.restaurant);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your restaurant.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleOpen() {
    setTogglingOpen(true);
    setError('');
    try {
      const { data } = await api.patch(`/restaurants/${restaurant.id}/toggle-open`);
      onUpdated(data.restaurant);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update open status.');
    } finally {
      setTogglingOpen(false);
    }
  }

  return (
    <div>
      {isEdit && (
        <div className="ticket mb-6 flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-ink-soft">Currently</p>
            <p className={`font-display text-lg font-bold ${restaurant.is_open ? 'text-jade' : 'text-ink-soft'}`}>
              {restaurant.is_open ? 'Open for orders' : 'Closed'}
            </p>
          </div>
          <button
            onClick={handleToggleOpen}
            disabled={togglingOpen}
            className={`rounded-lg border-2 bg-transparent px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
              restaurant.is_open
                ? 'border-ink-soft text-ink-soft hover:bg-ink-soft/10'
                : 'border-jade text-jade hover:bg-jade/10'
            }`}
          >
            {togglingOpen ? 'Updating...' : restaurant.is_open ? 'Close restaurant' : 'Open restaurant'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={isEdit ? 'ticket space-y-4 p-6' : 'space-y-4'}>
        <FormField label="Restaurant name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />

        <div>
          <span className="mb-1 block text-sm font-medium text-ink">Cuisine type</span>
          <select
            value={form.cuisine_type}
            onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })}
            className="w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-ink focus:border-pepper"
          >
            {CUISINES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <FormField label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
        <FormField
          label="Description"
          as="textarea"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
          placeholder="What makes your food special?"
        />

        <div className="grid grid-cols-2 gap-4">
          <ImagePicker
            label="Logo"
            url={form.logo_url}
            category="logo"
            onUploaded={(url) => setForm((f) => ({ ...f, logo_url: url }))}
            size="h-20 w-full"
          />
          <ImagePicker
            label="Cover image"
            url={form.cover_image_url}
            category="cover"
            onUploaded={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
            size="h-20 w-full"
          />
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
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create restaurant'}
        </button>
      </form>
    </div>
  );
}

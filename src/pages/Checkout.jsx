import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';
import { formatNaira } from '../lib/format.js';

export default function Checkout() {
  const { cart } = useCart();
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAddresses,setSavedAddresses] = useState([]);
  const [addressLabel,setAddressLabel] = useState('Home');
  const [savingAddress,setSavingAddress] = useState(false);
  const [addressNotice,setAddressNotice] = useState('');
  const [selectedAddressId,setSelectedAddressId] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/addresses').then(({data})=>{
      if(!active)return;
      const rows=data.addresses||[];
      setSavedAddresses(rows);
      const preferred=rows.find((row)=>row.is_default);
      if(preferred){
        setAddress((old)=>old||preferred.address);
        setCoords((old)=>old|| (preferred.lat != null && preferred.lng != null ? {lat:preferred.lat,lng:preferred.lng} : null));
        setSelectedAddressId(preferred.id);
      }
    }).catch(()=>{ /* manually entered addresses still work */ });
    return ()=>{active=false;};
  },[]);

  function chooseAddress(id) {
    setSelectedAddressId(id);
    const selected=savedAddresses.find((row)=>row.id===id);
    if(selected){
      setAddress(selected.address);
      setCoords(selected.lat != null && selected.lng != null ? {lat:selected.lat,lng:selected.lng} : null);
      setError('');
    }
  }

  async function saveCurrentAddress() {
    if(address.trim().length<5){setError('Enter a full delivery address before saving it.');return;}
    setSavingAddress(true);setAddressNotice('');setError('');
    try{
      const {data}=await api.post('/addresses',{
        label:addressLabel.trim()||'Home',address:address.trim(),
        lat:coords?.lat??null,lng:coords?.lng??null,
      });
      const updated=[data.address,...savedAddresses];
      setSavedAddresses(updated);
      setSelectedAddressId(data.address.id);
      setAddressNotice('Address saved securely to your Delixious account.');
    }catch(err){setError(err.response?.data?.error||'Could not save this address.');}
    finally{setSavingAddress(false);}
  }

  async function makeDefaultAddress() {
    if(!selectedAddressId)return;
    try{
      await api.patch(`/addresses/${selectedAddressId}/default`);
      setSavedAddresses((rows)=>rows.map((row)=>({...row,is_default:row.id===selectedAddressId})));
      setAddressNotice('Your default address has been updated.');
    }catch(err){setError(err.response?.data?.error||'Could not update default address.');}
  }

  async function removeSavedAddress() {
    if(!selectedAddressId||!window.confirm('Remove this saved delivery address?'))return;
    const id=selectedAddressId;
    try{
      await api.delete(`/addresses/${id}`);
      setSavedAddresses((rows)=>rows.filter((row)=>row.id!==id));
      setSelectedAddressId('');
      setAddressNotice('Saved address removed. You can still type a delivery address.');
    }catch(err){setError(err.response?.data?.error||'Could not remove address.');}
  }

  if (!cart || !cart.items.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="ticket p-10">
          <h1 className="font-display text-xl font-bold text-ink">Nothing to check out</h1>
          <p className="mt-2 text-ink-soft">Your cart is empty.</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-pepper px-5 py-2.5 font-semibold text-white hover:bg-pepper-dark"
          >
            Browse restaurants
          </Link>
        </div>
      </div>
    );
  }

  async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Reverse geocoding failed');
    const data = await res.json();
    return data.display_name || null;
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Location services are not available in this browser.');
      return;
    }
    setLocating(true);
    setSelectedAddressId('');
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        try {
          const readableAddress = await reverseGeocode(lat, lng);
          if (readableAddress) {
            setAddress(readableAddress);
          } else {
            setError('Got your location, but could not turn it into an address. Please type it in below.');
          }
        } catch {
          setError('Got your location, but could not look up the address. Please type it in below.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError('Could not get your location. You can still type your address.');
        setLocating(false);
      }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!address.trim()) {
      setError('Enter a delivery address.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/orders/checkout', {
        delivery_address: address.trim(),
        delivery_lat: coords?.lat,
        delivery_lng: coords?.lng,
      });
      window.location.href = data.payment.authorization_url;
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start checkout. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Checkout</h1>

      <div className="ticket mt-6 p-6">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">Order summary</h2>
        <div className="mt-3 space-y-2">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-ink">
                {item.quantity} × {item.menu_item.name}
              </span>
              <span className="font-mono text-ink-soft">{formatNaira(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="ticket-divider mt-3 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Subtotal</span>
            <span className="font-mono font-semibold text-ink">{formatNaira(cart.subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Delivery fee is added at checkout.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ticket mt-6 space-y-4 p-6">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">Delivery address</h2>
        {savedAddresses.length>0 && (
          <div className="rounded-xl border border-hairline bg-sand p-4">
            <label className="block text-sm font-semibold text-ink">Use a saved address
              <select value={selectedAddressId} onChange={(event)=>chooseAddress(event.target.value)}
                className="mt-2 block w-full rounded-lg border border-hairline bg-paper px-3 py-3 text-ink">
                <option value="">Enter another address</option>
                {savedAddresses.map((item)=><option key={item.id} value={item.id}>
                  {item.label}{item.is_default?' (default)':''} — {item.address.slice(0,65)}
                </option>)}
              </select>
            </label>
            {selectedAddressId && <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <button type="button" onClick={makeDefaultAddress} className="font-semibold text-pepper">Make default</button>
              <button type="button" onClick={removeSavedAddress} className="font-semibold text-danger">Remove saved address</button>
            </div>}
          </div>
        )}
        <textarea
          value={address}
          onChange={(e) => { setAddress(e.target.value); setCoords(null); setSelectedAddressId(''); }}
          rows={3}
          placeholder="e.g. 12 Admiralty Way, Lekki Phase 1, Lagos"
          className="w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-ink placeholder:text-ink-soft/60 focus:border-pepper"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="text-sm font-medium text-pepper hover:underline disabled:opacity-60"
        >
          {locating ? 'Locating...' : coords ? 'Location attached ✓' : 'Use my current location'}
        </button>

        <div className="rounded-xl border border-hairline p-4">
          <p className="text-sm font-semibold text-ink">Save for a faster checkout next time</p>
          <p className="mt-1 text-xs text-ink-soft">Optional. Your delivery address stays private to your account. Only save it when you choose to.</p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex-1 text-xs font-medium text-ink">Address label
              <input type="text" maxLength={50} value={addressLabel}
                onChange={(e)=>setAddressLabel(e.target.value)}
                placeholder="Home or Work"
                className="mt-1 block w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-ink" />
            </label>
            <button type="button" disabled={savingAddress||savedAddresses.length>=10}
              onClick={saveCurrentAddress}
              className="rounded-lg border border-pepper px-3 py-2 text-sm font-semibold text-pepper disabled:opacity-40">
              {savingAddress?'Saving...':'Save this address'}
            </button>
          </div>
        </div>
        {addressNotice && <p role="status" className="rounded-lg bg-jade-soft p-3 text-sm text-jade">{addressNotice}</p>}
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-pepper py-3 font-semibold text-white transition-colors hover:bg-pepper-dark disabled:opacity-60"
        >
          {submitting ? 'Redirecting to payment...' : 'Pay with Paystack'}
        </button>
      </form>
    </div>
  );

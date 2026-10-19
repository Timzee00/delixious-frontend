import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { formatNaira } from '../../lib/format.js';

export default function ReorderButton({ orderId, compact = false }) {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [preview,setPreview] = useState(null);
  const [open,setOpen] = useState(false);
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');

  async function show(event) {
    event?.preventDefault();
    event?.stopPropagation();
    setOpen(true);setPreview(null);setError('');setLoading(true);
    try {
      const { data } = await api.get(`/orders/${orderId}/reorder-preview`);
      setPreview(data);
    } catch(err){setError(err.response?.data?.error || 'Cannot check these dishes right now.');}
    finally {setLoading(false);}
  }
  async function restore() {
    if(!preview) return;
    setSaving(true);setError('');
    try {
      const { data } = await api.post(`/orders/${orderId}/reorder`,{confirm_replace:true});
      await refreshCart();
      setOpen(false);
      navigate('/cart',{state:{
        reorderNotice:data.result?.skipped?.length
          ? `${data.result.skipped.length} previously ordered dish(es) were unavailable and not added. Please review your cart.`
          : 'Please review current prices and quantities before checkout.',
      }});
    } catch(err){setError(err.response?.data?.error || 'Could not restore the order. Your existing cart was not changed.');}
    finally {setSaving(false);}
  }
  const ready = preview?.restaurant_ready && preview.items.some(item=>item.available);
  const changed = preview?.items.some(item=>item.available && item.current_price !== item.old_price);
  const unavailable = preview?.items.filter(item=>!item.available).length || 0;
  // Remove scroll from document only while modal open, respecting accessibility.
  useEffect(() => {
    if (!open) return;
    const onEscape=(event)=>{if(event.key==='Escape'&&!saving) setOpen(false);};
    window.addEventListener('keydown',onEscape);
    return ()=>window.removeEventListener('keydown',onEscape);
  },[open,saving]);

  return <>
    <button type="button" onClick={show}
      className={compact
        ? 'rounded-lg border border-pepper px-3 py-2 text-xs font-semibold text-pepper hover:bg-pepper/5'
        : 'rounded-lg bg-pepper px-4 py-2.5 text-sm font-semibold text-white'}>
      Order again
    </button>
    {open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 sm:p-6"
        role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget&&!saving)setOpen(false);}}>
      <section role="dialog" aria-modal="true" aria-labelledby="reorder-title"
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-paper p-5 shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-pepper">Your previous favourites</p>
            <h2 id="reorder-title" className="mt-1 font-display text-2xl font-bold text-ink">Order these dishes again?</h2>
          </div>
          <button type="button" aria-label="Close reorder" onClick={()=>setOpen(false)} disabled={saving}
            className="rounded-lg border border-hairline px-3 py-1 text-ink disabled:opacity-50">✕</button>
        </div>
        {loading && <p role="status" className="mt-5 text-sm text-ink-soft">Checking today's menu and prices...</p>}
        {preview && <>
          <p className="mt-2 text-sm text-ink-soft">{preview.restaurant_name}</p>
          <div className="mt-4 space-y-2">
            {preview.items.map((item,index)=><div key={`${item.menu_item_id}-${index}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-hairline p-3">
              <div>
                <p className="text-sm font-semibold text-ink">{item.quantity} × {item.name}</p>
                {!item.available && <p className="mt-1 text-xs text-danger">{item.reason}</p>}
                {item.available && item.current_price!==item.old_price &&
                  <p className="mt-1 text-xs text-ink-soft">Previous unit price: {formatNaira(item.old_price)}</p>}
              </div>
              <div className="text-right text-sm font-semibold text-ink">
                {item.available ? formatNaira(item.current_price*item.quantity) : 'Unavailable'}
              </div>
            </div>)}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4">
            <span className="text-sm font-medium text-ink">Today's available dishes subtotal</span>
            <strong className="text-lg text-ink">{formatNaira(preview.current_subtotal)}</strong>
          </div>
          {changed && <p className="mt-3 rounded-lg bg-sand p-3 text-sm text-ink-soft">Some prices have changed since your previous order.</p>}
          {unavailable>0 && <p className="mt-3 rounded-lg bg-sand p-3 text-sm text-ink-soft">{unavailable} dish(es) are sold out or discontinued and will be skipped.</p>}
          {!preview.restaurant_ready && <p role="alert" className="mt-3 rounded-lg bg-danger/10 p-3 text-sm text-danger">This restaurant isn't accepting orders right now.</p>}
          <p className="mt-3 text-xs leading-5 text-ink-soft">Continuing replaces your entire current cart. Nothing is charged until you review the cart, enter a delivery address and complete checkout. Checkout independently rechecks availability and prices.</p>
        </>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" disabled={saving} onClick={()=>setOpen(false)}
            className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-ink">Keep my cart</button>
          <button type="button" disabled={!ready||saving||loading} onClick={restore}
            className="rounded-lg bg-pepper px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            {saving ? 'Restoring dishes...' : 'Replace cart with available dishes'}
          </button>
        </div>
      </section>
    </div>}
  </>;
}

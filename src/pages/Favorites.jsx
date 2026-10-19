import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import RestaurantCard from '../components/RestaurantCard.jsx';
import FoodCard from '../components/FoodCard.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { useCart } from '../context/CartContext.jsx';
import { EmptyState, ErrorState, GridSkeleton } from '../components/StateViews.jsx';

export default function Favorites() {
  const { refreshCart } = useCart();
  const [tab,setTab] = useState('dishes');
  const [restaurants, setRestaurants] = useState(null);
  const [dishes,setDishes] = useState(null);
  const [dishTotal,setDishTotal] = useState(0);
  const [dishPage,setDishPage] = useState(1);
  const [adding,setAdding] = useState(null);
  const [cartConflict,setCartConflict] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setError('');
    try {
      const { data } = await api.get('/favorites/restaurants');
      setRestaurants(data.favorites || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load your favorites.');
      setRestaurants([]);
    }
  }

  useEffect(() => { load(); }, []);

  async function loadDishes(page=1) {
    try {
      const {data} = await api.get('/favorites/dishes',{params:{page,limit:20}});
      setDishes((prev)=>page===1 ? data.dishes : [...(prev || []),...data.dishes]);
      setDishTotal(data.total||0);setDishPage(page);
    }catch(err){setError(err.response?.data?.error || 'Could not load saved dishes.');setDishes((prev)=>prev||[]);}
  }
  useEffect(()=>{loadDishes();},[]);

  async function unsaveDish(id) {
    setBusyId(id);setError('');
    try {
      await api.delete(`/favorites/dishes/${id}`);
      setDishes((prev)=>(prev||[]).filter((dish)=>dish.id!==id));
      setDishTotal((total)=>Math.max(0,total-1));
    }catch(err){setError(err.response?.data?.error || 'Could not remove this dish.');}
    finally{setBusyId(null);}
  }
  async function addDish(item,replace=false) {
    setAdding(item.id);setError('');
    try {
      await api.post('/cart/items',{menu_item_id:item.id,quantity:1,replace});
      await refreshCart();
      setCartConflict(null);
    }catch(err){
      if(err.response?.status===409) setCartConflict({item,message:err.response.data.error});
      else setError(err.response?.data?.error || 'Could not add this dish to your cart.');
    }finally{setAdding(null);}
  }

  async function remove(id) {
    setBusyId(id);
    try {
      await api.delete(`/favorites/restaurants/${id}`);
      setRestaurants((current) => current.filter((restaurant) => restaurant.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove that restaurant.');
    } finally { setBusyId(null); }
  }


  if (restaurants === null && dishes === null)
    return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><GridSkeleton /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/" className="text-sm font-medium text-pepper hover:underline">Back to home</Link>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Your saved food shelf</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Keep the meals and restaurants you love nearby. Your saved list is private to your account.
      </p>
      <div role="tablist" aria-label="Saved food collections" className="mt-6 flex gap-2 border-b border-hairline">
        <button role="tab" type="button" aria-selected={tab==='dishes'}
          onClick={()=>setTab('dishes')}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab==='dishes'?'border-pepper text-pepper':'border-transparent text-ink-soft'}`}>
          Saved dishes {dishTotal>0 ? `(${dishTotal})` : ''}
        </button>
        <button role="tab" type="button" aria-selected={tab==='restaurants'}
          onClick={()=>setTab('restaurants')}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab==='restaurants'?'border-pepper text-pepper':'border-transparent text-ink-soft'}`}>
          Restaurants {restaurants?.length ? `(${restaurants.length})` : ''}
        </button>
      </div>
      {error && <div role="alert" className="mt-5"><ErrorState message={error} /></div>}
      {tab==='restaurants' && (
        !restaurants?.length
          ? <div className="mt-8"><EmptyState message="No restaurants saved yet. Browse restaurants and save the ones you enjoy." /></div>
          : <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant)=><RestaurantCard key={restaurant.id}
                restaurant={restaurant} isFavorite favoriteBusy={busyId===restaurant.id}
                onToggleFavorite={()=>remove(restaurant.id)}/>)}
            </div>
      )}
      {tab==='dishes' && (
        <>
          {dishes===null && <div className="mt-6"><GridSkeleton /></div>}
          {dishes?.length===0 && <div className="mt-8"><EmptyState message="Your saved food shelf is empty. Browse dishes and tap Save this dish." /></div>}
          {dishes?.length>0 && <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish)=><FoodCard key={dish.id} item={dish}
              isSaved onToggleSaved={()=>unsaveDish(dish.id)} saveBusy={busyId===dish.id}
              onAdd={dish.is_available ? addDish : undefined} adding={adding===dish.id}/>)}
          </div>}
          {dishes?.length>0 && dishes.length<dishTotal && <button type="button"
            onClick={()=>loadDishes(dishPage+1)}
            className="mt-6 w-full rounded-xl border border-hairline px-4 py-3 text-sm font-semibold text-ink hover:border-pepper">Load more saved dishes</button>}
        </>
      )}
      {cartConflict && <ConfirmModal title="Switch restaurants?" message={cartConflict.message}
        confirmLabel="Replace cart" onCancel={()=>setCartConflict(null)}
        onConfirm={()=>addDish(cartConflict.item,true)} />}
    </div>
  );
}

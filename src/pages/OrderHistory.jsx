import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { formatNaira } from '../lib/format.js';
import { EmptyState, ErrorState } from '../components/StateViews.jsx';

const PAGE_SIZE = 15;

const STATUS_STYLES = {
  pending: 'bg-gold text-white',
  confirmed: 'bg-gold text-white',
  preparing: 'bg-gold text-white',
  out_for_delivery: 'bg-pepper text-white',
  delivered: 'bg-jade text-white',
  cancelled: 'bg-ink-soft text-white',
};

function orderReview(order) {
  return Array.isArray(order.reviews) ? (order.reviews[0] || null) : (order.reviews || null);
}

function ReviewStars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={rating + ' out of 5 stars'}>
      {[1, 2, 3, 4, 5].map(value => (
        <svg key={value} width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m12 2.7 2.85 5.78 6.38.93-4.62 4.5 1.09 6.36L12 17.27l-5.7 3 1.09-6.36-4.62-4.5 6.38-.93L12 2.7Z"
            fill={value <= rating ? '#E7A33E' : '#E8E1DC'}
          />
        </svg>
      ))}
    </span>
  );
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const isFirstPage = page === 1;
    setError('');
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);

    api.get('/orders', { params: { page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        if (!cancelled) {
          setOrders(current => (isFirstPage ? data.orders : [...current, ...data.orders]));
          setTotal(data.total || 0);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load your orders.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      });

    return () => { cancelled = true; };
  }, [page, retry]);

  const hasMore = orders.length < total;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-pepper">YOUR FOOD JOURNEY</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Your orders</h1>
        <p className="mt-1 text-sm text-ink-soft">Follow every order from kitchen to doorstep.</p>
        <p className="mt-2 max-w-lg text-xs leading-5 text-ink-soft">
          Each restaurant in a multi-restaurant checkout has its own order and review. After an order is delivered, you can review that restaurant separately.
        </p>
      </div>

      <div className="mt-6">
        {loading && orders.length === 0 ? (
          <p className="text-center font-mono text-sm text-ink-soft">Loading...</p>
        ) : error && orders.length === 0 ? (
          <ErrorState message={error} onRetry={() => setRetry(value => value + 1)} />
        ) : orders.length === 0 ? (
          <EmptyState message="You haven't placed any orders yet." />
        ) : (
          <>
            {error && (
              <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
                <button type="button" onClick={() => setRetry(value => value + 1)} className="ml-1 font-semibold underline">Retry</button>
              </p>
            )}

            <div className="space-y-3">
              {orders.map(order => {
                const review = orderReview(order);
                const restaurantName = order.restaurants?.name || 'Restaurant order';

                return (
                  <article key={order.id} className="ticket p-4 transition-shadow hover:shadow-md">
                    <Link
                      to={'/orders/' + order.id}
                      className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pepper"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-display text-sm font-bold text-ink">{restaurantName}</h2>
                        <span className={'shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ' + (STATUS_STYLES[order.status] || 'bg-ink-soft text-white')}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-sm text-ink-soft">
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="font-mono font-semibold text-ink">{formatNaira(order.total_amount)}</span>
                      </div>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-pepper">
                        View order <span aria-hidden="true">→</span>
                      </span>
                    </Link>

                    {order.status === 'delivered' && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
                        {review ? (
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink">Your review for {restaurantName}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <ReviewStars rating={review.rating} />
                              <span className="text-xs text-ink-soft">{review.rating}/5 submitted</span>
                            </div>
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink">How was {restaurantName}?</p>
                            <p className="mt-0.5 text-xs text-ink-soft">Share your experience with other customers.</p>
                          </div>
                        )}

                        <Link
                          to={'/orders/' + order.id}
                          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-pepper px-3.5 py-2 text-xs font-bold text-white transition hover:bg-pepper-dark"
                        >
                          {review ? 'View review' : 'Review restaurant'}
                        </Link>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {hasMore && (
              <button
                type="button"
                onClick={() => setPage(value => value + 1)}
                disabled={loadingMore}
                className="mt-6 w-full rounded-lg border border-hairline py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-pepper hover:text-pepper disabled:opacity-60"
              >
                {loadingMore ? 'Loading...' : 'Load more orders'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

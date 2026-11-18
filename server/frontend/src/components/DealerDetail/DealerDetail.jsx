import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet } from '../../api.js';

function SentimentBadge({ sentiment }) {
  const value = (sentiment || 'neutral').toLowerCase();
  return <span className={`badge badge-${value}`}>{value}</span>;
}

export default function DealerDetail({ userName }) {
  const { dealerId } = useParams();
  const [dealer, setDealer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [dealerResponse, reviewResponse] = await Promise.all([
          apiGet(`/get_dealer/${dealerId}`),
          apiGet(`/reviews/dealer/${dealerId}`),
        ]);
        if (!cancelled) {
          setDealer(dealerResponse.dealer);
          setReviews(reviewResponse.reviews || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dealerId]);

  if (loading) {
    return <section className="container section"><p>Loading dealer details…</p></section>;
  }

  if (error || !dealer) {
    return (
      <section className="container section">
        <p className="alert alert-error">{error || 'Dealer not found.'}</p>
        <Link className="btn btn-primary" to="/dealers">Back to dealers</Link>
      </section>
    );
  }

  return (
    <section className="container section">
      <Link className="back-link" to="/dealers">← All dealers</Link>

      <div className="dealer-header card">
        <div>
          <p className="eyebrow">Dealer #{dealer.dealer_id}</p>
          <h1>{dealer.full_name}</h1>
          <p className="muted">{dealer.short_name}</p>
          <p>
            {dealer.address}
            <br />
            {dealer.city}, {dealer.state} {dealer.zip}
          </p>
          <p className="muted">Coordinates: {dealer.lat}, {dealer.long}</p>
        </div>
        <div className="dealer-actions">
          {userName ? (
            <Link className="btn btn-primary" to={`/review/${dealer.dealer_id}`}>
              Review Dealer
            </Link>
          ) : (
            <Link className="btn btn-outline" to="/login">Log in to review this dealer</Link>
          )}
        </div>
      </div>

      <div className="section-heading reviews-heading">
        <h2>Customer reviews ({reviews.length})</h2>
      </div>

      {reviews.length === 0 && <p className="empty-state">No reviews yet for this dealer.</p>}

      <div className="review-list">
        {reviews.map((review, index) => (
          <article className="card review-card" key={`${review.name}-${index}`}>
            <div className="review-top">
              <h3>{review.name}</h3>
              <SentimentBadge sentiment={review.sentiment} />
            </div>
            <p>{review.review}</p>
            {review.purchase && (
              <p className="review-meta">
                Purchased {review.car_year} {review.car_make} {review.car_model}
                {review.purchase_date ? ` on ${review.purchase_date}` : ''}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

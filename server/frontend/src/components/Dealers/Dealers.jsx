import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet } from '../../api.js';

export default function Dealers({ userName }) {
  const { state } = useParams();
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [allDealers, setAllDealers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [list, everything] = await Promise.all([
          apiGet(state ? `/get_dealers/${encodeURIComponent(state)}` : '/get_dealers'),
          apiGet('/get_dealers'),
        ]);
        if (!cancelled) {
          setDealers(list.dealers || []);
          setAllDealers(everything.dealers || []);
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
  }, [state]);

  const states = useMemo(() => {
    const unique = new Set(allDealers.map((dealer) => dealer.state));
    return Array.from(unique).sort();
  }, [allDealers]);

  function handleStateChange(event) {
    const next = event.target.value;
    navigate(next ? `/dealers/${encodeURIComponent(next)}` : '/dealers');
  }

  return (
    <section className="container section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Dealership directory</p>
          <h1>{state ? `${state} dealerships` : 'All dealerships'}</h1>
          <p className="muted">
            {loading ? 'Loading dealerships…' : `${dealers.length} dealer(s) found`}
          </p>
        </div>
        <label className="filter-control">
          <span>Filter by state</span>
          <select value={state || ''} onChange={handleStateChange}>
            <option value="">All states</option>
            {states.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      <div className="dealer-grid">
        {dealers.map((dealer) => (
          <article className="card dealer-card" key={dealer.dealer_id}>
            <div className="dealer-card-top">
              <h2>{dealer.full_name}</h2>
              <span className="pill">{dealer.state}</span>
            </div>
            <p className="muted">{dealer.short_name}</p>
            <p>
              {dealer.address}
              <br />
              {dealer.city}, {dealer.state} {dealer.zip}
            </p>
            <div className="card-actions">
              <Link className="btn btn-primary" to={`/dealer/${dealer.dealer_id}`}>
                View dealer &amp; reviews
              </Link>
              {userName && (
                <Link className="btn btn-ghost" to={`/review/${dealer.dealer_id}`}>
                  Review Dealer
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {!loading && !error && dealers.length === 0 && (
        <p className="empty-state">No dealerships found for this state.</p>
      )}
    </section>
  );
}

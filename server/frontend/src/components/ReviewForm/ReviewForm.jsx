import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '../../api.js';

const YEARS = Array.from({ length: 16 }, (_, index) => 2025 - index);

export default function ReviewForm({ userName }) {
  const { dealerId } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [carMakes, setCarMakes] = useState([]);
  const [form, setForm] = useState({
    review: '',
    purchase: false,
    purchase_date: '',
    car_make: '',
    car_model: '',
    car_year: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [dealerResponse, carsResponse] = await Promise.all([
          apiGet(`/get_dealer/${dealerId}`),
          apiGet('/get_cars'),
        ]);
        setDealer(dealerResponse.dealer);
        setCarMakes(carsResponse.CarMakes || []);
      } catch (err) {
        setError(err.message);
      }
    }
    if (userName) load();
  }, [dealerId, userName]);

  if (!userName) {
    return (
      <section className="container section">
        <div className="card auth-card">
          <h1>Login required</h1>
          <p>You must be logged in to review a dealer.</p>
          <Link className="btn btn-primary" to="/login">Go to login</Link>
        </div>
      </section>
    );
  }

  function update(field) {
    return (event) => {
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      const next = { ...form, [field]: value };
      if (field === 'car_make') next.car_model = '';
      setForm(next);
    };
  }

  const models = carMakes.find((make) => make.name === form.car_make)?.models || [];

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await apiPost('/add_review', {
        dealer_id: Number(dealerId),
        review: form.review,
        purchase: form.purchase,
        purchase_date: form.purchase_date || null,
        car_make: form.car_make,
        car_model: form.car_model,
        car_year: form.car_year ? Number(form.car_year) : null,
      });
      navigate(`/dealer/${dealerId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container section">
      <div className="card form-card">
        <p className="eyebrow">Write a review</p>
        <h1>{dealer ? dealer.full_name : 'Dealer review'}</h1>
        <p className="muted">
          Signed in as <strong>{userName}</strong>
        </p>
        {error && <p className="alert alert-error">{error}</p>}
        <form onSubmit={handleSubmit} className="form">
          <label>
            Your review
            <textarea
              name="review"
              rows="5"
              value={form.review}
              onChange={update('review')}
              placeholder="Share your experience with this dealership…"
              required
            />
          </label>

          <label className="checkbox-label">
            <input type="checkbox" name="purchase" checked={form.purchase} onChange={update('purchase')} />
            I purchased a car from this dealer
          </label>

          {form.purchase && (
            <div className="form-grid">
              <label>
                Purchase date
                <input type="date" name="purchase_date" value={form.purchase_date} onChange={update('purchase_date')} />
              </label>
              <label>
                Car make
                <select name="car_make" value={form.car_make} onChange={update('car_make')}>
                  <option value="">Select make</option>
                  {carMakes.map((make) => (
                    <option key={make.name} value={make.name}>{make.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Car model
                <select name="car_model" value={form.car_model} onChange={update('car_model')} disabled={!form.car_make}>
                  <option value="">Select model</option>
                  {models.map((model) => (
                    <option key={model.name} value={model.name}>{model.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Car year
                <select name="car_year" value={form.car_year} onChange={update('car_year')}>
                  <option value="">Select year</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit review'}
            </button>
            <Link className="btn btn-ghost" to={`/dealer/${dealerId}`}>Cancel</Link>
          </div>
        </form>
      </div>
    </section>
  );
}

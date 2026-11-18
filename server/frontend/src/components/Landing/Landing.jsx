import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Verified dealerships',
    text: 'Browse dealerships across the country with transparent contact details and locations.',
  },
  {
    title: 'Honest customer reviews',
    text: 'Read real customer experiences before you visit, or share your own after a purchase.',
  },
  {
    title: 'Smart sentiment insights',
    text: 'Every review is scored by our sentiment service so you can spot quality dealers instantly.',
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-overlay">
          <div className="container hero-content">
            <p className="eyebrow">Find your next car with confidence</p>
            <h1>America&apos;s dealerships, reviewed by real customers</h1>
            <p className="hero-copy">
              Compare dealerships by state, read authentic reviews, and choose the dealer that
              treats you right.
            </p>
            <div className="hero-actions">
              <Link to="/dealers" className="btn btn-primary btn-lg">Browse dealers</Link>
              <Link to="/register" className="btn btn-outline btn-lg">Create an account</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>Why CarDeal</h2>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <article className="card feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container section cta-band">
        <div>
          <h2>Recently bought a car?</h2>
          <p>Log in and share your experience to help other buyers.</p>
        </div>
        <Link to="/login" className="btn btn-primary">Log in to review</Link>
      </section>
    </div>
  );
}

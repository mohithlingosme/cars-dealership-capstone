export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>© {new Date().getFullYear()} CarDeal Dealerships. Sample capstone application.</p>
        <p>
          <a href="/About.html">About Us</a> · <a href="/Contact.html">Contact Us</a>
        </p>
      </div>
    </footer>
  );
}

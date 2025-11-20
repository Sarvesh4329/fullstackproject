import React from 'react';
import { useNavigate } from 'react-router-dom';

const bgColor = "#FFF8DC";
const accent = "#FFD700";
const dark = "#3A2C13";

const features = [
  {
    title: "Book a Service",
    img: "/book.jpg",
    desc: "Book trusted beekeepers for safe honeycomb removal at your location."
  },
  {
    title: "Shop Honey",
    img: "/honey.jpg",
    desc: "Buy pure, natural honey and beeswax products from local beekeepers."
  },
  {
    title: "Learn",
    img: "/learn.jpg",
    desc: "Discover tips and resources for bee care and honey harvesting."
  },
  {
    title: "Track",
    img: "/track.jpg",
    desc: "Track your appointments and honey orders in real time."
  }
];

const honeyProducts = [
  {
    title: "Organic Honey",
    price: "₹ 200",
    img: "/honey1.jpg"
  },
  {
    title: "Honey Soap",
    price: "₹ 199",
    img: "/soap.jpg"
  },
  {
    title: "Honey Cake",
    price: "₹ 30",
    img: "/cake.jpg"
  },
  {
    title: "Mixed Fruit Honey Jam",
    price: "₹ 245",
    img: "/jam.jpg"
  }
];

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: bgColor }}>
      {/* Header */}
      <nav className="navbar navbar-expand-lg sticky-top" style={{ background: "#fffbe6", boxShadow: "0 2px 4px rgba(0,0,0,.05)" }}>
        <div className="container-fluid px-4">
          <span className="navbar-brand me-auto" style={{ color: dark, fontWeight: 'bold', fontSize: '1.8rem' }}>
            HIVEHELP
          </span>
          <div className="d-flex">
            <button className="btn btn-outline-dark me-2" onClick={() => navigate('/login')} style={{ fontWeight: 500 }}>Login</button>
            <button className="btn" style={{ background: accent, color: dark, fontWeight: 600 }} onClick={() => navigate('/register')}>Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ background: "#fffbe6" }}>
        <div className="container col-xxl-8 px-4 py-5">
          <div className="row flex-lg-row-reverse align-items-center g-5 py-5">
            <div className="col-10 col-sm-8 col-lg-6">
              <img src="/hive1.jpg" className="d-block mx-lg-auto img-fluid" alt="Bees on a honeycomb" width="700" height="500" loading="lazy" style={{ borderRadius: '15px', boxShadow: '0 15px 30px -10px rgba(0,0,0,0.2)' }} />
            </div>
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold lh-1 mb-3" style={{ color: dark }}>Your Honeybee Companion.</h1>
              <p className="lead" style={{ color: "#5a4a1c" }}>
                From safe honeycomb removal by trusted beekeepers to a marketplace for pure, natural honey. We connect you with the world of bees.
              </p>
              <div className="d-grid gap-2 d-md-flex justify-content-md-start mt-4">
                <button type="button" className="btn btn-lg px-4 me-md-2" style={{ background: accent, color: dark, fontWeight: 600 }} onClick={() => navigate('/register')}>Get Started</button>
                <button type="button" className="btn btn-outline-secondary btn-lg px-4" onClick={() => navigate('/login')}>Login</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-5">
        {/* Features Row */}
        <h2 className="pb-2 border-bottom" style={{ color: dark, fontWeight: "bold" }}>Everything for bees in one place</h2>
        <div className="row g-4 py-5 row-cols-1 row-cols-lg-4">
          {features.map((f, i) => (
            <div className="col d-flex align-items-start" key={i}>
              <div className="icon-square text-dark flex-shrink-0 me-3 fs-2">
                <i className={`bi bi-${i === 0 ? 'tools' : i === 1 ? 'basket2-fill' : i === 2 ? 'book-half' : 'geo-alt-fill'}`}></i>
              </div>
              <div>
                <h4 style={{ color: dark }}>{f.title}</h4>
                <p style={{ color: "#5a4a1c" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Honey Store Section */}
        <h2 className="pb-2 border-bottom" style={{ color: dark, fontWeight: "bold" }}>Made with Honey</h2>
        <p className="lead" style={{ color: "#5a4a1c" }}>Popular products crafted from honey and beeswax.</p>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 py-5">
          {honeyProducts.map((p, i) => (
            <div className="col" key={i}>
              <div className="card h-100 shadow-sm border-0" style={{ borderRadius: 15, background: "#fffbe6", transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <img src={p.img} alt={p.title} className="card-img-top" style={{ borderRadius: "15px 15px 0 0", height: 180, objectFit: "cover" }} />
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <h5 className="card-title" style={{ color: dark, fontWeight: 600 }}>{p.title}</h5>
                    <p className="card-text fs-5 mb-0" style={{ color: "#5a4a1c", fontWeight: 500 }}>{p.price}</p>
                  </div>
                  <button className="btn mt-3" style={{ color: dark, fontWeight: 600, background: accent, border: "none" }} onClick={() => navigate('/register')}>View Product</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="container">
        <footer className="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
          <p className="col-md-4 mb-0 text-muted">&copy; {new Date().getFullYear()} HIVEHELP, Inc</p>

          <a href="/" className="col-md-4 d-flex align-items-center justify-content-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none">
            <i className="bi bi-bee" style={{ fontSize: "2rem", color: accent }}></i>
          </a>

          <ul className="nav col-md-4 justify-content-end">
            <li className="nav-item"><a href="/" className="nav-link px-2 text-muted">Home</a></li>
            <li className="nav-item"><a href="/features" className="nav-link px-2 text-muted">Features</a></li>
            <li className="nav-item"><a href="/pricing" className="nav-link px-2 text-muted">Pricing</a></li>
            <li className="nav-item"><a href="/faq" className="nav-link px-2 text-muted">FAQs</a></li>
            <li className="nav-item"><a href="/about" className="nav-link px-2 text-muted">About</a></li>
          </ul>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
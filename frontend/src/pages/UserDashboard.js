import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import axios from 'axios';
import LogoutButton from '../components/LogoutButton';
import { Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const bgColor = "#FFF8DC";
const accent = "#FFD700";
const dark = "#3A2C13";

const DashboardContext = React.createContext();

// Create a single axios instance. Its headers will be updated via an interceptor.
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

function UserDashboard({ setRole }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    hivespot: '',
    address: '',
    severity: '',
    latitude: null,
    longitude: null,
  });
  const [photo, setPhoto] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token')); // Use function for initial state
  const [appointments, setAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // This state will be managed by the cart component
  const [showCart, setShowCart] = useState(false); // Controls cart modal visibility
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const fileInputRef = useRef();

  // Granular loading and error states for better UX
  const [loading, setLoading] = useState({ user: true, appointments: true, products: true });
  const [error, setError] = useState({ user: '', appointments: '', products: '' });

  // Fix for default marker icon issue with webpack
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });

  // Use an effect to update the axios instance's headers whenever the token changes.
  // This is more reliable than creating a new instance for every request.
  useEffect(() => {
    const interceptor = api.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      config.headers.Authorization = token ? `Bearer ${token}` : '';
      return config;
    });
    return () => api.interceptors.request.eject(interceptor);
  }, []); // This interceptor does not need to re-run. It will always get the latest token.

  // Reusable data fetch function used on mount and after actions
  const fetchData = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setLoading({ user: false, appointments: false, products: false });
      setError({ user: 'Not authenticated.', appointments: 'Not authenticated.', products: 'Not authenticated.' });
      window.alert('Authentication error. Please log in.');
      return;
    }

    setLoading({ user: true, appointments: true, products: true });
    setError({ user: '', appointments: '', products: '' });

    try {
      const [userRes, appointmentsRes, productsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/appointments'),
        api.get('/products')
      ]);

      setForm(f => ({ ...f, fullName: userRes.data.name, email: userRes.data.email, phone: userRes.data.phone || '' }));
      setAppointments(appointmentsRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      setError({ user: 'Failed to load data.', appointments: 'Failed to load data.', products: 'Failed to load data.' });
      window.alert('Failed to load dashboard data. Please try logging in again.');
    } finally {
      setLoading({ user: false, appointments: false, products: false });
    }
  }, []);

  // Call fetchData on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhotoChange = e => setPhoto(e.target.files[0]);

  const bookAppointment = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (photo) formData.append('photo', photo);

    try {
      await api.post('/appointments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      window.alert('Your booking is taken under process!');
      setForm({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        date: '',
        time: '',
        hivespot: '',
        address: '',
        severity: '',
        latitude: null,
        longitude: null,
      });
      setPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData(); // Refresh all data
    } catch (err) {
      window.alert('Booking failed. Please check your details and try again.');
    }
  };

  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    window.alert(`${product.name} added to cart!`);
  };

  const handleUpdateCartQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      setCart(cart.filter(item => item._id !== productId));
    } else {
      setCart(cart.map(item => item._id === productId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const handleCheckout = async () => {
    // This is a placeholder. You would typically send the entire cart to a new backend endpoint.
    // For now, we can create orders one by one as a simple demonstration.
    try {
      await Promise.all(cart.map(item => api.post('/orders', {
        productId: item._id,
        quantity: item.quantity
      })));
      window.alert('Checkout successful! Your orders have been placed.');
      setCart([]);
      setShowCart(false);
      // We don't need to fetch orders here as they are fetched on the MyAccount page.
      // This logic is now robust.
    } catch (err) {
      window.alert('Checkout failed. Please try again.');
    }
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const filteredAndSortedProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  return (
    <DashboardContext.Provider value={{ setForm, api }}>
      <div style={{ background: bgColor, color: dark }}>
        <nav className="navbar navbar-expand-lg sticky-top" style={{ background: "#fffbe6", boxShadow: "0 2px 4px rgba(0,0,0,.1)" }}>
          <div className="container-fluid px-4">
            <Link className="navbar-brand me-auto" to="/dashboard" style={{ color: dark, fontWeight: 'bold', fontSize: '1.5rem' }}>HIVEHELP</Link>
            <div className="d-flex align-items-center">
              <Link to="/account" className="btn me-3" style={{ background: accent, color: dark, fontWeight: 600, border: 'none' }}>
                My Account
              </Link>
              <Link to="/track" className="btn me-2" style={{ background: accent, color: dark, fontWeight: 600, border: 'none' }}>
                Track
              </Link>
              <Button variant="warning" onClick={() => setShowCart(true)} className="me-3" style={{ background: accent, color: dark, fontWeight: 600, border: 'none' }}>
                🛒 Cart <span className="badge bg-dark">{cart.reduce((count, item) => count + item.quantity, 0)}</span>
              </Button>
              <LogoutButton setRole={setRole} className="btn" style={{ background: accent, color: dark, fontWeight: 600, border: 'none' }} />
            </div>
          </div>
        </nav>

        <div className="container py-5">
          <div className="p-5 mb-5 rounded-3" style={{ background: "#fffbe6" }}>
            <h1 className="display-5 fw-bold">Welcome back, {form.fullName.split(' ')[0]}!</h1>
            <p className="col-md-8 fs-4">Ready to manage your hives or stock up on fresh honey? We're here to help.</p>
          </div>

          <div className="row g-5">
            <div className="col-lg-7">
              <div className="card shadow-sm p-4 border-0" style={{ borderRadius: 15, background: "#fffbe6" }}>
                <h3 className="mb-4" style={{ color: dark, fontWeight: 'bold' }}>Book a Beekeeper</h3>
                <form onSubmit={bookAppointment}>
                  {/* Form fields remain the same */}
                  <input className="form-control mb-3" name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} required readOnly />
                  <input className="form-control mb-3" name="email" placeholder="Email" value={form.email} onChange={handleChange} required readOnly />
                  <input className="form-control mb-3" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
                  <div className="row mb-3"><div className="col-6"><input className="form-control" name="date" type="date" value={form.date} onChange={handleChange} required /></div><div className="col-6"><input className="form-control" name="time" type="time" value={form.time} onChange={handleChange} required /></div></div>
                  <select className="form-select mb-3" name="hivespot" value={form.hivespot} onChange={handleChange} required><option value="">Select Hive Location</option><option value="tree">Tree</option><option value="roof">Roof</option><option value="others">Others</option></select>
                  <input className="form-control mb-3" name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
                  <select className="form-select mb-3" name="severity" value={form.severity} onChange={handleChange} required><option value="">Select Severity</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                  <input className="form-control mb-3" type="file" accept="image/*" onChange={handlePhotoChange} ref={fileInputRef} />
                  <div className="mb-3">
                    <label className="form-label" style={{color: dark}}>Pin Location on Map (Optional):</label>
                    <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '250px', width: '100%', borderRadius: '10px' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                      <LocationMarker />
                    </MapContainer>
                    {form.latitude && form.longitude && (<div className="form-text text-success fw-bold">Location Pinned: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</div>)}
                  </div>
                  <button className="btn w-100" style={{ background: accent, color: dark, fontWeight: 600, fontSize: '1.1rem', padding: '0.75rem' }} type="submit">Submit Booking</button>
                </form>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card shadow-sm p-4 border-0" style={{ borderRadius: 15, background: "#fffbe6" }}>
                <h3 className="mb-4" style={{ color: dark, fontWeight: 'bold' }}>Your Appointments</h3>
                {loading.appointments ? <p>Loading appointments...</p> : error.appointments ? <div className="alert alert-danger">{error.appointments}</div> : (
                  appointments.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {appointments.slice(0, 5).map(a => ( // Show first 5 appointments
                        <li className="list-group-item bg-transparent" key={a._id}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <b>{a.address}</b><br />
                              <small className="text-muted">{new Date(a.date).toLocaleDateString()} at {a.time}</small>
                            </div>
                            <span className="badge" style={{ backgroundColor: accent, color: dark }}>{a.status}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-center text-muted">You have no appointments scheduled.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="p-5 mb-4 rounded-3 text-center" style={{ background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(https://images.unsplash.com/photo-1587049352851-8d4e87135be8?q=80&w=2070&auto=format&fit=crop)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="container-fluid py-5 text-white">
                <h1 className="display-5 fw-bold">Pure, Raw, & Unfiltered</h1>
                <p className="col-md-8 fs-4">Discover the golden standard of honey, straight from our trusted beekeepers to your table.</p>
              </div>
            </div>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
              <div className="flex-grow-1 me-md-3 mb-3 mb-md-0">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search for products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-shrink-0">
                <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="default">Sort By</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                </select>
              </div>
            </div>

            <div className="row g-4">
              {filteredAndSortedProducts.map(p => (
                <div className="col-md-6 col-lg-4" key={p._id}>
                  <div className="card h-100 shadow-sm border-0 product-card" style={{ borderRadius: 15, background: "#fffbe6", transition: 'transform 0.2s, box-shadow 0.2s' }}>
                    {p.image ? (
                      <img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} style={{ height: '200px', objectFit: 'cover', borderRadius: '15px 15px 0 0' }} />
                    ) : (
                      <div style={{ height: '200px', background: '#f0e5c4', borderRadius: '15px 15px 0 0' }} className="d-flex align-items-center justify-content-center text-muted">
                        No Image
                      </div>
                    )}
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title" style={{ color: dark }}>{p.name}</h5>
                      <p className="card-text small text-muted flex-grow-1">{p.description}</p>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <p className="card-text fs-5 mb-0"><b>₹{p.price}</b></p>
                        <Button variant="warning" onClick={() => handleAddToCart(p)} disabled={p.quantity < 1} style={{ background: accent, color: dark, border: 'none', fontWeight: 600 }}>
                          {p.quantity < 1 ? 'Out of Stock' : <>🛒 Add to Cart</>}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Modal remains the same */}
        <Modal show={showCart} onHide={() => setShowCart(false)} centered>
          <Modal.Header closeButton style={{ background: accent }}>
            <Modal.Title style={{ color: dark, fontWeight: 'bold' }}>Your Shopping Cart</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {cart.length > 0 ? (
              <>
                {cart.map(item => (
                  <div key={item._id} className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-0">{item.name}</h6>
                      <small className="text-muted">₹{item.price} each</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <Button variant="outline-secondary" size="sm" onClick={() => handleUpdateCartQuantity(item._id, item.quantity - 1)}>-</Button>
                      <span className="mx-2">{item.quantity}</span>
                      <Button variant="outline-secondary" size="sm" onClick={() => handleUpdateCartQuantity(item._id, item.quantity + 1)}>+</Button>
                    </div>
                  </div>
                ))}
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <p>Your cart is empty.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCart(false)}>
              Close
            </Button>
            <Button variant="success" onClick={handleCheckout} disabled={cart.length === 0}>
              Checkout
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </DashboardContext.Provider>
  );
}

function LocationMarker() {
  const [position, setPosition] = useState(null);
  const { setForm } = useContext(DashboardContext);

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      setForm(prevForm => ({ ...prevForm, latitude: lat, longitude: lng }));
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

export default UserDashboard;
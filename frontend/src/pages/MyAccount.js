import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';

const bgColor = "#FFF8DC";
const accent = "#FFD700";
const dark = "#3A2C13";

function StarRating({ rating, setRating, readOnly = false }) {
  return (
    <div>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <span
            key={ratingValue}
            style={{
              cursor: readOnly ? 'default' : 'pointer',
              color: ratingValue <= rating ? accent : '#e4e5e9',
              fontSize: '2rem'
            }}
            onClick={() => !readOnly && setRating(ratingValue)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

function MyAccount() {
  const [user, setUser] = useState({ name: '', email: '', phone: '' });
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState({ user: true, appointments: true, orders: true });
  const [error, setError] = useState({ user: '', appointments: '', orders: '' });

  const api = () => {
    const token = localStorage.getItem('token');
    return axios.create({
      baseURL: 'http://localhost:5000/api',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  };

  const fetchData = React.useCallback(async () => {
    setLoading({ user: true, appointments: true, orders: true });
    setError({ user: '', appointments: '', orders: '' });

    const fetchUser = api().get('/users/me')
      .then(res => setUser({ name: res.data.name, email: res.data.email, phone: res.data.phone || '' }))
      .catch(() => setError(prev => ({ ...prev, user: 'Could not fetch user profile.' })))
      .finally(() => setLoading(prev => ({ ...prev, user: false })));

    const fetchAppointments = api().get('/appointments')
      .then(res => setAppointments(res.data))
      .catch(() => setError(prev => ({ ...prev, appointments: 'Could not fetch appointments.' })))
      .finally(() => setLoading(prev => ({ ...prev, appointments: false })));

    const fetchOrders = api().get('/orders')
      .then(res => setOrders(res.data))
      .catch(() => setError(prev => ({ ...prev, orders: 'Could not fetch orders.' })))
      .finally(() => setLoading(prev => ({ ...prev, orders: false })));

    await Promise.all([fetchUser, fetchAppointments, fetchOrders]);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api().put('/users/me', user);
      setUser(res.data);
      window.alert('Profile updated successfully!');
    } catch (err) {
      window.alert('Failed to update profile.');
    }
  };

  const handleReviewSubmit = async () => {
    try {
      await api().post(`/appointments/${currentAppointment._id}/review`,
        { rating, review }
      );
      window.alert('Review submitted successfully!');
      setShowReviewModal(false);
      fetchData(); // Refresh data to show new review
    } catch (err) {
      window.alert('Failed to submit review.');
    }
  };

  const openReviewModal = (appointment) => {
    setCurrentAppointment(appointment);
    setRating(appointment.rating || 0);
    setReview(appointment.review || '');
    setShowReviewModal(true);
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    try {
      await api().patch(`/appointments/${appointmentId}/cancel`, {});
      window.alert('Appointment cancelled successfully.');
      fetchData(); // Refresh the list
    } catch (err) {
      // --- IMPROVED ERROR HANDLING ---
      if (err.response && err.response.data && err.response.data.error) {
        window.alert(`Cancellation Failed: ${err.response.data.error}`);
      } else {
        window.alert('Failed to cancel appointment. An unknown error occurred.');
      }
      // -----------------------------
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    try {
      // Call the new PATCH endpoint to cancel the order
      await api().patch(`/orders/${orderId}/cancel`, {});
      window.alert('Order cancelled successfully.');
      fetchData(); // Refresh the list
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'An unknown error occurred.';
      window.alert(`Cancellation Failed: ${errorMsg}`);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: bgColor, color: dark }}>
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 style={{ fontWeight: 'bold' }}>My Account</h1>
          <Link to="/dashboard" className="btn" style={{ background: accent, color: dark, fontWeight: 600 }}>Back to Dashboard</Link>
        </div>

        <div className="card shadow-lg p-3" style={{ borderRadius: 20, background: "#fffbe6" }}>
          <ul className="nav nav-pills nav-fill mb-4">
            <li className="nav-item"><button className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} style={activeTab === 'profile' ? { background: accent, color: dark } : { color: dark }} onClick={() => setActiveTab('profile')}>Profile</button></li>
            <li className="nav-item"><button className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} style={activeTab === 'appointments' ? { background: accent, color: dark } : { color: dark }} onClick={() => setActiveTab('appointments')}>Appointment History</button></li>
            <li className="nav-item"><button className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`} style={activeTab === 'orders' ? { background: accent, color: dark } : { color: dark }} onClick={() => setActiveTab('orders')}>Order History</button></li>
          </ul>

          <div className="tab-content p-3">
            {activeTab === 'profile' && (
              <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <h3 className="mb-4 text-center">Edit Your Profile</h3>
                <Form onSubmit={handleProfileUpdate}>
                  <Form.Group className="mb-3"><Form.Label>Full Name</Form.Label><Form.Control type="text" value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} /></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={user.email} readOnly /></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Phone</Form.Label><Form.Control type="text" value={user.phone} onChange={e => setUser({ ...user, phone: e.target.value })} /></Form.Group>
                  <Button type="submit" style={{ background: accent, color: dark, fontWeight: 600, border: 'none' }}>Save Changes</Button>
                </Form>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div>
                <h3 className="mb-4 text-center">Your Appointments</h3>
                {loading.appointments ? <p>Loading...</p> : error.appointments ? <div className="alert alert-danger">{error.appointments}</div> : (
                  appointments.length > 0 ? appointments.map(a => (
                    <div className="card mb-3" key={a._id}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="card-title">{a.address}</h5>
                            <p className="card-text">{new Date(a.date).toLocaleDateString()} at {a.time} - Status: <span className="badge" style={{ backgroundColor: accent, color: dark }}>{a.status}</span></p>
                          </div>
                          <div className="text-end" style={{ minWidth: '120px' }}>
                            {a.status === 'completed' && (
                              <div className="d-flex justify-content-end">
                                {a.rating ? <StarRating rating={a.rating} readOnly={true} /> : <Button variant="outline-warning" onClick={() => openReviewModal(a)}>Leave a Review</Button>}
                              </div>
                            )}
                            {a.status === 'pending' && (
                              <Button variant="outline-danger" size="sm" onClick={() => cancelAppointment(a._id)}>Cancel</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : <p className="text-center text-muted">You have no past appointments.</p>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h3 className="mb-4 text-center">Your Orders</h3>
                {loading.orders ? <p>Loading...</p> : error.orders ? <div className="alert alert-danger">{error.orders}</div> : (
                  orders.length > 0 ? orders.map(o => (
                    <div className="card mb-3" key={o._id}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            {/* Display product name from populated data */}
                            <h5 className="card-title">{o.product?.name || 'Product not found'}</h5>
                            <p className="card-text mb-1">Quantity: {o.quantity} - Price: ₹{o.price}</p>
                            <p className="card-text">Status: <span className="badge" style={{ backgroundColor: accent, color: dark }}>{o.status}</span></p>
                          </div>
                          <div className="text-end" style={{ minWidth: '120px' }}>
                            {o.status === 'processing' && (
                              <Button variant="outline-danger" size="sm" onClick={() => cancelOrder(o._id)}>Cancel Order</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : <p className="text-center text-muted">You have no past orders.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
        <Modal.Header closeButton style={{ background: accent }}>
          <Modal.Title style={{ color: dark, fontWeight: 'bold' }}>Review Your Service</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>How was your experience with the beekeeper at <strong>{currentAppointment?.address}</strong>?</p>
          <div className="text-center mb-3">
            <StarRating rating={rating} setRating={setRating} />
          </div>
          <Form.Group>
            <Form.Label>Comments</Form.Label>
            <Form.Control as="textarea" rows={3} value={review} onChange={e => setReview(e.target.value)} placeholder="Share your experience..." />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Cancel</Button>
          <Button style={{ background: accent, color: dark, border: 'none' }} onClick={handleReviewSubmit}>Submit Review</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MyAccount;
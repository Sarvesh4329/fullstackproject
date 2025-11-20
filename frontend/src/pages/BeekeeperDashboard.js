import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import LogoutButton from '../components/LogoutButton';
import { Modal, Button, Form, Dropdown } from 'react-bootstrap';
import './Dashboard.css'; // Using the shared CSS

const accent = "#FFD700";
const dark = "#3A2C13";

// Centralized API client, moved outside the component
const api = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

function BeekeeperDashboard({ setRole }) {
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // State for Modals
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ name: '', description: '', price: '', quantity: '' });
  const [productImage, setProductImage] = useState(null);

  // Granular loading and error states
  const [loading, setLoading] = useState({ orders: true, appointments: true, products: true });
  const [error, setError] = useState({ orders: '', appointments: '', products: '' });

  const fetchData = useCallback(async () => {
    setLoading({ orders: true, appointments: true, products: true });
    setError({ orders: '', appointments: '', products: '' });

    const fetchPromises = [
      // Fetch Orders
      api().get('/orders/beekeeper')
        .then(res => setOrders(res.data))
        .catch(() => setError(prev => ({ ...prev, orders: 'Could not fetch your orders.' })))
        .finally(() => setLoading(prev => ({ ...prev, orders: false }))),

      // Fetch Appointments
      api().get('/appointments')
        .then(res => setAppointments(res.data))
        .catch(() => setError(prev => ({ ...prev, appointments: 'Could not fetch assigned appointments.' })))
        .finally(() => setLoading(prev => ({ ...prev, appointments: false }))),

      // Fetch Products
      api().get('/products/my-products')
        .then(res => setProducts(res.data))
        .catch(() => setError(prev => ({ ...prev, products: 'Could not fetch your products.' })))
        .finally(() => setLoading(prev => ({ ...prev, products: false })))
    ];

    await Promise.all(fetchPromises);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await api().patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      window.alert(`Appointment marked as ${newStatus}.`);
      fetchData();
    } catch (err) {
      window.alert('Failed to update appointment status.');
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      // CORRECTED: This now calls the beekeeper-accessible route in `orders.js`
      // The previous call was to an admin-only route.
      await api().patch(`/orders/${orderId}/status`, { status: newStatus });
      window.alert(`Order status updated to ${newStatus}.`);
      fetchData();
    } catch (err) {
      window.alert('Failed to update order status.');
    }
  };

  const openDetailsModal = (appointment) => setSelectedAppointment(appointment);
  const closeDetailsModal = () => setSelectedAppointment(null);

  const handleProductChange = (e) => setCurrentProduct({ ...currentProduct, [e.target.name]: e.target.value });
  const handleImageChange = (e) => setProductImage(e.target.files[0]);

  const openProductModal = (product = { name: '', description: '', price: '', quantity: '' }) => {
    setCurrentProduct(product);
    setProductImage(null);
    setShowProductModal(true);
  };

  const closeProductModal = () => setShowProductModal(false);

  const handleSaveProduct = async () => {
    const formData = new FormData();
    Object.keys(currentProduct).forEach(key => {
      if (key !== '_id' && key !== 'image') {
        formData.append(key, currentProduct[key]);
      }
    });
    if (productImage) {
      formData.append('image', productImage);
    }

    try {
      if (currentProduct._id) {
        await api().put(`/products/${currentProduct._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        window.alert('Product updated successfully!');
      } else {
        await api().post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        window.alert('Product added successfully!');
      }
      closeProductModal();
      fetchData();
    } catch (err) {
      window.alert('Failed to save product.');
      console.error('Error saving product:', err.response?.data || err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api().delete(`/products/${productId}`);
        window.alert('Product deleted successfully.');
        fetchData();
      } catch (err) {
        window.alert('Failed to delete product.');
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="row g-4">
            <div className="col-md-4"><div className="stat-card"><h5>Pending Jobs</h5><p className="fs-2 fw-bold">{appointments.filter(a => a.status === 'accepted').length}</p></div></div>
            <div className="col-md-4"><div className="stat-card"><h5>Pending Orders</h5><p className="fs-2 fw-bold">{orders.filter(o => o.status === 'processing').length}</p></div></div>
            <div className="col-md-4"><div className="stat-card"><h5>Listed Products</h5><p className="fs-2 fw-bold">{products.length}</p></div></div>
          </div>
        );
      case 'jobs':
        return (
          <div className="card shadow-sm border-0" style={{ borderRadius: 15 }}>
            <div className="card-body p-4">
              <h4 className="mb-4">Assigned Jobs</h4>
              {loading.appointments ? <p>Loading appointments...</p> : error.appointments ? <div className="alert alert-danger">{error.appointments}</div> : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead><tr><th>Date</th><th>Customer</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {appointments.length > 0 ? appointments.map(a => (<tr key={a._id}><td>{new Date(a.date).toLocaleDateString()} at {a.time}</td><td>{a.user?.name || 'N/A'}</td><td>{a.address}</td><td><span className="badge" style={{ backgroundColor: accent, color: dark }}>{a.status}</span></td><td><Button variant="info" size="sm" className="me-2" onClick={() => openDetailsModal(a)}>Details</Button>{a.status === 'accepted' && (<Button variant="success" size="sm" onClick={() => handleStatusUpdate(a._id, 'completed')}>Mark as Completed</Button>)}</td></tr>)) : <tr><td colSpan="5" className="text-center">No assigned jobs.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="card shadow-sm border-0" style={{ borderRadius: 15 }}>
            <div className="card-body p-4">
              <h4 className="mb-4">My Customer Orders</h4>
              {loading.orders ? <p>Loading orders...</p> : error.orders ? <div className="alert alert-danger">{error.orders}</div> : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead><tr><th>Date</th><th>Customer</th><th>Product</th><th>Qty</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {orders.length > 0 ? orders.map(o => (
                        <tr key={o._id}>
                          <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td>{o.user?.name || 'N/A'}</td>
                          <td>{o.product?.name || 'N/A'}</td>
                          <td>{o.quantity}</td>
                          <td><span className="badge" style={{ backgroundColor: accent, color: dark }}>{o.status}</span></td>
                          <td style={{ minWidth: '100px' }}>
                            <Dropdown><Dropdown.Toggle variant="warning" size="sm" style={{ backgroundColor: accent, color: dark, border: 'none' }}>Manage</Dropdown.Toggle><Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleOrderStatusUpdate(o._id, 'shipped')}>Set to Shipped</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleOrderStatusUpdate(o._id, 'completed')}>Set to Completed</Dropdown.Item>
                            </Dropdown.Menu></Dropdown>
                          </td>
                        </tr>
                      )) : <tr><td colSpan="6" className="text-center">You have no orders.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="card shadow-sm border-0" style={{ borderRadius: 15 }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">My Products</h4>
                <Button style={{ background: accent, color: dark, fontWeight: 600, border: 'none' }} onClick={() => openProductModal()}>Add New Product</Button>
              </div>
              {loading.products ? <p>Loading products...</p> : error.products ? <div className="alert alert-danger">{error.products}</div> : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Quantity</th><th>Actions</th></tr></thead>
                    <tbody>
                      {products.length > 0 ? products.map(p => (
                        <tr key={p._id}>
                          <td>
                            {p.image ? (<img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />) : (<div style={{ width: '60px', height: '60px', background: '#f0e5c4', borderRadius: '8px' }} className="d-flex align-items-center justify-content-center text-muted small">No Img</div>)}
                          </td>
                          <td className="fw-bold">{p.name}</td>
                          <td>₹{p.price}</td>
                          <td>{p.quantity}</td>
                          <td><Button variant="secondary" size="sm" className="me-2" onClick={() => openProductModal(p)}>Edit</Button><Button variant="danger" size="sm" onClick={() => handleDeleteProduct(p._id)}>Delete</Button></td>
                        </tr>
                      )) : <tr><td colSpan="5" className="text-center">You have not added any products yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar">
        <h2 className="sidebar-header">HIVEHELP</h2>
        <nav className="sidebar-nav nav flex-column">
          <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><i className="bi bi-grid-fill"></i> Dashboard</button>
          <button className={`nav-link ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}><i className="bi bi-calendar-check-fill"></i> Assigned Jobs</button>
          <button className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><i className="bi bi-receipt"></i> My Orders</button>
          <button className={`nav-link ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><i className="bi bi-box-seam"></i> My Products</button>
        </nav>
        <div className="sidebar-footer">
          <LogoutButton setRole={setRole} className="btn btn-dark w-100" style={{ backgroundColor: dark, color: '#fffbe6', fontWeight: 600 }} />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <h1 className="mb-5" style={{ fontWeight: 'bold' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
        {renderContent()}
      </main>

      {/* Appointment Details Modal */}
      <Modal show={!!selectedAppointment} onHide={closeDetailsModal} centered>
        <Modal.Header closeButton style={{ background: accent }}>
          <Modal.Title style={{ color: dark, fontWeight: 'bold' }}>Appointment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAppointment && (
            <div>
              <p><strong>Customer:</strong> {selectedAppointment.user?.name}</p>
              <p><strong>Contact:</strong> {selectedAppointment.user?.email} / {selectedAppointment.user?.phone}</p>
              <p><strong>Address:</strong> {selectedAppointment.address}</p>
              <p><strong>Severity:</strong> <span className="text-capitalize">{selectedAppointment.severity}</span></p>
              <p><strong>Hive Location:</strong> {selectedAppointment.hivespot}</p>
              {selectedAppointment.photo && <p><strong>Photo:</strong> <a href={`http://localhost:5000/uploads/${selectedAppointment.photo}`} target="_blank" rel="noopener noreferrer">View Photo</a></p>}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={closeDetailsModal}>Close</Button></Modal.Footer>
      </Modal>

      {/* Product Add/Edit Modal */}
      <Modal show={showProductModal} onHide={closeProductModal} centered>
        <Modal.Header closeButton style={{ background: accent }}>
          <Modal.Title style={{ color: dark, fontWeight: 'bold' }}>{currentProduct._id ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3"><Form.Label>Product Name</Form.Label><Form.Control type="text" name="name" value={currentProduct.name || ''} onChange={handleProductChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} name="description" value={currentProduct.description || ''} onChange={handleProductChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Price (₹)</Form.Label><Form.Control type="number" name="price" value={currentProduct.price || ''} onChange={handleProductChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Quantity</Form.Label><Form.Control type="number" name="quantity" value={currentProduct.quantity || ''} onChange={handleProductChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Product Image</Form.Label><Form.Control type="file" name="image" onChange={handleImageChange} /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeProductModal}>Cancel</Button>
          <Button style={{ background: accent, color: dark, border: 'none' }} onClick={handleSaveProduct}>Save Product</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default BeekeeperDashboard;
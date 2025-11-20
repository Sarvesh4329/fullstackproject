import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios'; // This will be used by the api client
import LogoutButton from '../components/LogoutButton';
import { Modal, Button, Dropdown, Form } from 'react-bootstrap';
import './Dashboard.css'; // Import the new CSS

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

function AdminDashboard({ setRole }) {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard view

  // State for Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ name: '', description: '', price: '', quantity: '' });
  const [productImage, setProductImage] = useState(null);

  // Granular loading and error states for better UX
  const [loading, setLoading] = useState({ users: true, products: true, appointments: true, orders: true });
  const [error, setError] = useState({ users: '', products: '', appointments: '', orders: '' });

  const fetchData = useCallback(async () => {
    // Reset states on new fetch
    setLoading({ users: true, products: true, appointments: true, orders: true });
    setError({ users: '', products: '', appointments: '', orders: '' });

    // Fetch data individually to isolate errors
    const fetchUsers = api().get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => setError(prev => ({ ...prev, users: 'Could not fetch users.' })))
      .finally(() => setLoading(prev => ({ ...prev, users: false })));

    const fetchProducts = api().get('/products')
      .then(res => setProducts(res.data))
      .catch(() => setError(prev => ({ ...prev, products: 'Could not fetch products.' })))
      .finally(() => setLoading(prev => ({ ...prev, products: false })));

    const fetchAppointments = api().get('/admin/appointments')
      .then(res => setAppointments(res.data))
      .catch(() => setError(prev => ({ ...prev, appointments: 'Could not fetch appointments.' })))
      .finally(() => setLoading(prev => ({ ...prev, appointments: false })));

    const fetchOrders = api().get('/admin/orders')
      .then(res => setOrders(res.data))
      .catch(() => setError(prev => ({ ...prev, orders: 'Could not fetch orders.' })))
      .finally(() => setLoading(prev => ({ ...prev, orders: false })));

    // Wait for all fetches to complete
    await Promise.all([fetchUsers, fetchProducts, fetchAppointments, fetchOrders]);

  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api().patch(`/admin/users/${userId}/role`, { role: newRole });
      window.alert(`User role updated to ${newRole}.`);
      fetchData();
    } catch (err) {
      window.alert('Failed to update user role.');
    }
  };

  const handleBlockToggle = async (user) => {
    try {
      const newBlockedState = !user.isBlocked;
      await api().patch(`/admin/users/${user._id}/block`, { isBlocked: newBlockedState });
      window.alert(`User has been ${newBlockedState ? 'blocked' : 'unblocked'}.`);
      fetchData();
    } catch (err) {
      window.alert('Failed to update user block status.');
    }
  };

  const handleApproveBeekeeper = async (userId) => {
    try {
      await api().patch(`/admin/users/${userId}/approve`, {});
      window.alert('Beekeeper has been approved.');
      fetchData();
    } catch (err) {
      window.alert('Failed to approve beekeeper.');
    }
  };

  const handleDeleteAllAppointments = async () => {
    if (window.confirm('DANGER: Are you sure you want to delete ALL appointments? This action cannot be undone.')) {
      try {
        await api().delete('/admin/appointments/all');
        window.alert('All appointments have been deleted.');
        fetchData();
      } catch (err) {
        window.alert('Failed to delete all appointments.');
      }
    }
  };

  const handleDeleteAllOrders = async () => {
    if (window.confirm('DANGER: Are you sure you want to delete ALL orders? This action cannot be undone.')) {
      try {
        await api().delete('/admin/orders/all');
        window.alert('All orders have been deleted.');
        fetchData();
      } catch (err) {
        window.alert('Failed to delete all orders.');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      try {
        await api().delete(`/admin/users/${userId}`);
        window.alert('User deleted successfully.');
        fetchData();
      } catch (err) {
        window.alert('Failed to delete user.');
      }
    }
  };

  const openUserDetails = (user) => setSelectedUser(user);
  const closeUserDetails = () => setSelectedUser(null);

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await api().patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      window.alert(`Order status updated to ${newStatus}.`);
      fetchData();
    } catch (err) {
      window.alert('Failed to update order status.');
    }
  };

  const handleAssignBeekeeper = async (appointmentId, beekeeperId) => {
    try {
      await api().patch(`/admin/appointments/${appointmentId}/assign`, { beekeeperId });
      window.alert('Beekeeper assigned successfully.');
      fetchData();
    } catch (err) {
      window.alert('Failed to assign beekeeper.');
    }
  };

  const handleAppointmentStatusChange = async (appointmentId, newStatus) => {
    try {
      await api().patch(`/admin/appointments/${appointmentId}/status`, { status: newStatus });
      window.alert(`Appointment status updated to ${newStatus}.`);
      fetchData();
    } catch (err) {
      window.alert('Failed to update appointment status.');
    }
  };

  // --- Product Management Functions ---
  const openProductModal = (product = { name: '', description: '', price: '', quantity: '' }) => {
    setCurrentProduct(product);
    setProductImage(null);
    setShowProductModal(true);
  };

  const closeProductModal = () => setShowProductModal(false);

  const handleProductChange = (e) => setCurrentProduct({ ...currentProduct, [e.target.name]: e.target.value });
  const handleImageChange = (e) => setProductImage(e.target.files[0]);

  const handleSaveProduct = async () => {
    const formData = new FormData();
    Object.keys(currentProduct).forEach(key => {
      if (key !== '_id' && key !== 'image' && key !== 'beekeeper') {
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
      window.alert('Failed to save product. ' + (err.response?.data?.error || ''));
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

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar">
        <h2 className="sidebar-header">HIVEHELP</h2>
        <nav className="sidebar-nav nav flex-column">
          <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><i className="bi bi-grid-fill"></i> Dashboard</button>
          <button className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><i className="bi bi-people-fill"></i> Users</button>
          <button className={`nav-link ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><i className="bi bi-box-seam"></i> Products</button>
          <button className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><i className="bi bi-receipt"></i> Orders</button>
          <button className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}><i className="bi bi-calendar-check-fill"></i> Appointments</button>
        </nav>
        <div className="sidebar-footer">
          <LogoutButton setRole={setRole} className="btn btn-dark w-100" style={{ backgroundColor: dark, color: '#fffbe6', fontWeight: 600 }} />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <h1 className="mb-5" style={{ fontWeight: 'bold' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>

        {activeTab === 'dashboard' && (
          <div className="row g-4">
            <div className="col-md-3"><div className="stat-card"><h5>Total Users</h5><p className="fs-2 fw-bold">{loading.users ? '...' : users.length}</p></div></div>
            <div className="col-md-3"><div className="stat-card"><h5>Total Products</h5><p className="fs-2 fw-bold">{loading.products ? '...' : products.length}</p></div></div>
            <div className="col-md-3"><div className="stat-card"><h5>Total Orders</h5><p className="fs-2 fw-bold">{loading.orders ? '...' : orders.length}</p></div></div>
            <div className="col-md-3"><div className="stat-card"><h5>Pending Jobs</h5><p className="fs-2 fw-bold">{loading.appointments ? '...' : appointments.filter(a => a.status === 'pending').length}</p></div></div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="card shadow-sm border-0" style={{ borderRadius: 15 }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">All Products</h4>
                <Button style={{ background: accent, color: dark, fontWeight: 600, border: 'none' }} onClick={() => openProductModal()}>Add New Product</Button>
              </div>
              {loading.products ? <p>Loading products...</p> : error.products ? <div className="alert alert-danger">{error.products}</div> : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Stock</th><th>Owner</th><th>Actions</th></tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p._id}>
                          <td>
                            {p.image ? (<img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />)
                              : (<div style={{ width: '50px', height: '50px', background: '#f0e5c4', borderRadius: '8px' }} />)}
                          </td>
                          <td className="fw-bold">{p.name}</td>
                          <td>₹{p.price}</td>
                          <td>{p.quantity}</td>
                          <td>{p.beekeeper?.name || 'Admin'}</td>
                          <td><Button variant="secondary" size="sm" className="me-2" onClick={() => openProductModal(p)}>Edit</Button><Button variant="danger" size="sm" onClick={() => handleDeleteProduct(p._id)}>Delete</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="card shadow-sm border-0" style={{ borderRadius: 15 }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">All Customer Orders</h4>
                <Button variant="danger" onClick={handleDeleteAllOrders}>Delete All</Button>
              </div>
              {loading.orders ? <p>Loading orders...</p> : error.orders ? <div className="alert alert-danger">{error.orders}</div> : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead><tr><th>Date</th><th>Customer</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{orders.map(o => (<tr key={o._id}>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td>{o.user?.name || 'N/A'}</td>
                      <td>{o.product?.name || 'N/A'}</td>
                      <td>{o.quantity}</td>
                      <td>₹{o.price * o.quantity}</td>
                      <td><span className="badge" style={{ backgroundColor: accent, color: dark }}>{o.status}</span></td>
                      <td>
                        <Dropdown><Dropdown.Toggle variant="warning" size="sm" style={{ backgroundColor: accent, color: dark, border: 'none' }}>Manage</Dropdown.Toggle><Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleOrderStatusChange(o._id, 'processing')}>Set to Processing</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleOrderStatusChange(o._id, 'shipped')}>Set to Shipped</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleOrderStatusChange(o._id, 'completed')}>Set to Completed</Dropdown.Item>
                          <Dropdown.Item className="text-danger" onClick={() => handleOrderStatusChange(o._id, 'cancelled')}>Set to Cancelled</Dropdown.Item>
                        </Dropdown.Menu></Dropdown>
                      </td>
                    </tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="card shadow-sm border-0" style={{ borderRadius: 15 }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">All Booked Appointments</h4>
                <Button variant="danger" onClick={handleDeleteAllAppointments}>Delete All</Button>
              </div>
              {loading.appointments ? <p>Loading appointments...</p> : error.appointments ? <div className="alert alert-danger">{error.appointments}</div> : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead><tr><th>Date</th><th>Customer</th><th>Address</th><th>Assigned To</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{appointments.map(a => (<tr key={a._id}>
                      <td>{new Date(a.date).toLocaleDateString()}</td>
                      <td>{a.user?.name || 'N/A'}</td>
                      <td>{a.address}</td>
                      <td>{a.beekeeper?.name || 'Unassigned'}</td>
                      <td><span className="badge" style={{ backgroundColor: accent, color: dark }}>{a.status}</span></td>
                      <td>
                        <Dropdown><Dropdown.Toggle variant="warning" size="sm" style={{ backgroundColor: accent, color: dark, border: 'none' }}>Manage</Dropdown.Toggle><Dropdown.Menu>
                          <Dropdown.Header>Assign Beekeeper</Dropdown.Header>
                          {users.filter(u => u.role === 'beekeeper').map(bk => (<Dropdown.Item key={bk._id} onClick={() => handleAssignBeekeeper(a._id, bk._id)}>{bk.name}</Dropdown.Item>))}
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => handleAppointmentStatusChange(a._id, 'completed')}>Set to Completed</Dropdown.Item>
                        </Dropdown.Menu></Dropdown>
                      </td>
                    </tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card shadow-sm border-0" style={{ borderRadius: 15 }}>
            <div className="card-body p-4">
              <h4 className="mb-4">All Users</h4>
              {loading.users ? <p>Loading users...</p> : error.users ? <div className="alert alert-danger">{error.users}</div> : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} className={u.isBlocked ? 'table-danger' : ''}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td><span className="text-capitalize fw-bold">{u.role}</span> {u.role === 'beekeeper' && <small className="text-muted d-block">{u.locality}</small>}</td>
                          <td>
                            {u.isBlocked ? <span className="badge bg-danger">Blocked</span> :
                             u.role === 'beekeeper' && !u.isApproved ? <span className="badge bg-warning text-dark">Pending Approval</span> :
                             <span className="badge bg-success">Active</span>
                            }
                          </td>
                          <td className="d-flex gap-2">
                            {u.role === 'beekeeper' && !u.isApproved ? (
                              <Button variant="success" size="sm" onClick={() => handleApproveBeekeeper(u._id)}>Approve</Button>
                            ) : (
                              <>
                                <Button variant="outline-secondary" size="sm" onClick={() => openUserDetails(u)} title="View Details"><i className="bi bi-eye-fill"></i></Button>
                                <Button variant={u.isBlocked ? "warning" : "outline-warning"} size="sm" onClick={() => handleBlockToggle(u)} title={u.isBlocked ? 'Unblock User' : 'Block User'}>
                                  <i className={`bi ${u.isBlocked ? 'bi-unlock-fill' : 'bi-lock-fill'}`}></i>
                                </Button>
                                <Dropdown>
                                  <Dropdown.Toggle variant="outline-secondary" size="sm" id={`role-dropdown-${u._id}`} title="Change Role">
                                    <i className="bi bi-person-fill-gear"></i>
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu fixed>
                                    <Dropdown.Item onClick={() => handleRoleChange(u._id, 'user')}>Set as User</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleRoleChange(u._id, 'beekeeper')}>Set as Beekeeper</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleRoleChange(u._id, 'admin')}>Set as Admin</Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteUser(u._id)} title="Delete User"><i className="bi bi-trash-fill"></i></Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {/* User Details Modal */}
      <Modal show={!!selectedUser} onHide={closeUserDetails} centered>
        <Modal.Header closeButton style={{ background: accent }}>
          <Modal.Title style={{ color: dark, fontWeight: 'bold' }}>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <p><strong>ID:</strong> {selectedUser._id}</p>
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> <span className="text-capitalize">{selectedUser.role}</span></p>
              <p><strong>Status:</strong> {selectedUser.isBlocked ? 'Blocked' : (selectedUser.role === 'beekeeper' && !selectedUser.isApproved ? 'Pending Approval' : 'Active')}</p>
              {selectedUser.role === 'beekeeper' && <p><strong>Locality:</strong> {selectedUser.locality}</p>}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeUserDetails}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Product Add/Edit Modal */}
      <Modal show={showProductModal} onHide={closeProductModal} centered>
        <Modal.Header closeButton style={{ background: accent }}>
          <Modal.Title style={{ color: dark, fontWeight: 'bold' }}>{currentProduct._id ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3"><Form.Label>Product Name</Form.Label><Form.Control type="text" name="name" value={currentProduct.name} onChange={handleProductChange} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} name="description" value={currentProduct.description} onChange={handleProductChange} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Price (₹)</Form.Label><Form.Control type="number" name="price" value={currentProduct.price} onChange={handleProductChange} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Stock Quantity</Form.Label><Form.Control type="number" name="quantity" value={currentProduct.quantity} onChange={handleProductChange} required /></Form.Group>
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

export default AdminDashboard;
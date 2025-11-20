import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './TrackingPage.css'; // We will create this new CSS file

function TrackingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const api = useCallback(() => {
    return axios.create({
      baseURL: 'http://localhost:5000/api',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }, [token]);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const [appointmentsRes, ordersRes] = await Promise.all([
          // Use the centralized api client
          api().get('/appointments'),
          api().get('/orders')
        ]);

        const appointments = appointmentsRes.data.map(a => ({
          ...a,
          type: 'Appointment',
          sortDate: new Date(a.date || a.createdAt),
          title: `Hive Removal at ${a.address}`
        }));

        const orders = ordersRes.data.map(o => ({
          ...o,
          type: 'Order',
          sortDate: new Date(o.createdAt),
          title: `Order for ${o.product?.name || 'product'}`
        }));

        const combinedItems = [...appointments, ...orders].sort((a, b) => b.sortDate - a.sortDate);
        setItems(combinedItems);
      } catch (err) {
        setError('Could not fetch tracking information.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
    // eslint-disable-next-line
  }, [api]);

  if (loading) {
    return <div className="container py-5 text-center">Loading your tracking history...</div>;
  }

  return (
    <div className="tracking-page-container">
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="tracking-header">Activity Timeline</h1>
          <Link to="/dashboard" className="btn btn-warning-custom">Back to Dashboard</Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {items.length > 0 ? (
          items.map(item => (
            <div key={item._id} className="tracking-card mb-4">
              <div className="tracking-card-header">
                <h5 className="mb-0">{item.title}</h5>
                <span className="badge bg-secondary">{item.type}</span>
              </div>
              <div className="tracking-card-body">
                <div className="timeline">
                  {item.statusHistory && item.statusHistory
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    .map((event, index) => (
                      <div key={`${item._id}-${index}`} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h6 className="text-capitalize">{event.status}</h6>
                          <p className="text-muted mb-0">
                            {new Date(event.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                  {(!item.statusHistory || item.statusHistory.length === 0) && <p className="text-muted ms-4">No history for this item.</p>}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-5 tracking-card">
            <h4>No activity yet.</h4>
            <p>Your appointments and orders will appear here once you create them.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackingPage;
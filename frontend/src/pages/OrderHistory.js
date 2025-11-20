import React, { useEffect, useState } from 'react';
import axios from 'axios';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    };
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="container mt-4">
      <h2>Your Orders</h2>
      <ul className="list-group">
        {orders.map(o => (
          <li className="list-group-item" key={o._id}>
            {o.product?.name} - Qty: {o.quantity} - ₹{o.total} - {o.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OrderHistory;
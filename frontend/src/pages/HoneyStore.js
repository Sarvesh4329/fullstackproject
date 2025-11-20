import React, { useEffect, useState } from 'react';
import axios from 'axios';

function HoneyStore() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    };
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const handleOrder = async (productId) => {
    try {
      await axios.post('http://localhost:5000/api/orders', {
        productId,
        quantity: quantity[productId] || 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Order placed!');
    } catch (err) {
      setMessage('Order failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <div className="container mt-4">
      <h2>Honey Store</h2>
      <div className="text-success mb-3">{message}</div>
      <ul className="list-group">
        {products.map(p => (
          <li className="list-group-item d-flex align-items-center p-3" key={p._id}>
            {p.image ? (
              <img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginRight: '15px' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', background: '#f0e5c4', borderRadius: '8px', marginRight: '15px' }} className="d-flex align-items-center justify-content-center text-muted small">
                No Img
              </div>
            )}
            <div className="flex-grow-1 me-3">
              <b>{p.name}</b> - ₹{p.price} - {p.quantity} in stock
            </div>
            <input
              type="number"
              min="1"
              max={p.quantity}
              value={quantity[p._id] || 1}
              onChange={e => setQuantity({ ...quantity, [p._id]: e.target.value })}
              className="form-control mx-2"
              style={{ width: '70px' }}
            />
            <button className="btn btn-success" onClick={() => handleOrder(p._id)} disabled={p.quantity < 1}>
              Buy
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HoneyStore;
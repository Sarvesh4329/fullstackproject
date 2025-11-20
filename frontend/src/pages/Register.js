import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const bgColor = "#FFF8DC";
const accent = "#FFD700";
const dark = "#3A2C13";

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', locality: '' });
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: bgColor }}>
      <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="card shadow-lg p-4" style={{ maxWidth: 400, width: "100%", borderRadius: 20, background: "#fffbe6" }}>
          <h2 className="mb-3 text-center" style={{ color: dark, fontWeight: "bold" }}>Register</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              await axios.post('http://localhost:5000/api/auth/register', form);
              window.alert('Registered! Please login.');
            } catch (err) {
              window.alert('Registration failed: ' + (err.response?.data?.error || 'Unknown error'));
            }
          }}>
            <input className="form-control mb-3" name="name" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="form-control mb-3" name="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input className="form-control mb-3" name="password" type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <select className="form-select mb-3" name="role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="user">User</option>
              <option value="beekeeper">Beekeeper</option>
              <option value="admin">Admin</option>
            </select>
            {form.role === 'beekeeper' && (
              <input className="form-control mb-3" name="locality" placeholder="Your Locality/City" value={form.locality} onChange={e => setForm({ ...form, locality: e.target.value })} required />
            )}
            <button className="btn w-100 mb-2" style={{ background: accent, color: dark, fontWeight: 600 }} type="submit">Register</button>
            <div className="mt-3 text-center">
              <span>Already have an account? </span>
              <button type="button" className="btn btn-link" onClick={() => navigate('/login')}>Login here</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
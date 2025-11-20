import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const bgColor = "#FFF8DC";
const accent = "#FFD700";
const dark = "#3A2C13";

function Login({ setRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: bgColor }}>
      <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="card shadow-lg p-4" style={{ maxWidth: 400, width: "100%", borderRadius: 20, background: "#fffbe6" }}>
          <h2 className="mb-3 text-center" style={{ color: dark, fontWeight: "bold" }}>Login</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
              localStorage.setItem('token', res.data.token);
              setRole(res.data.role);
              navigate('/dashboard');
            } catch (err) {
              window.alert('Login failed: ' + (err.response?.data?.error || 'Unknown error'));
            }
          }}>
            <input className="form-control mb-3" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="form-control mb-3" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button className="btn w-100 mb-2" style={{ background: accent, color: dark, fontWeight: 600 }} type="submit">Login</button>
            <div className="mt-3 text-center">
              <span>If you don't have an account? </span>
              <button type="button" className="btn btn-link" onClick={() => navigate('/register')}>Register here</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
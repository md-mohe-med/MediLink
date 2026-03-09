import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import './login.css';

function Login() {
  const navigate = useNavigate();
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.target);

    try {
      const res = await api.post('/login', {
        email:    formData.get('email'),
        password: formData.get('password'),
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role',  res.data.role);

      const role = res.data.role;
      if (role === 'patient') navigate('/patient/dashboard');
      if (role === 'doctor')  navigate('/doctor/dashboard');
      if (role === 'lab')     navigate('/lab/dashboard');
      if (role === 'admin')   navigate('/admin/dashboard');

    } catch (err) {
      if (err.response?.data?.errors) {
        const messages = Object.values(err.response.data.errors).flat().join('\n');
        setError(messages);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ── Top Bar ── */}
        <div className="login-topbar">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <span className="login-topbar-title">Login</span>
        </div>

        {/* ── Header ── */}
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">
          Enter your credentials to access your account and continue your journey.
        </p>

        {/* ── Error ── */}
        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── Email ── */}
          <label className="field-label" htmlFor="email">Email Address</label>
          <div className="field-wrap">
            <span className="field-icon">✉️</span>
            <input
              className="field-input"
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              required
            />
          </div>

          {/* ── Password ── */}
          <label className="field-label" htmlFor="password">Password</label>
          <div className="field-wrap">
            <span className="field-icon">🔒</span>
            <input
              className="field-input"
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {/* ── Forgot Password ── */}
          <div className="forgot-wrap">
            <span className="forgot-link">Forgot Password?</span>
          </div>

          {/* ── Submit ── */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* ── Divider ── */}
          <div className="divider">
            <span className="divider-line" />
            <span className="divider-text">OR CONTINUE WITH</span>
            <span className="divider-line" />
          </div>

          {/* ── Social Buttons ── */}
          <div className="social-wrap">
            <button type="button" className="social-btn">
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="social-icon"
              />
              Google
            </button>
            <button type="button" className="social-btn">
              <span className="social-icon">🍎</span>
              Apple
            </button>
          </div>

        </form>

        {/* ── Register Link ── */}
        <p className="register-link-wrap">
          Don't have an account?{' '}
          <span className="register-link" onClick={() => navigate('/register')}>
            Sign Up
          </span>
        </p>

      </div>
    </div>
  );
}

export default Login;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import './register.css';

function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('patient');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.target);

    // For now, backend AuthController@register only expects core user fields.
    // Profile / document details are handled by dedicated profile endpoints.
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      phone: formData.get('phone') || null,
      role,
    };

    try {
      await api.post('/register', payload);
      navigate('/login');
    } catch (err) {
      // Show detailed backend validation / error info to help debugging
      if (err.response?.data?.errors) {
        const messages = Object.values(err.response.data.errors).flat().join('\n');
        setError(messages);
      } else if (typeof err.response?.data === 'string') {
        setError(err.response.data);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(`Registration failed. Please try again. (${err.message || 'Unknown error'})`);
      }
      // Also log full error to console for inspection
      // eslint-disable-next-line no-console
      console.error('Register error', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        {/* ── Top Bar ── */}
        <div className="register-topbar">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <span className="register-topbar-title">Create Account</span>
        </div>

        {/* ── Header ── */}
        <h1 className="register-title">Join us</h1>
        <p className="register-subtitle">Fill in your details to get started with your account.</p>

        {/* ── Error ── */}
        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── Name ── */}
          <label className="field-label" htmlFor="name">Full Name</label>
          <div className="field-wrap">
            <span className="field-icon">👤</span>
            <input className="field-input" type="text" id="name" name="name" placeholder="John Doe" required />
          </div>

          {/* ── Email ── */}
          <label className="field-label" htmlFor="email">Email Address</label>
          <div className="field-wrap">
            <span className="field-icon">✉️</span>
            <input className="field-input" type="email" id="email" name="email" placeholder="example@email.com" required />
          </div>

          {/* ── Password ── */}
          <label className="field-label" htmlFor="password">Password</label>
          <div className="field-wrap">
            <span className="field-icon">🔒</span>
            <input className="field-input" type="password" id="password" name="password" placeholder="••••••••" required minLength={8} />
          </div>

          {/* ── Phone ── */}
          <label className="field-label" htmlFor="phone">Phone Number</label>
          <div className="field-wrap">
            <span className="field-icon">📞</span>
            <input className="field-input" type="tel" id="phone" name="phone" placeholder="+213 555 123 456" />
          </div>

          {/* ── Role ── */}
          <label className="field-label" htmlFor="role">I am a</label>
          <div className="field-wrap">
            <span className="field-icon">🏷️</span>
            <select
              className="field-input"
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="lab">Lab</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* ── Admin Extra Fields ── */}
          {role === 'admin' && (
            <div className="role-section admin">
              <p className="role-section-title">🛡️ Admin Verification</p>

              <label className="field-label" htmlFor="admin_key">Admin Key</label>
              <div className="field-wrap">
                <span className="field-icon">🔑</span>
                <input className="field-input" type="password" id="admin_key" name="admin_key" placeholder="Enter admin secret key" required />
              </div>
            </div>
          )}

          {/* ── Doctor Extra Fields ── */}
          {role === 'doctor' && (
            <div className="role-section doctor">
              <p className="role-section-title">🩺 Doctor Information</p>

              <label className="field-label" htmlFor="specialization">Specialization</label>
              <div className="field-wrap">
                <select className="field-input-plain" id="specialization" name="specialization" required>
                  <option value="">Select Specialization</option>
                  <option value="general">General Practitioner</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="dermatology">Dermatology</option>
                  <option value="neurology">Neurology</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="psychiatry">Psychiatry</option>
                  <option value="radiology">Radiology</option>
                  <option value="surgery">Surgery</option>
                  <option value="urology">Urology</option>
                  <option value="gynecology">Gynecology</option>
                  <option value="ophthalmology">Ophthalmology</option>
                  <option value="oncology">Oncology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <label className="field-label" htmlFor="license_number">License Number</label>
              <div className="field-wrap">
                <input className="field-input-plain" type="text" id="license_number" name="license_number" placeholder="DZ-12345" required />
              </div>

              <label className="field-label" htmlFor="license_file">License File (PDF or Image)</label>
              <div className="field-wrap">
                <input className="field-input-plain" type="file" id="license_file" name="license_file" accept=".pdf,.jpg,.jpeg,.png" required />
              </div>

              <label className="field-label" htmlFor="hospital_name">Hospital / Clinic</label>
              <div className="field-wrap">
                <input className="field-input-plain" type="text" id="hospital_name" name="hospital_name" placeholder="Hospital or Clinic Name" />
              </div>

              <label className="field-label" htmlFor="years_of_experience">Years of Experience</label>
              <div className="field-wrap">
                <input className="field-input-plain" type="number" id="years_of_experience" name="years_of_experience" placeholder="e.g. 5" min={0} max={60} />
              </div>

              <label className="field-label" htmlFor="about">About</label>
              <div className="field-wrap">
                <textarea className="field-input-plain" id="about" name="about" placeholder="Brief description about yourself" rows={3} />
              </div>
            </div>
          )}

          {/* ── Patient Extra Fields ── */}
          {role === 'patient' && (
            <div className="role-section patient">
              <p className="role-section-title">🧑‍⚕️ Patient Information</p>

              <label className="field-label" htmlFor="date_of_birth">Date of Birth</label>
              <div className="field-wrap">
                <input className="field-input-plain" type="date" id="date_of_birth" name="date_of_birth" />
              </div>

              <label className="field-label" htmlFor="national_id">National ID</label>
              <div className="field-wrap">
                <input className="field-input-plain" type="text" id="national_id" name="national_id" placeholder="National ID" />
              </div>

              <label className="field-label" htmlFor="gender">Gender</label>
              <div className="field-wrap">
                <select className="field-input-plain" id="gender" name="gender">
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <label className="field-label" htmlFor="blood_type">Blood Type</label>
              <div className="field-wrap">
                <select className="field-input-plain" id="blood_type" name="blood_type">
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          )}

          {/* ── Lab Extra Fields ── */}
          {role === 'lab' && (
            <div className="role-section lab">
              <p className="role-section-title">🧪 Lab Information</p>

              <label className="field-label" htmlFor="lab_name">Lab Name</label>
              <div className="field-wrap">
                <input className="field-input-plain" type="text" id="lab_name" name="lab_name" placeholder="Laboratory Name" required />
              </div>

              <label className="field-label" htmlFor="address">Address</label>
              <div className="field-wrap">
                <input className="field-input-plain" type="text" id="address" name="address" placeholder="Lab Address" />
              </div>

              <label className="field-label" htmlFor="working_hours">Working Hours</label>
              <div className="field-wrap">
                <input className="field-input-plain" type="text" id="working_hours" name="working_hours" placeholder="e.g. 8am - 6pm" />
              </div>

              <label className="field-label" htmlFor="official_doc">Official Document (PDF or Image)</label>
              <div className="field-wrap">
                <input className="field-input-plain" type="file" id="official_doc" name="official_doc" accept=".pdf,.jpg,.jpeg,.png" required />
              </div>
            </div>
          )}

          {/* ── Terms ── */}
          <div className="terms-wrap">
            <input type="checkbox" id="terms" required />
            <label htmlFor="terms" className="terms-text">
              By creating an account, you agree to our{' '}
              <span className="terms-link">Terms of Service</span>
              {' '}and{' '}
              <span className="terms-link">Privacy Policy</span>.
            </label>
          </div>

          {/* ── Submit ── */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* ── Login Link ── */}
          <p className="login-link-wrap">
            Already have an account?{' '}
            <span className="login-link" onClick={() => navigate('/login')}>Log in</span>
          </p>

        </form>
      </div>
    </div>
  );
}

export default Register;

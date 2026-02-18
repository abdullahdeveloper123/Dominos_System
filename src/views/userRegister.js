import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const UserRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.address || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        password: formData.password
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save user ID to localStorage
        localStorage.setItem('userId', data.user.id);
        
        alert(data.message || 'Registration successful!');
        navigate('/'); // Redirect to home
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-register-container">
      <div className="seller-register-card">
        <div className="seller-register-left">
          <h1 className="seller-register-logo">Domino's</h1>
          <p className="seller-register-tagline">
            Join us today and enjoy delicious pizzas delivered to your doorstep
          </p>
        </div>

        <div className="seller-register-right">
          <h2 className="seller-register-title">Create an Account</h2>
          <p className="seller-register-subtitle">
            Register to start ordering your favorite pizzas
          </p>

          <form onSubmit={handleSubmit} className="seller-register-form">
            {error && <div className="seller-register-error">{error}</div>}

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label>Delivery Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street, New York, NY 10001"
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
              />
            </div>

            <div className="seller-register-actions">
              <button 
                type="submit" 
                className="seller-register-submit"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Sign Up'}
              </button>

              <button 
                type="button" 
                className="seller-register-signin"
                onClick={() => navigate('/user/login')}
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;

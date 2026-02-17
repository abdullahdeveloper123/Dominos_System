import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const SellerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/seller_account/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('sellerId', data.seller.id);
        
        // Check if seller has a hotel
        try {
          const checkResponse = await fetch(`${process.env.REACT_APP_API_URL}/check_seller_hotel`, {
            method: 'GET',
            credentials: 'include' // Include cookies for session
          });

          const checkData = await checkResponse.json();

          if (checkResponse.ok && checkData.success) {
            if (checkData.hasHotel) {
              // Seller has a hotel, redirect to admin panel
              navigate('/seller_account/');
            } else {
              // Seller doesn't have a hotel, redirect to make shop
              navigate('/make_shop');
            }
          } else {
            // If check fails, default to make shop
            navigate('/make_shop');
          }
        } catch (checkErr) {
          console.error('Error checking hotel status:', checkErr);
          // If check fails, default to make shop
          navigate('/make_shop');
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
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
            Welcome back! Login to manage your store and products
          </p>
        </div>

        <div className="seller-register-right">
          <h2 className="seller-register-title">Seller Login</h2>
          <p className="seller-register-subtitle">
            Sign in to your seller account
          </p>

          <form onSubmit={handleSubmit} className="seller-register-form">
            {error && <div className="seller-register-error">{error}</div>}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
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
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="seller-register-actions">
              <button 
                type="submit" 
                className="seller-register-submit"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <button 
                type="button" 
                className="seller-register-signin"
                onClick={() => navigate('/seller_account/register')}
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;

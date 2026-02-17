import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const SellerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    country: 'United States',
    password: '',
    confirmPassword: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
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
    if (!formData.firstName || !formData.lastName || !formData.name || !formData.email || !formData.phone || !formData.address || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the terms and conditions');
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
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/seller_account/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('sellerId', data.sellerId);
        
        // Check if seller has a hotel
        try {
          const checkResponse = await fetch(`${process.env.REACT_APP_API_URL}/check_seller_hotel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ seller_id: data.sellerId })
          });

          const checkData = await checkResponse.json();

          if (checkResponse.ok && checkData.success) {
            if (checkData.hasHotel) {
              // Seller has a hotel, redirect to admin panel
              navigate('/seller-admin-panel');
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
            Join our network of successful sellers and grow your business with us
          </p>
        </div>

        <div className="seller-register-right">
          <h2 className="seller-register-title">Create an Account</h2>
          <p className="seller-register-subtitle">
            Create an account and start selling your products throughout the world
          </p>

          <form onSubmit={handleSubmit} className="seller-register-form">
            {error && <div className="seller-register-error">{error}</div>}

            <div className="seller-register-row">
              <div className="form-group">
                <label>First name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ismail"
                  required
                />
              </div>

              <div className="form-group">
                <label>Last name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Hassan"
                  required
                />
              </div>
            </div>

            <div className="seller-register-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01895784365"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jenniferphd@gmail.com"
                  required
                />
              </div>
            </div>

            <div className="seller-register-row">
              <div className="form-group">
                <label>Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Store Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John's Pizza Shop"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street, New York, NY 10001"
                required
              />
            </div>

            <div className="seller-register-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••"
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
                  placeholder="••••••••••"
                  required
                />
              </div>
            </div>

            <div className="seller-register-checkbox">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <label htmlFor="agreeTerms">I agree the terms and conditions</label>
            </div>

            <div className="seller-register-actions">
              <button 
                type="submit" 
                className="seller-register-submit"
                disabled={loading}
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>

              <button 
                type="button" 
                className="seller-register-signin"
                onClick={() => navigate('/')}
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

export default SellerRegister;

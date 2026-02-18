import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const UserLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
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
    if (!formData.name || !formData.password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        password: formData.password
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/login`, {
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
        
        alert(data.message || 'Login successful!');
        navigate('/'); // Redirect to home
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
            Welcome back! Login to continue ordering your favorite pizzas
          </p>
        </div>

        <div className="seller-register-right">
          <h2 className="seller-register-title">User Login</h2>
          <p className="seller-register-subtitle">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="seller-register-form">
            {error && <div className="seller-register-error">{error}</div>}

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
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
                onClick={() => navigate('/user/register')}
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

export default UserLogin;

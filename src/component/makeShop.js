import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const MakeShop = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hotelName: '',
    cityName: ''
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
    if (!formData.hotelName || !formData.cityName) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      // Get seller_id from localStorage
      const sellerId = localStorage.getItem('sellerId');
      
      if (!sellerId) {
        setError('Seller ID not found. Please register first.');
        setLoading(false);
        return;
      }

      const payload = {
        city_name: formData.cityName,
        hotel_name: formData.hotelName,
        seller_id: sellerId
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/make_shop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save hotel document ID to localStorage
        localStorage.setItem('hotelDocumentId', data.hotelDocumentId);
        localStorage.setItem('hotelId', data.hotel.hotel_id);
        
        alert(data.message || 'Shop created successfully!');
        // Navigate to next step or dashboard
        navigate('/seller-admin-panel');
      } else {
        setError(data.message || 'Failed to create shop. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Shop creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="make-shop-container">
      <div className="make-shop-card">
        <div className="make-shop-header">
          <h2 className="make-shop-title">Create Your Shop</h2>
          <p className="make-shop-subtitle">Enter your shop details to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="make-shop-form">
          {error && <div className="make-shop-error">{error}</div>}

          <div className="form-group">
            <label>Shop Name</label>
            <input
              type="text"
              name="hotelName"
              value={formData.hotelName}
              onChange={handleChange}
              placeholder="e.g., Khan's Pizza Palace"
              required
            />
          </div>

          <div className="form-group">
            <label>City/Location</label>
            <input
              type="text"
              name="cityName"
              value={formData.cityName}
              onChange={handleChange}
              placeholder="e.g., Lahore"
              required
            />
          </div>

          <button 
            type="submit" 
            className="make-shop-submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Next'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MakeShop;

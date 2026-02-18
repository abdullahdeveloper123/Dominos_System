import React, { useState, useEffect } from 'react';
import '../App.css';

const EditSellerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/seller_account/edit_seller_profile`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFormData({
          name: data.seller.name || '',
          email: data.seller.email || '',
          phone: data.seller.phone || '',
          address: data.seller.address || '',
          password: ''
        });
      } else {
        setError(data.message || 'Failed to load profile data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone is required');
      return;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      };

      // Only include password if it's been entered
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/seller_account/edit_seller_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Profile updated successfully!');
        // Clear password field after successful update
        setFormData(prev => ({ ...prev, password: '' }));
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.message || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <h2 className="edit-profile-title">Edit Profile</h2>
        <p className="edit-profile-subtitle">Update your account information</p>
      </div>

      {error && (
        <div className="edit-profile-message error-message-box">
          {error}
        </div>
      )}

      {success && (
        <div className="edit-profile-message success-message-box">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="edit-profile-section">
          <h3 className="edit-profile-section-title">Basic Information</h3>
          
          <div className="edit-profile-form-group">
            <label htmlFor="name" className="edit-profile-label">
              Store Name <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="edit-profile-input"
              placeholder="Enter your store name"
              required
            />
          </div>

          <div className="edit-profile-form-group">
            <label htmlFor="email" className="edit-profile-label">
              Email Address <span className="required-star">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="edit-profile-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="edit-profile-form-group">
            <label htmlFor="phone" className="edit-profile-label">
              Phone Number <span className="required-star">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="edit-profile-input"
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="edit-profile-form-group">
            <label htmlFor="address" className="edit-profile-label">
              Address <span className="required-star">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="edit-profile-textarea"
              placeholder="Enter your complete address"
              rows="3"
              required
            />
          </div>
        </div>

        <div className="edit-profile-section">
          <h3 className="edit-profile-section-title">Change Password</h3>
          <p className="edit-profile-section-note">Leave blank if you don't want to change your password</p>
          
          <div className="edit-profile-form-group">
            <label htmlFor="password" className="edit-profile-label">
              New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="edit-profile-input"
              placeholder="Enter new password (optional)"
            />
            <small className="edit-profile-hint">
              Password should be at least 6 characters long
            </small>
          </div>
        </div>

        <div className="edit-profile-actions">
          <button
            type="button"
            className="edit-profile-btn edit-profile-cancel-btn"
            onClick={fetchProfileData}
            disabled={saving}
          >
            Reset Changes
          </button>
          <button
            type="submit"
            className="edit-profile-btn edit-profile-save-btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSellerProfile;

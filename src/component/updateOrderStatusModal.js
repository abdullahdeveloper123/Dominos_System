import React, { useState } from 'react';
import '../App.css';

const UpdateOrderStatusModal = ({ order, onClose, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState(order.order_status || 'pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'out for delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const handleUpdateStatus = async () => {
    if (selectedStatus === order.order_status) {
      setError('Please select a different status');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        order_id: order._id,
        order_status: selectedStatus
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/update_order_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Order status updated successfully!');
        onUpdate(); // Refresh the orders list
        onClose();
      } else {
        setError(data.message || 'Failed to update status. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Status update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'confirmed':
        return '#0066CC';
      case 'preparing':
        return '#9C27B0';
      case 'out for delivery':
        return '#2196F3';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <div className="update-status-overlay" onClick={onClose}>
      <div className="update-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="update-status-header">
          <h2 className="update-status-title">Update Order Status</h2>
          <button className="update-status-close" onClick={onClose}>×</button>
        </div>

        <div className="update-status-content">
          {/* Order Info */}
          <div className="update-status-order-info">
            <p className="update-status-order-id">Order ID: #{order._id.slice(-8)}</p>
            <p className="update-status-product-name">{order.product_name}</p>
          </div>

          {/* Current Status */}
          <div className="update-status-current">
            <label>Current Status:</label>
            <span 
              className="update-status-current-badge"
              style={{ backgroundColor: getStatusColor(order.order_status) }}
            >
              {order.order_status || 'Pending'}
            </span>
          </div>

          {/* Status Selector */}
          <div className="update-status-selector">
            <label>Select New Status:</label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="update-status-select"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="update-status-preview">
            <label>New Status Preview:</label>
            <span 
              className="update-status-preview-badge"
              style={{ backgroundColor: getStatusColor(selectedStatus) }}
            >
              {statusOptions.find(opt => opt.value === selectedStatus)?.label}
            </span>
          </div>

          {/* Error Message */}
          {error && <div className="update-status-error">{error}</div>}
        </div>

        <div className="update-status-footer">
          <button 
            className="update-status-btn update-status-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="update-status-btn update-status-submit-btn"
            onClick={handleUpdateStatus}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateOrderStatusModal;

import React from 'react';
import '../App.css';

const OrderDetailsModal = ({ order, onClose }) => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="order-details-overlay" onClick={onClose}>
      <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="order-details-header">
          <div>
            <h2 className="order-details-title">Order Details</h2>
            <p className="order-details-id">Order ID: #{order._id}</p>
          </div>
          <button className="order-details-close" onClick={onClose}>×</button>
        </div>

        <div className="order-details-content">
          {/* Status Section */}
          <div className="order-details-section">
            <div className="order-details-status-row">
              <span 
                className="order-details-status-badge"
                style={{ backgroundColor: getStatusColor(order.order_status) }}
              >
                {order.order_status || 'Pending'}
              </span>
              <span className="order-details-date">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="order-details-section">
            <h3 className="order-details-section-title">Customer Information</h3>
            <div className="order-details-info-grid">
              <div className="order-details-info-item">
                <span className="order-details-label">Customer ID:</span>
                <span className="order-details-value">{order.user_id}</span>
              </div>
              <div className="order-details-info-item">
                <span className="order-details-label">Delivery Address:</span>
                <span className="order-details-value">{order.delivery_address}</span>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="order-details-section">
            <h3 className="order-details-section-title">Product Details</h3>
            <div className="order-details-product">
              <img 
                src={order.product_img || 'https://source.unsplash.com/200x200/?food'} 
                alt={order.product_name}
                className="order-details-product-img"
              />
              <div className="order-details-product-info">
                <h4 className="order-details-product-name">{order.product_name}</h4>
                <div className="order-details-product-meta">
                  <span>Quantity: <strong>{order.product_quantity}</strong></span>
                  <span>Price per item: <strong>{order.total_price}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Store Information */}
          <div className="order-details-section">
            <h3 className="order-details-section-title">Store Information</h3>
            <div className="order-details-info-grid">
              <div className="order-details-info-item">
                <span className="order-details-label">Store Name:</span>
                <span className="order-details-value">{order.hotel_name}</span>
              </div>
              <div className="order-details-info-item">
                <span className="order-details-label">City:</span>
                <span className="order-details-value">{order.city_name}</span>
              </div>
              <div className="order-details-info-item">
                <span className="order-details-label">Store ID:</span>
                <span className="order-details-value">{order.store_id}</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-details-section order-details-summary">
            <h3 className="order-details-section-title">Order Summary</h3>
            <div className="order-details-summary-row">
              <span>Subtotal:</span>
              <span>{order.total_price}</span>
            </div>
            <div className="order-details-summary-row">
              <span>Delivery Fee:</span>
              <span>Included</span>
            </div>
            <div className="order-details-summary-row order-details-total">
              <span>Total Amount:</span>
              <span>{order.total_price}</span>
            </div>
          </div>
        </div>

        <div className="order-details-footer">
          <button className="order-details-btn order-details-close-btn" onClick={onClose}>
            Close
          </button>
          <button className="order-details-btn order-details-print-btn">
            Print Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;

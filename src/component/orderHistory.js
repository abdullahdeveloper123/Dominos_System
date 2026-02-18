import React, { useState, useEffect } from 'react';
import OrderDetailsModal from './orderDetailsModal';
import '../App.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/all_orders`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to fetch order history');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching order history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredOrders = () => {
    if (filterStatus === 'all') {
      return orders;
    }
    return orders.filter(order => order.order_status?.toLowerCase() === filterStatus);
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="order-history-loading">
        <p>Loading order history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history-error">
        <p>{error}</p>
        <button onClick={fetchOrders} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={handleCloseModal}
        />
      )}

      <div className="order-history-header">
        <div>
          <h2 className="order-history-title">Order History</h2>
          <p className="order-history-subtitle">View all your past orders</p>
        </div>
        <div className="order-history-stats">
          <div className="order-stat">
            <span className="order-stat-number">{orders.length}</span>
            <span className="order-stat-label">Total Orders</span>
          </div>
        </div>
      </div>

      <div className="order-history-filters">
        <button 
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All ({orders.length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'delivered' ? 'active' : ''}`}
          onClick={() => setFilterStatus('delivered')}
        >
          Delivered ({orders.filter(o => o.order_status?.toLowerCase() === 'delivered').length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilterStatus('cancelled')}
        >
          Cancelled ({orders.filter(o => o.order_status?.toLowerCase() === 'cancelled').length})
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          Pending ({orders.filter(o => o.order_status?.toLowerCase() === 'pending').length})
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="order-history-empty">
          <p>No orders found for this filter</p>
        </div>
      ) : (
        <div className="order-history-timeline">
          {filteredOrders.map((order, index) => (
            <div key={order._id} className="timeline-item">
              <div className="timeline-marker">
                <div 
                  className="timeline-dot"
                  style={{ backgroundColor: getStatusColor(order.order_status) }}
                ></div>
                {index !== filteredOrders.length - 1 && <div className="timeline-line"></div>}
              </div>
              
              <div className="timeline-content">
                <div className="timeline-card">
                  <div className="timeline-card-header">
                    <div className="timeline-date">
                      <span className="timeline-date-text">{formatDate(order.createdAt)}</span>
                      <span className="timeline-order-id">Order #{order._id.slice(-8)}</span>
                    </div>
                    <span 
                      className="timeline-status-badge"
                      style={{ backgroundColor: getStatusColor(order.order_status) }}
                    >
                      {order.order_status || 'Pending'}
                    </span>
                  </div>

                  <div className="timeline-card-body">
                    <div className="timeline-product">
                      <img 
                        src={order.product_img || 'https://source.unsplash.com/80x80/?food'} 
                        alt={order.product_name}
                        className="timeline-product-img"
                      />
                      <div className="timeline-product-info">
                        <h4 className="timeline-product-name">{order.product_name}</h4>
                        <p className="timeline-product-meta">
                          Quantity: {order.product_quantity} × {order.total_price}
                        </p>
                        <p className="timeline-delivery-address">
                          <strong>Delivered to:</strong> {order.delivery_address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="timeline-card-footer">
                    <div className="timeline-total">
                      <span>Total Amount:</span>
                      <span className="timeline-total-price">{order.total_price}</span>
                    </div>
                    <button 
                      className="timeline-view-btn"
                      onClick={() => handleViewDetails(order)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;

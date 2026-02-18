import React, { useState, useEffect } from 'react';
import OrderDetailsModal from './orderDetailsModal';
import UpdateOrderStatusModal from './updateOrderStatusModal';
import '../App.css';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/all_orders`, {
        method: 'GET',
        credentials: 'include' // Include cookies for session
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching orders:', err);
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

  const handleUpdateStatus = (order) => {
    setUpdatingOrder(order);
  };

  const handleCloseUpdateModal = () => {
    setUpdatingOrder(null);
  };

  const handleStatusUpdated = () => {
    fetchOrders(); // Refresh the orders list
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

  if (loading) {
    return (
      <div className="orders-loading">
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-error">
        <p>{error}</p>
        <button onClick={fetchOrders} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="orders-container">
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={handleCloseModal}
        />
      )}

      {updatingOrder && (
        <UpdateOrderStatusModal 
          order={updatingOrder} 
          onClose={handleCloseUpdateModal}
          onUpdate={handleStatusUpdated}
        />
      )}

      <div className="orders-header">
        <h2 className="orders-title">All Orders</h2>
        <span className="orders-count">Total: {orders.length}</span>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <p>No orders found</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div className="order-info">
                  <span className="order-id">Order #{order._id.slice(-8)}</span>
                  <span 
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.order_status) }}
                  >
                    {order.order_status || 'Pending'}
                  </span>
                </div>
                <span className="order-date">{formatDate(order.createdAt)}</span>
              </div>

              <div className="order-card-body">
                <div className="order-product">
                  <img 
                    src={order.product_img || 'https://source.unsplash.com/100x100/?food'} 
                    alt={order.product_name}
                    className="order-product-img"
                  />
                  <div className="order-product-details">
                    <h3 className="order-product-name">{order.product_name}</h3>
                    <p className="order-product-quantity">Quantity: {order.product_quantity}</p>
                    <p className="order-product-price">Total: {order.total_price}</p>
                  </div>
                </div>

                <div className="order-delivery">
                  <div className="order-delivery-item">
                    <strong>Delivery Address:</strong>
                    <p>{order.delivery_address}</p>
                  </div>
                  <div className="order-delivery-item">
                    <strong>Location:</strong>
                    <p>{order.hotel_name}, {order.city_name}</p>
                  </div>
                </div>
              </div>

              <div className="order-card-footer">
                <button 
                  className="order-action-btn order-view-btn"
                  onClick={() => handleViewDetails(order)}
                >
                  View Details
                </button>
                <button 
                  className="order-action-btn order-update-btn"
                  onClick={() => handleUpdateStatus(order)}
                >
                  Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersList;

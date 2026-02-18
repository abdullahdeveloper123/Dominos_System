import React, { useState, useEffect } from 'react';
import { FaStore, FaDollarSign, FaShoppingCart, FaBox, FaTrophy, FaClock } from 'react-icons/fa';
import '../App.css';

const SellerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/seller_account/stats`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Failed to load dashboard stats');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching stats:', err);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={fetchStats} className="retry-btn">Retry</button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="seller-dashboard">
      {/* Welcome Header */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-text">
          <h1 className="dashboard-welcome-title">Welcome back, {stats.seller_info.name}!</h1>
          <p className="dashboard-welcome-subtitle">
            <FaStore /> {stats.hotel_info.hotel_name} • {stats.hotel_info.city_name}
          </p>
        </div>
        <button className="dashboard-refresh-btn" onClick={fetchStats}>
          Refresh Data
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="dashboard-metrics">
        <div className="metric-card metric-card-earnings">
          <div className="metric-icon">
            <FaDollarSign size={32} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Earnings</p>
            <h2 className="metric-value">{stats.earnings.total}</h2>
            <p className="metric-subtitle">Avg: {stats.earnings.average_order_value}/order</p>
          </div>
        </div>

        <div className="metric-card metric-card-orders">
          <div className="metric-icon">
            <FaShoppingCart size={32} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Orders</p>
            <h2 className="metric-value">{stats.orders.total}</h2>
            <p className="metric-subtitle">Today: {stats.orders.today}</p>
          </div>
        </div>

        <div className="metric-card metric-card-products">
          <div className="metric-icon">
            <FaBox size={32} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Products</p>
            <h2 className="metric-value">{stats.products.total}</h2>
            <p className="metric-subtitle">Active listings</p>
          </div>
        </div>
      </div>

      {/* Orders Overview */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Orders Overview</h3>
        <div className="orders-overview-grid">
          <div className="overview-card">
            <p className="overview-label">This Week</p>
            <p className="overview-value">{stats.orders.this_week}</p>
          </div>
          <div className="overview-card">
            <p className="overview-label">This Month</p>
            <p className="overview-value">{stats.orders.this_month}</p>
          </div>
          <div className="overview-card">
            <p className="overview-label">Pending</p>
            <p className="overview-value overview-pending">{stats.orders.by_status.pending}</p>
          </div>
          <div className="overview-card">
            <p className="overview-label">Confirmed</p>
            <p className="overview-value overview-confirmed">{stats.orders.by_status.confirmed}</p>
          </div>
          <div className="overview-card">
            <p className="overview-label">Preparing</p>
            <p className="overview-value overview-preparing">{stats.orders.by_status.preparing}</p>
          </div>
          <div className="overview-card">
            <p className="overview-label">Out for Delivery</p>
            <p className="overview-value overview-delivery">{stats.orders.by_status.out_for_delivery}</p>
          </div>
          <div className="overview-card">
            <p className="overview-label">Delivered</p>
            <p className="overview-value overview-delivered">{stats.orders.by_status.delivered}</p>
          </div>
          <div className="overview-card">
            <p className="overview-label">Cancelled</p>
            <p className="overview-value overview-cancelled">{stats.orders.by_status.cancelled}</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-two-column">
        {/* Top Selling Products */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">
            <FaTrophy /> Top Selling Products
          </h3>
          <div className="top-products-list">
            {stats.products.top_selling && stats.products.top_selling.length > 0 ? (
              stats.products.top_selling.map((product, index) => (
                <div key={product.id || index} className="top-product-item">
                  <div className="top-product-rank">#{index + 1}</div>
                  <img 
                    src={product.image || 'https://source.unsplash.com/80x80/?food'} 
                    alt={product.name}
                    className="top-product-image"
                  />
                  <div className="top-product-info">
                    <h4 className="top-product-name">{product.name}</h4>
                    <p className="top-product-category">{product.category} • {product.subcategory}</p>
                    <p className="top-product-stats">
                      <span className="top-product-price">{product.price}</span>
                      <span className="top-product-orders">{product.times_ordered} orders</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No products data available</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">
            <FaClock /> Recent Orders
          </h3>
          <div className="recent-orders-list">
            {stats.recent_orders && stats.recent_orders.length > 0 ? (
              stats.recent_orders.map((order, index) => (
                <div key={order.id || index} className="recent-order-item">
                  <div className="recent-order-header">
                    <span className="recent-order-product">{order.product_name}</span>
                    <span 
                      className="recent-order-status"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="recent-order-details">
                    <span className="recent-order-quantity">Qty: {order.quantity}</span>
                    <span className="recent-order-price">{order.total_price}</span>
                  </div>
                  <div className="recent-order-time">{formatDate(order.created_at)}</div>
                </div>
              ))
            ) : (
              <p className="empty-state">No recent orders</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import '../App.css';
import Header from './header';
import Footer from './footer';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/user/register');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/get_cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCart(data.cart);
      } else {
        setError(data.message || 'Failed to load cart');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this item from cart?')) {
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/user/register');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/remove_from_cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          product_id: productId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh cart after removal
        fetchCart();
        alert('Item removed from cart');
      } else {
        alert(data.message || 'Failed to remove item');
      }
    } catch (err) {
      alert('Network error. Please try again.');
      console.error('Error removing item:', err);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/user/register');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/update_cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          product_id: productId,
          quantity: newQuantity
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update cart with new data
        setCart(data.cart);
      } else {
        alert(data.message || 'Failed to update quantity');
      }
    } catch (err) {
      alert('Network error. Please try again.');
      console.error('Error updating quantity:', err);
    }
  };

  const handleApplyVoucher = () => {
    if (voucherCode.trim()) {
      alert('Voucher functionality coming soon!');
    }
  };

  const handleConfirmOrder = () => {
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please login to place order');
      navigate('/user/register');
      return;
    }

    // Show address modal
    setShowAddressModal(true);
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress || !deliveryAddress.trim()) {
      alert('Please enter a delivery address');
      return;
    }

    try {
      setProcessingOrder(true);
      const userId = localStorage.getItem('userId');
      
      // Get the store_id from the first item (assuming all items are from the same store)
      const storeId = cart.items[0]?.seller_id;
      
      // Prepare multi-product order payload
      const payload = {
        user_id: userId,
        address: deliveryAddress.trim(),
        store_id: storeId,
        total_price: cart.total_price,
        products: cart.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/create_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setShowAddressModal(false);
        setDeliveryAddress('');
        alert(`Order placed successfully! ${cart.items.length} item(s) ordered.`);
        
        // Refresh the cart
        fetchCart();
        
        // Navigate to home
        navigate('/');
      } else {
        alert(data.message || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      alert('Failed to place order. Please try again.');
      console.error('Order error:', err);
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <p>Loading cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-error">
        <p>{error}</p>
        <button onClick={fetchCart} className="retry-btn">Retry</button>
      </div>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return ( 
    <div className="cart-page">
      {/* Address Modal */}
      {showAddressModal && (
        <div className="address-modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h2 className="address-modal-title">Delivery Address</h2>
              <button 
                className="address-modal-close" 
                onClick={() => setShowAddressModal(false)}
              >
                ×
              </button>
            </div>
            <div className="address-modal-body">
              <p className="address-modal-label">
                Please enter your complete delivery address:
              </p>
              <textarea
                className="address-modal-textarea"
                placeholder="Enter your full address (Street, City, Postal Code)"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows="4"
                autoFocus
              />
            </div>
            <div className="address-modal-footer">
              <button 
                className="address-modal-btn address-modal-cancel"
                onClick={() => setShowAddressModal(false)}
                disabled={processingOrder}
              >
                Cancel
              </button>
              <button 
                className="address-modal-btn address-modal-confirm"
                onClick={handlePlaceOrder}
                disabled={processingOrder || !deliveryAddress.trim()}
              >
                {processingOrder ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cart-container">
        {/* Cart Header */}
        <div className="cart-header">
          <FaShoppingCart size={24} />
          <h2 className="cart-title">MY CART</h2>
        </div>

        {isEmpty ? (
          <div className="cart-empty">
            <FaShoppingCart size={64} />
            <h3>Your cart is empty</h3>
            <p>Add some delicious items to get started!</p>
            <button className="cart-shop-btn" onClick={() => navigate('/')}>
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="cart-items">
              {cart.items.map((item, index) => (
                <div key={index} className="cart-item">
                  <img 
                    src={item.product_img || 'https://source.unsplash.com/100x100/?food'} 
                    alt={item.product_name}
                    className="cart-item-image"
                  />
                  <div className="cart-item-details">
                    <h3 className="cart-item-name">{item.product_name}</h3>
                    <p className="cart-item-desc">{item.product_desc}</p>
                    <p className="cart-item-location">
                      {item.hotel_name} • {item.city_name}
                    </p>
                  </div>
                  <div className="cart-item-actions">
                    <div className="cart-item-quantity">
                      <button 
                        className="quantity-btn"
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                    <p className="cart-item-price">Rs. {item.product_prize}</p>
                    <button 
                      className="cart-item-remove"
                      onClick={() => handleRemoveItem(item.product_id)}
                      title="Remove from cart"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Order Summary Sidebar */}
      {!isEmpty && (
        <div className="cart-sidebar">
          {/* Voucher Section */}
          <div className="cart-voucher">
            <h3 className="cart-sidebar-title">Add a Voucher Code</h3>
            <div className="voucher-input-group">
              <input
                type="text"
                placeholder="Enter Voucher Code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="voucher-input"
              />
              <button className="voucher-apply-btn" onClick={handleApplyVoucher}>
                Apply
              </button>
            </div>
          </div>

          {/* Order Details */}
          <div className="cart-order-details">
            <h3 className="cart-sidebar-title">Order Details</h3>
            
            <div className="order-detail-card">
              <FaShoppingCart size={32} color="#0066CC" />
              <div>
                <p className="order-detail-label">PICK UP FROM</p>
                <p className="order-detail-value">
                  {cart.items[0]?.hotel_name || 'Store'}
                </p>
              </div>
            </div>

            <div className="order-detail-card">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <div>
                <p className="order-detail-label">ORDER TIME</p>
                <p className="order-detail-value">Deliver Now</p>
              </div>
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="cart-delivery-instructions">
            <h3 className="cart-sidebar-title">Delivery Instructions</h3>
            <textarea
              placeholder="Instructions for Delivery Expert..."
              className="delivery-textarea"
              rows="3"
            />
          </div>

          {/* Price Summary */}
          <div className="cart-price-summary">
            <div className="price-row">
              <span>Total</span>
              <span>Rs. {cart.total_price || '0'}</span>
            </div>
            <div className="price-row">
              <span>Incl. Tax (16%)</span>
              <span>Rs. {(parseFloat(cart.total_price?.replace(/[^0-9.]/g, '') || 0) * 0.16).toFixed(2)}</span>
            </div>
            <div className="price-row">
              <span>POS Fee</span>
              <span>Rs. 0</span>
            </div>
            <div className="price-row">
              <span>Your Discount</span>
              <span>Rs. 0.0</span>
            </div>
            <div className="price-row price-row-total">
              <span>Grand Total</span>
              <span>Rs. {cart.total_price || '0'}</span>
            </div>
          </div>

          {/* Confirm Order Button */}
          <button 
            className="cart-confirm-btn" 
            onClick={handleConfirmOrder}
            disabled={loading}
          >
            {loading ? 'Processing...' : `${cart.total_items} ITEM | Rs. ${cart.total_price || '0'} - CONFIRM ORDER`}
          </button>
        </div>
      )}
    </div>

  );
};

export default Cart;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const ProductDetailModal = ({ product, onClose }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const productId = product._id || product.id || '';
  const productName = product.name || product.product_name || '';
  const productDesc = product.description || product.product_desc || '';
  const productPrice = product.price || product.product_prize || '0$';
  const productImage = product.image || product.product_img || '';
  const sellerId = product.seller_id || '';

  // Extract numeric price
  const numericPrice = parseFloat(productPrice.replace(/[^0-9.]/g, '')) || 0;
  const totalPrice = (numericPrice * quantity).toFixed(2);

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleOrder = async () => {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      // User not logged in, redirect to registration
      alert('Please login or register to place an order');
      onClose();
      navigate('/user/register');
      return;
    }

    if (!address.trim()) {
      setError('Please enter your delivery address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        user_id: userId,
        product_id: productId,
        product_quantity: quantity,
        total_price: `${totalPrice}$`,
        address: address,
        store_id: sellerId
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
        alert('Order placed successfully!');
        onClose();
      } else {
        setError(data.message || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Order error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-detail-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="product-detail-close" onClick={onClose}>×</button>

        {/* Product Image */}
        <div className="product-detail-image-container">
          <img 
            src={productImage || '/placeholder-pizza.jpg'} 
            alt={productName}
            className="product-detail-image"
          />
        </div>

        {/* Product Info */}
        <div className="product-detail-content">
          <h2 className="product-detail-title">{productName}</h2>
          <p className="product-detail-description">{productDesc}</p>
          <p className="product-detail-price">Rs. {productPrice}</p>

          {/* Quantity Selector */}
          <div className="product-detail-quantity">
            <label>Quantity:</label>
            <div className="quantity-controls">
              <button 
                className="quantity-btn quantity-minus"
                onClick={handleDecrement}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="quantity-value">{quantity}</span>
              <button 
                className="quantity-btn quantity-plus"
                onClick={handleIncrement}
              >
                +
              </button>
            </div>
          </div>

          {/* Address Input */}
          <div className="product-detail-address">
            <label>Delivery Address *</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your complete delivery address"
              rows="3"
              required
            />
          </div>

          {/* Error Message */}
          {error && <div className="product-detail-error">{error}</div>}

          {/* Order Button */}
          <div className="product-detail-footer">
            <button 
              className="product-detail-order-btn"
              onClick={handleOrder}
              disabled={loading}
            >
              {loading ? 'Placing Order...' : `Add to Order - Rs. ${totalPrice}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;

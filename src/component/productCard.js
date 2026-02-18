import { useState } from 'react';
import ProductDetailModal from './productDetailModal';

const ProductCard = ({ product }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please login to add items to cart');
      window.location.href = '/user/register';
      return;
    }

    // If already in cart, just toggle the visual state
    if (isFavorite) {
      setIsFavorite(false);
      setCartMessage('');
      return;
    }

    setAddingToCart(true);
    setCartMessage('');

    try {
      const productId = product._id || product.id || '';
      
      const payload = {
        user_id: userId,
        product_id: productId,
        quantity: 1
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/add_to_cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsFavorite(true);
        setCartMessage('Added to cart!');
        
        // Clear message after 2 seconds
        setTimeout(() => {
          setCartMessage('');
        }, 2000);
      } else {
        alert(data.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Network error. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleCardClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Handle different possible field names from API
  const productId = product._id || product.id || '';
  const productName = product.name || product.product_name || product.title || '';
  const productDesc = product.description || product.product_desc || product.desc || '';
  const productPrice = product.price || product.product_price || product.product_prize || 0;
  const productImage = product.image || product.product_img || product.img || product.product_image || '';
  const isNew = product.isNew || product.is_new || false;

  return (
    <>
      {showModal && (
        <ProductDetailModal 
          product={product} 
          onClose={handleCloseModal}
        />
      )}

      <div className="product-card" onClick={handleCardClick}>
        {/* Hidden input to store product ID */}
        <input 
          type="hidden" 
          value={productId} 
          data-product-id={productId}
        />
        
        {/* Cart Success Message */}
        {cartMessage && (
          <div className="cart-success-message">
            {cartMessage}
          </div>
        )}
        
        {/* Product Image */}
        <div className="product-image-container">
          <img 
            src={productImage || '/placeholder-pizza.jpg'} 
            alt={productName}
            className="product-image"
          />
          {isNew && (
            <span className="product-badge-new">NEW</span>
          )}
        </div>

        {/* Product Details */}
        <div className="product-details">
          <div className="product-header">
            <h3 className="product-name">{productName}</h3>
            <button 
              className={`product-favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleFavoriteClick}
              aria-label="Add to cart"
              disabled={addingToCart}
              title={isFavorite ? 'In cart' : 'Add to cart'}
            >
              {addingToCart ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E31837" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" opacity="0.3"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill={isFavorite ? '#E31837' : 'none'} stroke="#E31837" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              )}
            </button>
          </div>

          <p className="product-description">
            {productDesc}
          </p>

          <div className="product-footer">
            <span className="product-price">
              From <span className="price-amount">Rs. {productPrice}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductCard;

import { useState } from 'react';

const ProductCard = ({ product }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
  };

  // Handle different possible field names from API
  const productName = product.name || product.product_name || product.title || '';
  const productDesc = product.description || product.product_desc || product.desc || '';
  const productPrice = product.price || product.product_price || product.product_prize || 0;
  const productImage = product.image || product.product_img || product.img || product.product_image || '';
  const isNew = product.isNew || product.is_new || false;

  return (
    <div className="product-card">
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
            aria-label="Add to favorites"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill={isFavorite ? '#E31837' : 'none'} stroke="#E31837" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
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
  );
};

export default ProductCard;

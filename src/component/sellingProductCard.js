import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import '../App.css';

const SellingProductCard = ({ product, onEdit, onDelete }) => {
  return (
    <div className="selling-product-card">
      {/* Hidden input to store product ID */}
      <input 
        type="hidden" 
        value={product._id || product.id || ''} 
        data-product-id={product._id || product.id || ''}
      />
      
      <div className="selling-product-image-container">
        <img 
          src={product.product_img || 'https://source.unsplash.com/400x300/?food'} 
          alt={product.product_name}
          className="selling-product-image"
        />
        <div className="selling-product-badges">
          <span className="selling-product-category-badge">{product.category}</span>
        </div>
      </div>

      <div className="selling-product-content">
        <div className="selling-product-header">
          <h3 className="selling-product-name">{product.product_name}</h3>
          <span className="selling-product-price">{product.product_prize}</span>
        </div>

        <p className="selling-product-subcategory">{product.subcategory}</p>
        <p className="selling-product-description">{product.product_desc}</p>

        <div className="selling-product-actions">
          <button 
            className="selling-product-btn selling-product-edit-btn"
            onClick={() => onEdit(product)}
          >
            <FaEdit /> Edit
          </button>
          <button 
            className="selling-product-btn selling-product-delete-btn"
            onClick={() => onDelete(product)}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellingProductCard;

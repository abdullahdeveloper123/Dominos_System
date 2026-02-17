import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const MakeProductForm = ({ onProductCreated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: '',
    productDesc: '',
    productPrize: '',
    category: '',
    subcategory: '',
    productImg: '',
    customCategory: '',
    customSubcategory: ''
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = {
    'Deals': ['GATHERING DEALS', 'EVERYDAY VALUE', 'SPECIAL OFFERS'],
    'Pizza': ['SPECIALTY PIZZA', 'CREATE YOUR OWN', 'CLASSIC PIZZAS'],
    'Sides': ['CHICKEN', 'BREAD', 'PASTA'],
    'Drinks': ['SOFT DRINKS', 'JUICES', 'WATER'],
    'Desserts': ['CAKES', 'ICE CREAM', 'COOKIES']
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle category selection
    if (name === 'category') {
      if (value === 'custom') {
        setShowCustomCategory(true);
        setFormData({
          ...formData,
          category: '',
          subcategory: '',
          customCategory: '',
          customSubcategory: ''
        });
        setShowCustomSubcategory(false);
      } else {
        setShowCustomCategory(false);
        setFormData({
          ...formData,
          category: value,
          subcategory: '',
          customCategory: '',
          customSubcategory: ''
        });
        setShowCustomSubcategory(false);
      }
    } 
    // Handle subcategory selection
    else if (name === 'subcategory') {
      if (value === 'custom') {
        setShowCustomSubcategory(true);
        setFormData({
          ...formData,
          subcategory: '',
          customSubcategory: ''
        });
      } else {
        setShowCustomSubcategory(false);
        setFormData({
          ...formData,
          subcategory: value,
          customSubcategory: ''
        });
      }
    } 
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Determine final category and subcategory values
    const finalCategory = showCustomCategory ? formData.customCategory : formData.category;
    const finalSubcategory = showCustomSubcategory ? formData.customSubcategory : formData.subcategory;

    // Validation
    if (!formData.productName || !formData.productDesc || !formData.productPrize) {
      setError('Product name, description, and price are required');
      return;
    }

    if (!finalCategory) {
      setError('Please select or enter a category');
      return;
    }

    if (!finalSubcategory) {
      setError('Please select or enter a subcategory');
      return;
    }

    setLoading(true);

    try {
      const sellerId = localStorage.getItem('sellerId');

      if (!sellerId) {
        setError('Missing seller information');
        setLoading(false);
        return;
      }

      const payload = {
        seller_id: sellerId,
        category: finalCategory,
        subcategory: finalSubcategory,
        product_name: formData.productName,
        product_img: formData.productImg || 'https://source.unsplash.com/400x300/?food',
        product_desc: formData.productDesc,
        product_prize: formData.productPrize
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/add_product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Product created successfully!');
        
        // If callback provided (when used in admin panel), call it
        if (onProductCreated) {
          onProductCreated();
        } else {
          // Otherwise navigate to admin panel
          navigate('/seller_account/');
        }
        
        // Reset form
        setFormData({
          productName: '',
          productDesc: '',
          productPrize: '',
          category: '',
          subcategory: '',
          productImg: '',
          customCategory: '',
          customSubcategory: ''
        });
        setShowCustomCategory(false);
        setShowCustomSubcategory(false);
      } else {
        setError(data.message || 'Failed to create product. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Product creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="make-product-container">
      <div className="make-product-card">
        <div className="make-product-header">
          <h2 className="make-product-title">Add Your First Product</h2>
          <p className="make-product-subtitle">Start building your menu by adding products</p>
        </div>

        <form onSubmit={handleSubmit} className="make-product-form">
          {error && <div className="make-product-error">{error}</div>}

          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              placeholder="e.g., Family Gathering Box"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="productDesc"
              value={formData.productDesc}
              onChange={handleChange}
              placeholder="Describe your product..."
              rows="4"
              required
            />
          </div>

          <div className="make-product-row">
            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={showCustomCategory ? 'custom' : formData.category}
                onChange={handleChange}
                required={!showCustomCategory}
              >
                <option value="">Select category</option>
                {Object.keys(categories).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="custom">+ Add Custom Category</option>
              </select>
            </div>

            <div className="form-group">
              <label>Subcategory</label>
              <select
                name="subcategory"
                value={showCustomSubcategory ? 'custom' : formData.subcategory}
                onChange={handleChange}
                disabled={!formData.category && !showCustomCategory}
                required={!showCustomSubcategory}
              >
                <option value="">Select subcategory</option>
                {formData.category && categories[formData.category] && 
                  categories[formData.category].map((subcat) => (
                    <option key={subcat} value={subcat}>{subcat}</option>
                  ))
                }
                <option value="custom">+ Add Custom Subcategory</option>
              </select>
            </div>
          </div>

          {/* Custom Category Input */}
          {showCustomCategory && (
            <div className="form-group">
              <label>Custom Category Name</label>
              <input
                type="text"
                name="customCategory"
                value={formData.customCategory}
                onChange={handleChange}
                placeholder="Enter custom category name"
                required
              />
            </div>
          )}

          {/* Custom Subcategory Input */}
          {showCustomSubcategory && (
            <div className="form-group">
              <label>Custom Subcategory Name</label>
              <input
                type="text"
                name="customSubcategory"
                value={formData.customSubcategory}
                onChange={handleChange}
                placeholder="Enter custom subcategory name"
                required
              />
            </div>
          )}

          <div className="make-product-row">
            <div className="form-group">
              <label>Price</label>
              <input
                type="text"
                name="productPrize"
                value={formData.productPrize}
                onChange={handleChange}
                placeholder="e.g., 35$ or $35"
                required
              />
            </div>

            <div className="form-group">
              <label>Product Image URL (Optional)</label>
              <input
                type="url"
                name="productImg"
                value={formData.productImg}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="make-product-submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MakeProductForm;

import React, { useState, useEffect } from 'react';
import '../App.css';

const EditProductForm = ({ product, onCancel, onUpdate }) => {
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

  useEffect(() => {
    if (product) {
      // Check if category/subcategory are custom (not in predefined list)
      const isCategoryCustom = !Object.keys(categories).includes(product.category);
      const isSubcategoryCustom = product.category && categories[product.category] 
        ? !categories[product.category].includes(product.subcategory)
        : true;

      setFormData({
        productName: product.product_name || '',
        productDesc: product.product_desc || '',
        productPrize: product.product_prize || '',
        category: isCategoryCustom ? '' : product.category || '',
        subcategory: isSubcategoryCustom ? '' : product.subcategory || '',
        productImg: product.product_img || '',
        customCategory: isCategoryCustom ? product.category : '',
        customSubcategory: isSubcategoryCustom ? product.subcategory : ''
      });

      setShowCustomCategory(isCategoryCustom);
      setShowCustomSubcategory(isSubcategoryCustom);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
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
    } else if (name === 'subcategory') {
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
    } else {
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

    const finalCategory = showCustomCategory ? formData.customCategory : formData.category;
    const finalSubcategory = showCustomSubcategory ? formData.customSubcategory : formData.subcategory;

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
      const productId = product._id || product.id;
      
      const payload = {
        category: finalCategory,
        subcategory: finalSubcategory,
        product_name: formData.productName,
        product_img: formData.productImg || 'https://source.unsplash.com/400x300/?food',
        product_desc: formData.productDesc,
        product_prize: formData.productPrize
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/product_edit/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Product updated successfully!');
        onUpdate();
      } else {
        setError(data.message || 'Failed to update product. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Product update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-product-overlay">
      <div className="edit-product-modal">
        <div className="edit-product-header">
          <h2 className="edit-product-title">Edit Product</h2>
          <button className="edit-product-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-product-form">
          {error && <div className="edit-product-error">{error}</div>}

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

          <div className="edit-product-row">
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

          <div className="edit-product-row">
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
              <label>Product Image URL</label>
              <input
                type="url"
                name="productImg"
                value={formData.productImg}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="edit-product-actions">
            <button 
              type="button" 
              className="edit-product-cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="edit-product-submit-btn"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductForm;

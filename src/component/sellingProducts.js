import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SellingProductCard from './sellingProductCard';
import EditProductForm from './editProductForm';
import { FaPlus } from 'react-icons/fa';
import '../App.css';

const SellingProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/get_seller_products`, {
        method: 'GET',
        credentials: 'include' // Include cookies for session
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProducts(data.products || []);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleUpdateProduct = () => {
    setEditingProduct(null);
    fetchProducts(); // Refresh the list
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.product_name}"?`)) {
      return;
    }

    try {
      const productId = product._id || product.id;
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/product_delete/${productId}`, {
        method: 'DELETE',
        credentials: 'include' // Include cookies for session
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Product deleted successfully!');
        fetchProducts(); // Refresh the list
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      alert('Network error. Please try again.');
      console.error('Error deleting product:', err);
    }
  };

  const handleAddProduct = () => {
    navigate('/make_product');
  };

  if (loading) {
    return (
      <div className="selling-products-loading">
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="selling-products-error">
        <p>{error}</p>
        <button onClick={fetchProducts} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="selling-products-container">
      {editingProduct && (
        <EditProductForm
          product={editingProduct}
          onCancel={handleCancelEdit}
          onUpdate={handleUpdateProduct}
        />
      )}

      <div className="selling-products-header">
        <h2 className="selling-products-title">My Products</h2>
        <button className="add-product-btn" onClick={handleAddProduct}>
          <FaPlus /> Add New Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="selling-products-empty">
          <p>No products found. Start by adding your first product!</p>
          <button className="add-product-btn" onClick={handleAddProduct}>
            <FaPlus /> Add Product
          </button>
        </div>
      ) : (
        <div className="selling-products-grid">
          {products.map((product, index) => (
            <SellingProductCard
              key={product._id || product.id || index}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SellingProducts;

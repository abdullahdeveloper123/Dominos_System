import { useState, useEffect } from 'react';
import ProductCard from './productCard';

const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [subcategoryOrder, setSubcategoryOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get location from localStorage
        const savedOrder = localStorage.getItem('orderLocation');
        let cityName = 'okara';
        let hotelName = 'Hotel One Okara';

        if (savedOrder) {
          const orderData = JSON.parse(savedOrder);
          cityName = orderData.selectedCity?.toLowerCase() || 'okara';
          hotelName = orderData.selectedStore || 'Hotel One Okara';
        }

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        
        // Fetch categories to get the proper order
        const categoriesResponse = await fetch(`${apiUrl}/get_categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            city_name: cityName,
            hotel_name: hotelName
          })
        });

        let orderedSubcategories = [];
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          if (categoriesData.success && categoriesData.categories && categoriesData.categories.length > 0) {
            const categories = categoriesData.categories[0].categories;
            // Flatten all subcategories in order
            Object.keys(categories).forEach((category) => {
              orderedSubcategories = orderedSubcategories.concat(categories[category]);
            });
          }
        }

        // Fetch products
        const response = await fetch(`${apiUrl}/get_products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            city_name: cityName,
            hotel_name: hotelName
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        console.log('Products API Response:', data);
        console.log('First product:', data.products?.[0]);

        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
          
          // Group products by subcategory
          const grouped = {};
          data.products.forEach((product) => {
            const subcategory = product.subcategory || product.sub_category || 'Other';
            if (!grouped[subcategory]) {
              grouped[subcategory] = [];
            }
            grouped[subcategory].push(product);
          });
          
          setGroupedProducts(grouped);
          setSubcategoryOrder(orderedSubcategories);
        } else {
          setProducts([]);
          setGroupedProducts({});
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="products-grid-container">
        <div className="products-loading">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-grid-container">
        <div className="products-error">Currently no deals available for this location</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="products-grid-container">
        <div className="products-empty">Currently no deals available for this location</div>
      </div>
    );
  }

  return (
    <div className="products-grid-container">
      {subcategoryOrder
        .filter(subcategory => groupedProducts[subcategory]) // Only show subcategories that have products
        .map((subcategory) => {
          // Create a URL-friendly ID from subcategory name
          const sectionId = subcategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          
          return (
            <div key={subcategory} id={sectionId} className="product-category-section">
              <h2 className="category-heading">{subcategory}</h2>
              <div className="products-grid">
                {groupedProducts[subcategory].map((product, index) => (
                  <ProductCard key={index} product={product} />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default ProductGrid;

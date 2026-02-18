import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import StorePannelSidebar from '../component/storePannelSidebar';
import MakeProductForm from '../component/makeProductForm';
import SellingProducts from '../component/sellingProducts';
import OrdersList from '../component/ordersList';
import OrderHistory from '../component/orderHistory';
import EditSellerProfile from '../component/editSellerProfile';
import UploadBanners from '../component/uploadBanners';
import SellerDashboard from '../component/sellerDashboard';
import { FaBars, FaTimes } from 'react-icons/fa';
import '../App.css';

const SellerAdminPannel = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasProducts, setHasProducts] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkProducts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/check_seller_products`, {
        method: 'GET',
        credentials: 'include' // Include cookies for session
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setHasProducts(data.hasProducts);
      } else {
        setHasProducts(false);
      }
    } catch (err) {
      console.error('Error checking products:', err);
      setHasProducts(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProducts();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleProductCreated = () => {
    // Refresh the products check after creating a product
    checkProducts();
  };

  const renderContent = () => {
    // Check if we're on the products route
    if (location.pathname.includes('/products')) {
      return <SellingProducts />;
    }

    // Check if we're on the orders route
    if (location.pathname.includes('/orders')) {
      return <OrdersList />;
    }

    // Check if we're on the order history route
    if (location.pathname.includes('/order-history')) {
      return <OrderHistory />;
    }

    // Check if we're on the edit profile route
    if (location.pathname.includes('/edit-profile')) {
      return <EditSellerProfile />;
    }

    // Check if we're on the banners route
    if (location.pathname.includes('/banners')) {
      return <UploadBanners />;
    }

    // Default content - show product form if no products, otherwise show dashboard
    if (!hasProducts) {
      return <MakeProductForm onProductCreated={handleProductCreated} />;
    }

    // Show dashboard on home page
    return <SellerDashboard />;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <header className="admin-panel-header">
        <button className="admin-toggle-btn" onClick={toggleSidebar}>
          {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
        <h1 className="admin-panel-title">Domino's Seller Panel</h1>
      </header>

      <div className="admin-panel-layout">
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <StorePannelSidebar />
        </aside>

        <main className="admin-main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SellerAdminPannel;

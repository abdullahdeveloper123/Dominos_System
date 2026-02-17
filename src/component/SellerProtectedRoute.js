import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const SellerProtectedRoute = ({ children, requiresHotel = true }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [hasHotel, setHasHotel] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSellerStatus = async () => {
      // Check if seller_id exists in localStorage
      const sellerId = localStorage.getItem('sellerId');

      if (!sellerId) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Check if seller has a hotel
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/check_seller_hotel`, {
          method: 'GET',
          credentials: 'include' // Include cookies for session
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setHasHotel(data.hasHotel);
        } else {
          setHasHotel(false);
        }
      } catch (err) {
        console.error('Error checking hotel status:', err);
        setHasHotel(false);
      } finally {
        setLoading(false);
      }
    };

    checkSellerStatus();
  }, [location.pathname]);

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

  // If not authenticated, redirect to register
  if (!isAuthenticated) {
    return <Navigate to="/seller_account/login" replace />;
  }

  // If on make-shop page, allow access (doesn't require hotel)
  if (location.pathname === '/make_shop') {
    // If already has hotel, redirect to admin panel
    if (hasHotel) {
      return <Navigate to="/seller_account/" replace />;
    }
    return children;
  }

  // For all other protected routes (including /seller_account/*), check hotel status
  if (requiresHotel && !hasHotel) {
    return <Navigate to="/make_shop" replace />;
  }

  return children;
};

export default SellerProtectedRoute;

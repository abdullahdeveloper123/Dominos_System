import React, { useState, useEffect } from 'react';

const Banner = () => {
  const [banners, setBanners] = useState({
    home_banner_1: null,
    home_banner_2: null,
    home_banner_3: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        console.log('Fetching banners from:', `${apiUrl}/home_banner`);
        
        const response = await fetch(`${apiUrl}/home_banner`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Banner API Response:', data);
        
        // Load images dynamically based on banner names from API
        const loadedBanners = {};
        
        if (data.home_banner_1) {
          try {
            loadedBanners.home_banner_1 = require(`../assets/img/${data.home_banner_1}`);
          } catch (e) {
            console.error('Error loading banner 1:', e);
          }
        }
        if (data.home_banner_2) {
          try {
            loadedBanners.home_banner_2 = require(`../assets/img/${data.home_banner_2}`);
          } catch (e) {
            try {
              loadedBanners.home_banner_2 = require(`../assets/img/${data.home_banner_2}`);
            } catch (e2) {
              console.error('Error loading banner 2:', e2);
            }
          }
        }
        if (data.home_banner_3) {
          try {
            loadedBanners.home_banner_3 = require(`../assets/img/${data.home_banner_3}`);
          } catch (e) {
            console.error('Error loading banner 3:', e);
          }
        }
        
        setBanners(loadedBanners);
        console.log('Banners loaded successfully:', loadedBanners);
      } catch (err) {
        console.error('Error fetching banners:', err);
        setError(err.message);
        
        // Fallback to default banners
        try {
          setBanners({
            home_banner_1: require('../assets/img/banner_1.jpg'),
            home_banner_2: require('../assets/img/d60d0a80-fce3-11f0-8927-05d95edf2bde-epicdoubledeals_desktop_image-2026-01-29072632.jpeg'),
            home_banner_3: require('../assets/img/18276b10-e63f-11f0-a99a-bfab5b90c014-Alfredo-Range-KV-talent-SIDE-BANNER_desktop_image-2025-12-31115151.jpg')
          });
        } catch (fallbackErr) {
          console.error('Error loading fallback banners:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="banner-container">
        <div className="banner-loading">Loading banners...</div>
      </div>
    );
  }

  return (
    <div className="banner-container">
      <div className="banner-grid">
        {/* Large Banner - Left Side (home_banner_1) */}
        {banners.home_banner_1 && (
          <div className="banner-large">
            <img src={banners.home_banner_1} alt="Featured Offer" className="banner-image" />
          </div>
        )}

        {/* Small Banners - Right Side (home_banner_2 and home_banner_3) */}
        <div className="banner-small-group">
          {banners.home_banner_2 && (
            <div className="banner-small">
              <img src={banners.home_banner_2} alt="Special Deal" className="banner-image" />
            </div>
          )}
          {banners.home_banner_3 && (
            <div className="banner-small">
              <img src={banners.home_banner_3} alt="New Offer" className="banner-image" />
            </div>
          )}
        </div>
      </div>
      {error && <p className="banner-error">Using default banners</p>}
    </div>
  );
};

export default Banner;

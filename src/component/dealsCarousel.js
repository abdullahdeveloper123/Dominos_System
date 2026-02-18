import { useState, useEffect } from 'react';
import carousel1 from '../assets/img/carousel_1.jpg';
import carousel2 from '../assets/img/carousel_2.jpeg';
import carousel3 from '../assets/img/carousel_3.jpg';

const DealsCarousel = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default carousel images
  const defaultImages = [carousel1, carousel2, carousel3];

  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get location data from orderLocation in localStorage
        const orderLocationStr = localStorage.getItem('orderLocation');
        
        console.log('OrderLocation from localStorage:', orderLocationStr);

        let cityName = null;
        let hotelName = null;

        if (orderLocationStr) {
          try {
            const orderLocation = JSON.parse(orderLocationStr);
            cityName = orderLocation.selectedCity;
            hotelName = orderLocation.selectedStore;
            console.log('Parsed location:', { cityName, hotelName });
          } catch (parseErr) {
            console.error('Error parsing orderLocation:', parseErr);
          }
        }

        // If no location data, use default images
        if (!cityName || !hotelName) {
          console.log('No location data found in orderLocation, using default images');
          setImages(defaultImages);
          setLoading(false);
          return;
        }

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const payload = {
          city_name: cityName,
          hotel_name: hotelName
        };

        console.log('Making POST request to:', `${apiUrl}/get_banners_by_location`);
        console.log('Payload:', payload);

        const response = await fetch(`${apiUrl}/get_banners_by_location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error('Failed to fetch banners');
        }

        const data = await response.json();
        console.log('Banners API Response:', data);

        if (data.success && data.images_quantity > 0 && data.images_name.length > 0) {
          // Build image URLs from uploaded banners in src/assets/uploads/
          const imageUrls = data.images_name.map(filename => {
            try {
              // Try to require the image from assets/uploads folder
              return require(`../assets/uploads/${filename}`);
            } catch (err) {
              console.error(`Failed to load uploaded image: ${filename}`, err);
              return null;
            }
          }).filter(url => url !== null);
          
          if (imageUrls.length > 0) {
            console.log('Loaded custom banners:', imageUrls);
            setImages(imageUrls);
          } else {
            console.log('Failed to load custom banners, using default images');
            setImages(defaultImages);
          }
        } else {
          // No custom banners found, use default images
          console.log('No custom banners found, using default images');
          setImages(defaultImages);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching carousel images:', err);
        setError(err.message);
        // On error, use default images
        setImages(defaultImages);
        setLoading(false);
      }
    };

    fetchCarouselImages();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  if (loading) {
    return (
      <div className="carousel-container">
        <div className="carousel-loading">Loading...</div>
      </div>
    );
  }

  if (error || images.length === 0) {
    return null; // Don't show carousel if there's an error or no images
  }

  return (
    <div className="carousel-container">
      <div className="carousel-wrapper">
        {/* Carousel Images */}
        <div className="carousel-slides">
          {images.map((image, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="carousel-image"
              />
            </div>
          ))}
        </div>

        {/* Previous Button */}
        {images.length > 1 && (
          <button
            className="carousel-button carousel-button-prev"
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <button
            className="carousel-button carousel-button-next"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="carousel-dots">
            {images.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsCarousel;

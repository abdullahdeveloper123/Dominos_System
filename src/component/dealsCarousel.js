import { useState, useEffect } from 'react';

const DealsCarousel = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/deals_carousel`);

        if (!response.ok) {
          throw new Error('Failed to fetch carousel images');
        }

        const data = await response.json();
        console.log('Carousel API Response:', data);

        if (Array.isArray(data) && data.length > 0) {
          // Import images from local assets folder
          const imageUrls = data.map(filename => {
            try {
              // Try to require the image
              return require(`../assets/img/${filename}`);
            } catch (err) {
              // If exact filename fails, try common variations
              const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
              const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
              
              for (const ext of extensions) {
                try {
                  return require(`../assets/img/${nameWithoutExt}${ext}`);
                } catch (e) {
                  // Continue to next extension
                }
              }
              
              console.error(`Failed to load image: ${filename}`);
              return null;
            }
          }).filter(url => url !== null);
          
          console.log('Loaded images:', imageUrls.length, 'out of', data.length);
          setImages(imageUrls);
        } else {
          setImages([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching carousel images:', err);
        setError(err.message);
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

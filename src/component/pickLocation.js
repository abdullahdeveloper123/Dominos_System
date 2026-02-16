import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PickLocation = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState('pickup'); // 'delivery' or 'pickup'
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [pickupTime, setPickupTime] = useState('now');
  const [cities, setCities] = useState([]);
  const [citiesData, setCitiesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get hotels for selected city
  const getHotelsForCity = () => {
    if (!selectedCity) return [];
    const cityData = citiesData.find(
      city => city.city_name.charAt(0).toUpperCase() + city.city_name.slice(1) === selectedCity
    );
    return cityData ? cityData.hotels : [];
  };

  // Fetch cities from API
  useEffect(() => {
    const fetchCities = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        console.log('Fetching from:', `${apiUrl}/get_locations`);
        
        const response = await fetch(`${apiUrl}/get_locations`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.success && Array.isArray(data.locations) && data.locations.length > 0) {
          setCitiesData(data.locations);
          localStorage.setItem('locationsData', JSON.stringify(data.locations));
          
          const formattedCities = data.locations.map(city => {
            const cityName = typeof city === 'string' ? city : city.city_name;
            return cityName.charAt(0).toUpperCase() + cityName.slice(1);
          });
          setCities(formattedCities);
          console.log('Cities loaded successfully:', formattedCities);
        } else {
          throw new Error('Invalid response format or empty cities array');
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
        setError(err.message);
        
        const cachedLocations = localStorage.getItem('locationsData');
        if (cachedLocations) {
          const locations = JSON.parse(cachedLocations);
          setCitiesData(locations);
          const formattedCities = locations.map(city => 
            city.city_name.charAt(0).toUpperCase() + city.city_name.slice(1)
          );
          setCities(formattedCities);
          console.log('Loaded cities from localStorage cache');
        } else {
          setCities(['Okara', 'Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan']);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
    
    const savedOrder = localStorage.getItem('orderLocation');
    if (savedOrder) {
      const orderData = JSON.parse(savedOrder);
      console.log('Previously saved order location:', orderData);
    }
  }, []);

  const handleCloseModal = () => {
    setSelectedCity('');
    setSelectedStore('');
    onClose();
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
    setSelectedStore('');
  };

  const handleStartOrder = () => {
    const orderData = {
      orderType,
      selectedCity,
      selectedStore,
      pickupTime,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('orderLocation', JSON.stringify(orderData));
    console.log('Order data saved to localStorage:', orderData);
    
    handleCloseModal();
    
    // Redirect to deals page
    navigate('/deals');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Select Location</h2>
          <button className="modal-close" onClick={handleCloseModal}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Delivery/Pickup Toggle */}
       

          {/* City Dropdown */}
          <div className="form-group">
            <select 
              className="form-select"
              value={selectedCity}
              onChange={handleCityChange}
              disabled={loading}
            >
              <option value="">
                {loading ? 'Loading cities...' : 'Select your City'}
              </option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {error && <p className="error-message">Failed to load cities. Using default list.</p>}
          </div>

          {/* Store Dropdown */}
          <div className="form-group">
            <select 
              className="form-select"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              disabled={!selectedCity}
            >
              <option value="">Select your {orderType === 'delivery' ? 'delivery' : 'pickup'} store</option>
              {getHotelsForCity().map((hotel) => (
                <option key={hotel.hotel_id} value={hotel.hotel_name}>
                  {hotel.hotel_name}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup Time Section */}
          <div className="pickup-time-section">
            <h3 className="section-title">When do you want your order?</h3>
            
            <label className="radio-option">
              <input 
                type="radio" 
                name="pickupTime" 
                value="now"
                checked={pickupTime === 'now'}
                onChange={(e) => setPickupTime(e.target.value)}
              />
              <span className="radio-label">{orderType === 'delivery' ? 'Deliver' : 'Pickup'} Now</span>
            </label>

            <label className="radio-option">
              <input 
                type="radio" 
                name="pickupTime" 
                value="later"
                checked={pickupTime === 'later'}
                onChange={(e) => setPickupTime(e.target.value)}
              />
              <span className="radio-label">{orderType === 'delivery' ? 'Deliver' : 'Pickup'} Later</span>
            </label>
          </div>

          {/* Start Order Button */}
          <button 
            className="start-order-btn"
            onClick={handleStartOrder}
            disabled={!selectedCity || !selectedStore}
          >
            START ORDER
          </button>

          {/* Login Link */}
          <div className="login-section">
            <span className="login-text">Already a user? </span>
            <a href="#login" className="login-link">Login</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickLocation;

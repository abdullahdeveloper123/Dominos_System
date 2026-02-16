import { useState, useEffect } from 'react';

const SecondNavbar = () => {
  const [activeTab, setActiveTab] = useState('Deals');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
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
        const response = await fetch(`${apiUrl}/get_categories`, {
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
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        
        if (data.success && data.categories && data.categories.length > 0 && data.categories[0].categories) {
          const categoriesData = data.categories[0].categories;
          
          // Check if categories object is empty or has no items
          if (Object.keys(categoriesData).length === 0) {
            setCategories({});
          } else {
            setCategories(categoriesData);
            // Set first category as active tab
            const firstCategory = Object.keys(categoriesData)[0];
            setActiveTab(firstCategory);
          }
        } else {
          setCategories({});
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      // Get all product sections
      const sections = document.querySelectorAll('.product-category-section');
      if (sections.length === 0) return;

      const scrollPosition = window.scrollY + 250; // Offset for fixed navbar
      
      let currentSection = null;
      
      // Find the section that the scroll position is currently in
      // We iterate through sections in order and find the last one that starts before our scroll position
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        
        if (scrollPosition >= sectionTop) {
          currentSection = section.id;
        }
      });

      // If no section found or we're at the very top, use the first section
      if (!currentSection || window.scrollY < 200) {
        currentSection = sections[0].id;
      }

      if (currentSection) {
        // Find which category and subcategory this section belongs to
        let foundCategory = null;
        let foundSubcategory = null;
        
        Object.keys(categories).forEach((category) => {
          const subcategories = categories[category];
          subcategories.forEach((subcategory) => {
            const sectionId = subcategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            if (sectionId === currentSection) {
              foundCategory = category;
              foundSubcategory = subcategory;
            }
          });
        });

        if (foundCategory && foundSubcategory) {
          setActiveTab(foundCategory);
          setActiveSubcategory(foundSubcategory);
        }
      }
    };

    // Debounce scroll events for better performance and stability
    let timeoutId;
    const debouncedScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        handleScroll();
      }, 50);
    };

    window.addEventListener('scroll', debouncedScroll, { passive: true });
    handleScroll(); // Call once on mount
    
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [categories]);

  const handleNavClick = (itemName) => {
    setActiveTab(itemName);
    
    // Scroll to first subcategory of this category
    if (categories[itemName] && categories[itemName].length > 0) {
      const firstSubcategory = categories[itemName][0];
      const sectionId = firstSubcategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Small delay to allow state update
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        
        if (element) {
          const offset = 200; // Increased offset for header + navbar
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const handleSubcategoryClick = (e, subcategory) => {
    e.preventDefault();
    setActiveSubcategory(subcategory);
    
    // Create the same ID format as in ProductGrid
    const sectionId = subcategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const element = document.getElementById(sectionId);
    
    if (element) {
      // Scroll to the section with smooth behavior
      const offset = 200; // Increased offset for header + navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="second-navbar-container">
        <div className="loading">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="second-navbar-container">
        <div className="no-categories-message">Currently no deals available for this location</div>
      </div>
    );
  }

  // Get primary navigation items from categories
  const navItems = Object.keys(categories);

  // Check if no categories available
  if (navItems.length === 0) {
    return (
      <div className="second-navbar-container">
        <div className="no-categories-message">Currently no deals available for this location</div>
      </div>
    );
  }

  return (
    <div className="second-navbar-container">
      {/* Primary Navigation */}
      <nav className="second-navbar-primary">
        <ul className="second-navbar-list">
          {navItems.map((categoryName, index) => (
            <li key={index} className="second-navbar-item">
              <a
                href={`/${categoryName.toLowerCase().replace(/\s+/g, '-')}`}
                className={`second-navbar-link ${activeTab === categoryName ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(categoryName);
                }}
              >
                {categoryName}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Secondary Navigation (visible when a category is active and has subcategories) */}
      {activeTab && categories[activeTab] && categories[activeTab].length > 0 && (
        <nav className="second-navbar-secondary">
          <ul className="second-navbar-deals-list">
            {categories[activeTab].map((subcategory, index) => (
              <li key={index} className="second-navbar-deals-item">
                <a
                  href={`#${subcategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  className={`second-navbar-deals-link ${
                    activeSubcategory === subcategory ? 'active' : ''
                  } ${index === 0 && !activeSubcategory ? 'featured' : ''}`}
                  onClick={(e) => handleSubcategoryClick(e, subcategory)}
                >
                  {subcategory}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
};

export default SecondNavbar;

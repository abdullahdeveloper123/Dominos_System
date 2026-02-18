import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchCartCount();
  }, []);

  const fetchCartCount = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setCartCount(0);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/get_cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();

      if (response.ok && data.success && data.cart) {
        setCartCount(data.cart.total_items || 0);
      } else {
        setCartCount(0);
      }
    } catch (err) {
      console.error('Error fetching cart count:', err);
      setCartCount(0);
    }
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <header className="navbar-container">
      {/* Top Navigation Bar */}
      <div className="navbar-top">
        <div className="navbar-logo">
          <Link className="logo-text" to="/">Domino's</Link>
        </div>
        
        <nav className="navbar-menu">
          <a href="#menu" className="nav-link">MENU</a>
          <a href="#stores" className="nav-link">STORES</a>
          <a href="#app" className="nav-link">GET THE APP</a>
        </nav>
        
        <div className="navbar-actions">
          <div className="cart-icon" onClick={handleCartClick} style={{ cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 2L7 6H3L6 20H18L21 6H17L15 2H9Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>
          <button className="account-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="8" r="4" strokeWidth="2"/>
              <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            MY ACCOUNT
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

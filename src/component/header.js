import { Link } from "react-router-dom";

const Header = () => {
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
          <div className="cart-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 2L7 6H3L6 20H18L21 6H17L15 2H9Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="cart-badge">0</span>
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

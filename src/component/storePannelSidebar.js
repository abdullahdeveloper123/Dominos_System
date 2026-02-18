import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../App.css';

const StorePannelSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Home', path: '/seller_account/' },
    { name: 'Products', path: '/seller_account/products' },
    { name: 'Orders', path: '/seller_account/orders' },
    { name: 'Order History', path: '/seller_account/order-history' },
    { name: 'Banners', path: '#' },
    { name: 'Edit profile', path: '/seller_account/edit-profile' },
  ];

  return (
    <div className="store-sidebar">
      <nav className="store-sidebar-nav">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`store-sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default StorePannelSidebar;

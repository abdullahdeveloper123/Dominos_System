import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import Deals from './views/deals';
import SellerRegister from './views/sellerRegister';
import SellerAdminPannel from './views/sellerAdminPannel';
import MakeShop from './component/makeShop';
import MakeProductForm from './component/makeProductForm';
import SellerProtectedRoute from './component/SellerProtectedRoute';

function AppContent() {

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/seller-register" element={<SellerRegister />} />
        <Route path="/seller_account/register" element={<SellerRegister />} />
        
        {/* Protected seller routes */}
        <Route 
          path="/make_shop" 
          element={
            <SellerProtectedRoute requiresHotel={false}>
              <MakeShop />
            </SellerProtectedRoute>
          } 
        />
        <Route 
          path="/make_product" 
          element={
            <SellerProtectedRoute requiresHotel={true}>
              <MakeProductForm />
            </SellerProtectedRoute>
          } 
        />
        <Route 
          path="/seller-admin-panel" 
          element={
            <SellerProtectedRoute requiresHotel={true}>
              <SellerAdminPannel />
            </SellerProtectedRoute>
          } 
        />
        <Route 
          path="/seller_account/*" 
          element={
            <SellerProtectedRoute requiresHotel={true}>
              <SellerAdminPannel />
            </SellerProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

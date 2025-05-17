
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="flex justify-around items-center h-16">
        <button 
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            location.pathname === '/' ? 'text-quickservice-purple' : 'text-gray-500'
          }`}
          onClick={() => navigate('/')}
        >
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            location.pathname === '/products' ? 'text-quickservice-purple' : 'text-gray-500'
          }`}
          onClick={() => navigate('/products')}
        >
          <Package size={20} />
          <span className="text-xs mt-1">Products</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            location.pathname === '/login' ? 'text-quickservice-purple' : 'text-gray-500'
          }`}
          onClick={() => navigate(user ? '/' : '/login')}
        >
          <User size={20} />
          <span className="text-xs mt-1">{user ? 'Profile' : 'Login'}</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;

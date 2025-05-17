
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Package } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import SearchBar from './SearchBar';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header: React.FC = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-quickservice-purple font-bold text-xl">QuickService</span>
            </Link>
          </div>
          
          <div className="flex-1 mx-4">
            <SearchBar />
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="text-gray-600 hover:text-quickservice-purple"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/products" className="flex items-center text-gray-600 hover:text-quickservice-purple">
              <Package size={18} className="mr-1" />
              <span>Products</span>
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-quickservice-purple text-white">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => navigate('/login')}
                variant="ghost" 
                className="text-quickservice-purple"
              >
                <User size={18} className="mr-1" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white py-2 px-4 shadow-lg">
          <div className="flex flex-col space-y-3">
            <Link 
              to="/products" 
              className="flex items-center py-2 text-gray-600 hover:text-quickservice-purple"
              onClick={closeMenu}
            >
              <Package size={18} className="mr-2" />
              Products
            </Link>
            
            {user ? (
              <button 
                onClick={() => {
                  handleLogout();
                  closeMenu();
                }}
                className="flex items-center py-2 text-gray-600 hover:text-quickservice-purple"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </button>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center py-2 text-gray-600 hover:text-quickservice-purple"
                onClick={closeMenu}
              >
                <User size={18} className="mr-2" />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

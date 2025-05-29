import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="navbar bg-gradient-to-r from-[#7658ef] to-[#6546ec] text-white sticky top-0 z-50 w-full slide-in">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo and Website Name - Left aligned */}
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={handleLogoClick}
        >
          <img
            src="/logo.png"
            alt="Quantrak Logo"
            className="h-10 w-10 rounded-md object-contain"
          />
          <span className="font-bold text-2xl">Quantrak</span>
        </div>

        {/* Logout Button - Right aligned (only shows when logged in) */}
        {user && (
          <button
            onClick={logout}
            className="logout-btn group relative flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ease-in-out hover-effect-active"
            title="Logout"
          >
            <span className="text-sm font-medium hidden sm:inline-block">Logout</span>
            <FiLogOut className="text-lg sm:text-base transition-transform duration-200 group-hover:scale-110" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
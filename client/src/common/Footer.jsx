import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-r from-[#7658ef] to-[#6546ec] text-white">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo and Name */}
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img 
              src="/logo.png" 
              alt="Quantrak Logo" 
              className="h-8 w-8 rounded-md object-contain"
            />
            <span className="font-bold text-2xl">Quantrak</span>
          </div>

          {/* Copyright */}
          <div className="text-md text-center md:text-right">
            <p>© {new Date().getFullYear()} Quantrak. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
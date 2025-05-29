import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaChartBar } from 'react-icons/fa';

const Admin = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Admin Access
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Manage your Quantrak administration
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add User Card */}
          <Link 
            to="/adminadduser" 
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#5D3FD3] flex flex-col items-center text-center"
          >
            <div className="bg-[#5D3FD3] p-4 rounded-full text-white mb-4 group-hover:bg-[#7D5FFF] transition-colors">
              <FaUserPlus className="text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Users</h3>
            <p className="text-gray-600">Create and manage new user accounts</p>
          </Link>

          {/* User Analytics Card */}
          <Link 
            to="/adminuseranalytics" 
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#5D3FD3] flex flex-col items-center text-center"
          >
            <div className="bg-[#5D3FD3] p-4 rounded-full text-white mb-4 group-hover:bg-[#7D5FFF] transition-colors">
              <FaChartBar className="text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">User Analytics</h3>
            <p className="text-gray-600">View detailed user statistics and reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Admin;
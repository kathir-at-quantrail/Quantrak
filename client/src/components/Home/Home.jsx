import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAttendance from './UserAttendance';
import API from '../../utils/api';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        const { data } = await API.get('/users/me');
        if (!data) {
          throw new Error('No user data received');
        }
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.response?.data?.error || 'Failed to fetch user data');
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate, logout]);

  const handleRoleClick = () => {
    if (userData?.role === 'Admin') {
      navigate('/admin');
    }
  };

  const handleChangePassword = () => {
    navigate('/forgotpass');
  };

  if (!user) {
    return null; // Redirecting in useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D3FD3]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 fade-in home-container">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start items-center gap-2">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:!text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Welcome, {userData?.name || 'User'}!
                </h1>
                <p className="text-base sm:text-lg text-gray-600">
                  Here are your account details
                </p>
              </div>
              <div
                onClick={handleRoleClick}
                className={`px-4 py-2 rounded-lg text-sm sm:text-base ${
                  userData?.role === 'Admin'
                    ? 'bg-[#5D3FD3] text-white cursor-pointer hover:bg-[#4923f4] transition-colors'
                    : 'bg-gray-200 text-gray-800 cursor-default'
                }`}
              >
                {userData?.role}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard label="Email Address" value={userData?.email} icon="📧" />
              <InfoCard label="Phone Number" value={userData?.phone} icon="📱" />
              <InfoCard label="Job Position" value={userData?.position} icon="💼" />
              <InfoCard
                label="Start Date"
                value={
                  userData?.start_date
                    ? new Date(userData.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Not specified'
                }
                icon="📅"
              />
              <div className="md:col-span-2 flex justify-center">
                <PasswordInfoCard 
                  onButtonClick={handleChangePassword}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <UserAttendance name={userData?.name} />
      </div>
    </div>
  );
};

const InfoCard = ({ label, value, icon }) => (
  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow h-full">
    <div className="flex items-center h-full">
      <span className="text-2xl mr-3">{icon}</span>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-800">
          {value || 'Not provided'}
        </p>
      </div>
    </div>
  </div>
);

const PasswordInfoCard = ({ onButtonClick }) => (
  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow w-full max-w-md">
    <div className="flex flex-col items-center">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">🔒</span>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">Password</p>
          <p className="text-lg font-semibold text-gray-800">********</p>
        </div>
      </div>
      <button
        onClick={onButtonClick}
        className="mt-2 py-2 px-6 bg-[#5D3FD3] hover:bg-[#4923f4] text-white rounded-md transition-colors text-sm font-medium"
      >
        Change Password
      </button>
    </div>
  </div>
);

export default Home;
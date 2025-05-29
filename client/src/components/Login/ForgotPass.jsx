import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import API from '../../utils/api';

const ForgotPass = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = () => {
    const { newPassword } = formData;
    const hasMinLength = newPassword.length >= 6;
    const hasNumber = /\d/.test(newPassword);
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    
    return {
      isValid: hasMinLength && hasNumber && hasLetter,
      hasMinLength,
      hasNumber,
      hasLetter
    };
  };

  const validateForm = () => {
    const passwordValidation = validatePassword();
    
    if (!passwordValidation.isValid) {
      setError('Password must be at least 6 characters with at least 1 letter and 1 number');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await API.post('/users/reset-password', formData);
      setSuccess('Password has been reset successfully!');
      setShowAlert(true);
      
      // Show alert and then navigate after user acknowledges
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission on Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Effect to handle navigation after alert
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        const isLoggedIn = localStorage.getItem('token');
        navigate(isLoggedIn ? '/home' : '/');
      }, 2000); // Navigate after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [showAlert, navigate]);

  const passwordValidation = validatePassword();
  const passwordsMatch = formData.newPassword && formData.confirmPassword && 
                         formData.newPassword === formData.confirmPassword;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and new password
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {showAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
              <h3 className="text-lg font-bold mb-2">Success!</h3>
              <p>Your password has been reset successfully.</p>
              <p>You will be redirected shortly.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5D3FD3] focus:border-[#5D3FD3]"
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5D3FD3] focus:border-[#5D3FD3]"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash className="h-5 w-5 text-gray-500" /> : <FaEye className="h-5 w-5 text-gray-500" />}
              </button>
            </div>
            
            <div className="mt-2 text-xs text-gray-600">
              <p className={`flex items-center ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-red-600'}`}>
                {passwordValidation.hasMinLength ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                At least 6 characters
              </p>
              <p className={`flex items-center ${passwordValidation.hasLetter ? 'text-green-600' : 'text-red-600'}`}>
                {passwordValidation.hasLetter ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                At least 1 letter
              </p>
              <p className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                {passwordValidation.hasNumber ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                At least 1 number
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5D3FD3] focus:border-[#5D3FD3]"
              required
            />
            {formData.confirmPassword && (
              <p className={`mt-1 text-xs flex items-center ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                {passwordsMatch ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                Passwords {passwordsMatch ? 'match' : 'do not match'}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5D3FD3] hover:bg-[#7D5FFF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5D3FD3] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPass;
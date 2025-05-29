import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaArrowLeft } from 'react-icons/fa';
import API from '../../../utils/api';

const AdminAddUser = ({ editingUser, setEditingUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Employee',
    position: '',
    start_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        password: '', // Don't pre-fill password for security
        role: editingUser.role,
        position: editingUser.position,
        start_date: editingUser.start_date.split('T')[0]
      });
    }
  }, [editingUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.position) {
      setError('All fields are required');
      return false;
    }

    if (formData.phone.length !== 10 || isNaN(formData.phone)) {
      setError('Phone number must be 10 digits');
      return false;
    }

    // Only validate password if we're adding a new user
    if (!editingUser && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Check if start date changed
        if (formData.start_date !== editingUser.start_date.split('T')[0]) {
          // First update the user
          await API.put(`/users/${editingUser.id}`, formData);

          // Then reset attendance history
          await API.post('/attendance/reset-attendance', {
            userId: editingUser.id,
            newStartDate: formData.start_date
          });

          alert('User updated and attendance history reset successfully');
        } else {
          // Regular update
          await API.put(`/users/${editingUser.id}`, formData);
          alert('User updated successfully');
        }
      } else {
        // Add new user
        await API.post('/users/add', formData);
        alert('User added successfully');
      }
      navigate('/admin');
    } catch (error) {
      setError(error.response?.data?.error || (editingUser ? 'Failed to update user' : 'Failed to add user'));
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (editingUser) {
      setEditingUser(null);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 fade-in admin-form-wrapper">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md admin-form-container">
        <div className="flex items-center mb-4">
          <button
            onClick={handleCancel}
            className="mr-2 p-2 rounded-full hover:bg-gray-100"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <div className="text-center flex-grow">
            <div className="mx-auto bg-[#5D3FD3] p-3 rounded-full text-white w-16 h-16 flex items-center justify-center mb-4 admin-icon">
              <FaUserPlus className="text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 admin-form">
          <div className="admin-form-group">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5D3FD3] focus:border-[#5D3FD3] admin-form-input"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5D3FD3] focus:border-[#5D3FD3] admin-form-input"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number (10 digits)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength="10"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5D3FD3] focus:border-[#5D3FD3] admin-form-input"
              required
            />
          </div>

          {/* Only show password field when adding new user */}
          {!editingUser && (
            <div className="admin-form-group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password (min 6 characters)
              </label>
              <input
                type="text"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5D3FD3] focus:border-[#5D3FD3] admin-form-input"
                required
              />
            </div>
          )}

          <div className="admin-form-group">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <div className="mt-1 space-y-2 admin-form-radio-group">
              <div className="flex items-center admin-form-radio">
                <input
                  type="radio"
                  id="role-admin"
                  name="role"
                  value="Admin"
                  checked={formData.role === 'Admin'}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#5D3FD3] focus:ring-[#5D3FD3] border-gray-300"
                />
                <label htmlFor="role-admin" className="ml-2 block text-sm text-gray-900">
                  Admin
                </label>
              </div>
              <div className="flex items-center admin-form-radio">
                <input
                  type="radio"
                  id="role-employee"
                  name="role"
                  value="Employee"
                  checked={formData.role === 'Employee'}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#5D3FD3] focus:ring-[#5D3FD3] border-gray-300"
                />
                <label htmlFor="role-employee" className="ml-2 block text-sm text-gray-900">
                  Employee
                </label>
              </div>
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="position" className="block text-sm font-medium text-gray-700">
              Position
            </label>
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5D3FD3] focus:border-[#5D3FD3] admin-form-input"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5D3FD3] focus:border-[#5D3FD3] admin-form-input"
              required
            />
          </div>

          <div className="admin-form-group">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5D3FD3] hover:bg-[#7D5FFF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5D3FD3] transition-colors admin-submit-button"
            >
              {isSubmitting ? 'Processing...' : (editingUser ? 'Update User' : 'Add User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAddUser;
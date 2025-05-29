import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa';
import API from '../../../utils/api';

const AdminUserDetail = ({ setEditingUser, setShowAddForm }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get('/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await API.delete(`/users/${userId}`);
        fetchUsers(); // Refresh the list
      } catch (err) {
        setError('Failed to delete user');
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowAddForm(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-8">Loading users...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="admin-user-container bg-white p-4 rounded-lg shadow-md">
      <div className="admin-user-header flex justify-between items-center mb-4">
        <h2 className="admin-user-title text-2xl text-[#4c2ec6] font-bold">User Management</h2>
        <div className="admin-user-search relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#5D3FD3] focus:border-[#5D3FD3]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-user-table overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border-b border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="admin-user-row">
                  <th className="px-6 py-3 text-left text-xs font-sembold text-black uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-sembold text-black uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-sembold text-black uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-sembold text-black uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-sembold text-black uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-sembold text-black uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-sembold text-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{user.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 capitalize">{user.role.toLowerCase()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{user.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {new Date(user.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-[#5D3FD3] hover:text-[#7D5FFF] mr-3"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
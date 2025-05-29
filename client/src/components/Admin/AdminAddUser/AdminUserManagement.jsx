import React, { useState } from 'react';
import AdminAddUser from './AdminAddUser';
import AdminUserDetail from './AdminUserDetail';

const AdminUserManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  return (
    <div className="container mx-auto px-4 py-8">
      {showAddForm ? (
        <AdminAddUser 
          editingUser={editingUser} 
          setEditingUser={setEditingUser} 
        />
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingUser(null);
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-[#5D3FD3] text-white rounded-md hover:bg-[#7D5FFF] transition-colors"
            >
              Add New User
            </button>
          </div>
          <AdminUserDetail 
            setEditingUser={setEditingUser} 
            setShowAddForm={setShowAddForm} 
          />
        </>
      )}
    </div>
  );
};

export default AdminUserManagement;
import React, { useState, useEffect } from 'react';
import API from '../../../utils/api';

const AdminLocalHoliday = () => {
  const [holidays, setHolidays] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [pastHolidays, setPastHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [holidayForm, setHolidayForm] = useState({
    id: null,
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const { data } = await API.get('/attendance/admin/holidays?type=upcoming');
        setUpcomingHolidays(data);
        
        const { data: pastData } = await API.get('/attendance/admin/holidays?type=past');
        setPastHolidays(pastData);
        
        setHolidays([...data, ...pastData]);
      } catch (err) {
        setError('Failed to fetch holidays');
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const { data } = await API.put(`/attendance/admin/holidays/${holidayForm.id}`, holidayForm);
        alert('Holiday updated successfully');
      } else {
        const { data } = await API.post('/attendance/admin/holidays', holidayForm);
        alert('Holiday added successfully');
      }
      
      // Refresh data
      const { data: upcomingData } = await API.get('/attendance/admin/holidays?type=upcoming');
      const { data: pastData } = await API.get('/attendance/admin/holidays?type=past');
      
      setUpcomingHolidays(upcomingData);
      setPastHolidays(pastData);
      setHolidays([...upcomingData, ...pastData]);
      
      // Reset form
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || (isEditing ? 'Failed to update holiday' : 'Failed to add holiday'));
    }
  };

  const resetForm = () => {
    setHolidayForm({
      id: null,
      name: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      reason: ''
    });
    setIsEditing(false);
  };

  const handleEdit = (holiday) => {
    setHolidayForm({
      id: holiday.id,
      name: holiday.name,
      start_date: holiday.start_date,
      end_date: holiday.end_date,
      reason: holiday.reason
    });
    setIsEditing(true);
    // Scroll to form
    document.getElementById('holiday-form').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id, isPast) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        await API.delete(`/attendance/admin/holidays/${id}`);
        alert('Holiday deleted successfully');
        // Refresh data
        if (isPast) {
          const { data: pastData } = await API.get('/attendance/admin/holidays?type=past');
          setPastHolidays(pastData);
          setHolidays([...upcomingHolidays, ...pastData]);
        } else {
          const { data: upcomingData } = await API.get('/attendance/admin/holidays?type=upcoming');
          setUpcomingHolidays(upcomingData);
          setHolidays([...upcomingData, ...pastHolidays]);
        }
        
        // If we're editing the deleted holiday, reset the form
        if (isEditing && holidayForm.id === id) {
          resetForm();
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete holiday');
      }
    }
  };

  const filteredUpcomingHolidays = upcomingHolidays
    .filter(holiday => 
      holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      holiday.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      holiday.start_date.includes(searchTerm) ||
      holiday.end_date.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return new Date(a.start_date) - new Date(b.start_date);
      } else {
        return new Date(b.start_date) - new Date(a.start_date);
      }
    });

  const filteredPastHolidays = pastHolidays
    .filter(holiday => 
      holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      holiday.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      holiday.start_date.includes(searchTerm) ||
      holiday.end_date.includes(searchTerm))
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return new Date(a.start_date) - new Date(b.start_date);
      } else {
        return new Date(b.start_date) - new Date(a.start_date);
      }
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D3FD3]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 px-2 sm:px-4">
      {/* Add/Edit Holiday Form */}
      <div id="holiday-form" className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? 'Edit Local Holiday' : 'Add Local Holiday'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name</label>
            <input
              type="text"
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({...holidayForm, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                min={isEditing ? undefined : new Date().toISOString().split('T')[0]}
                value={holidayForm.start_date}
                onChange={(e) => setHolidayForm({...holidayForm, start_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isEditing} // Disable editing of start date to prevent confusion
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                min={holidayForm.start_date}
                value={holidayForm.end_date}
                onChange={(e) => setHolidayForm({...holidayForm, end_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={holidayForm.reason}
              onChange={(e) => setHolidayForm({...holidayForm, reason: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-[#5D3FD3] hover:bg-[#7D5FFF] text-white font-bold py-2 px-4 rounded"
            >
              {isEditing ? 'Update Holiday' : 'Add Holiday'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Upcoming Holidays */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-xl font-bold">Upcoming Local Holidays</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              placeholder="Search holidays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="asc">Earliest First</option>
              <option value="desc">Latest First</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Reason</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUpcomingHolidays.map(holiday => (
                    <tr key={holiday.id}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        {new Date(holiday.start_date).toLocaleDateString()} - {new Date(holiday.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">{holiday.name}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm hidden sm:table-cell">{holiday.reason}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(holiday)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(holiday.id, false)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Past Holidays */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-xl font-bold">Local Holiday History</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              placeholder="Search holidays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="asc">Earliest First</option>
              <option value="desc">Latest First</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Reason</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPastHolidays.map(holiday => (
                    <tr key={holiday.id}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        {new Date(holiday.start_date).toLocaleDateString()} - {new Date(holiday.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">{holiday.name}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm hidden sm:table-cell">{holiday.reason}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(holiday.id, true)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLocalHoliday;
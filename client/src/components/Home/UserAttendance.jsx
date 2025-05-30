import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const UserAttendance = ({ name }) => {
  const { user } = useAuth();
  const firstName = (name || 'User').split(' ')[0];
  const [today, setToday] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState(null);
  const [leaveData, setLeaveData] = useState([]);
  const [stats, setStats] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaveForm, setLeaveForm] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [activeTab, setActiveTab] = useState('week');
  const [userStartDate, setUserStartDate] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // Default to newest first

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Fetch attendance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const todayStr = formatDate(new Date());

        // Fetch attendance history
        const { data: attendanceResponse } = await API.get('/attendance/history');
        setAttendanceData(attendanceResponse.attendance);
        setLeaveData(attendanceResponse.leaves);
        setStats(attendanceResponse.stats);

        // Fetch user details to get start date
        try {
          const { data: userResponse } = await API.get('/users/me');
          setUserStartDate(new Date(userResponse.start_date));
        } catch (userError) {
          console.log('Could not fetch user start date, using current month');
          setUserStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
        }

        // Fetch all holidays (past and upcoming)
        try {
          const { data: holidaysResponse } = await API.get('/attendance/admin/holidays?type=all');
          setHolidays(holidaysResponse);
        } catch (holidayError) {
          console.log('No holiday access, proceeding without holiday data');
          setHolidays([]);
        }

      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError(err.response?.data?.error || 'Failed to fetch attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [today, user]);

  // Toggle holiday sort order
  const toggleHolidaySort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Get sorted holidays (newest first by default)
  const getSortedHolidays = () => {
    return [...holidays].sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  // Check if date is a weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Check if date is a holiday
  const isHoliday = (date) => {
    const dateStr = formatDate(date);
    return holidays.some(holiday =>
      dateStr >= holiday.start_date && dateStr <= holiday.end_date
    );
  };

  // Get holiday reason if date is holiday
  const getHolidayReason = (date) => {
    const dateStr = formatDate(date);
    const holiday = holidays.find(h =>
      dateStr >= h.start_date && dateStr <= h.end_date
    );
    return holiday ? holiday.reason : null;
  };

  // Mark attendance
  const handleMarkAttendance = async () => {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour < 9) {
      alert('Attendance cannot be marked before 9 AM');
      return;
    }

    if (currentHour >= 17) {
      alert('Attendance marking time for today is over (after 5 PM)');
      return;
    }

    if (isWeekend(now)) {
      const dayName = now.getDay() === 0 ? 'Sunday' : 'Saturday';
      alert(`You cannot mark attendance as it is weekend (${dayName}). Enjoy your weekend!`);
      return;
    }

    if (isHoliday(now)) {
      const reason = getHolidayReason(now);
      alert(`Attendance cannot be marked today as it is a local holiday due to: ${reason}`);
      return;
    }

    try {
      await API.post('/attendance/mark');
      alert('Attendance marked successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Error marking attendance:', err);
      alert(err.response?.data?.error || 'Failed to mark attendance');
    }
  };

  // Apply for leave
  const handleApplyLeave = async () => {
    const { start_date, end_date, reason } = leaveForm;

    if (!start_date || !end_date || !reason) {
      alert('All fields are required');
      return;
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      alert('Cannot apply leave for dates before today');
      return;
    }

    if (endDate < startDate) {
      alert('End date must be after start date');
      return;
    }

    if (start_date === end_date && isWeekend(startDate)) {
      const dayName = startDate.getDay() === 0 ? 'Sunday' : 'Saturday';
      alert(`Leave cannot be applied as it is a weekend (${dayName}) already`);
      return;
    }

    if (start_date === end_date && isHoliday(startDate)) {
      const reason = getHolidayReason(startDate);
      alert(`Leave cannot be applied as it is already a local holiday due to: ${reason}`);
      return;
    }

    try {
      await API.post('/attendance/leave', leaveForm);
      alert('Leave applied successfully!');
      setLeaveForm({ start_date: '', end_date: '', reason: '' });
      window.location.reload();
    } catch (err) {
      console.error('Error applying leave:', err);
      alert(err.response?.data?.error || 'Failed to apply leave');
    }
  };

  // Delete leave
  const handleDeleteLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave application?')) {
      return;
    }

    try {
      await API.delete(`/attendance/leave/${leaveId}`);
      window.location.reload();
    } catch (err) {
      console.error('Error deleting leave:', err);
      alert(err.response?.data?.error || 'Failed to delete leave');
    }
  };

  // Prepare chart data for current week (excluding holidays)
  const prepareWeekChartData = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Monday

    const labels = [];
    const dataPoints = [];
    let presentDays = 0;
    let totalWorkingDays = 0;

    for (let i = 0; i < 5; i++) { // Only weekdays
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      // Skip future dates
      if (date > now) break;

      // Skip weekends (shouldn't happen as we're only iterating 5 days)
      if (isWeekend(date)) continue;

      // Skip holidays
      if (isHoliday(date)) continue;

      const dateStr = formatDate(date);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
      totalWorkingDays++;

      // Check if present
      const isPresent = attendanceData?.some(a => a.date === dateStr && a.status === 'present');
      if (isPresent) presentDays++;

      dataPoints.push(isPresent ? 100 : 0);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Attendance',
          data: dataPoints,
          borderColor: '#5D3FD3',
          backgroundColor: '#5D3FD3',
          tension: 0.1,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ],
      presentDays,
      totalWorkingDays
    };
  };

  // Prepare chart data for current month (excluding holidays)
  const prepareMonthChartData = () => {
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    // If user has a start date and it's in the current month, use that
    if (userStartDate &&
      userStartDate.getMonth() === now.getMonth() &&
      userStartDate.getFullYear() === now.getFullYear() &&
      userStartDate > startDate) {
      startDate = new Date(userStartDate);
    }

    const labels = [];
    const dataPoints = [];
    let presentDays = 0;
    let totalWorkingDays = 0;

    for (let date = new Date(startDate); date <= now; date.setDate(date.getDate() + 1)) {
      // Skip weekends
      if (isWeekend(date)) continue;

      // Skip holidays
      if (isHoliday(date)) continue;

      const dateStr = formatDate(date);
      labels.push(date.getDate());
      totalWorkingDays++;

      // Check if present
      const isPresent = attendanceData?.some(a => a.date === dateStr && a.status === 'present');
      if (isPresent) presentDays++;

      dataPoints.push(isPresent ? 100 : 0);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Attendance',
          data: dataPoints,
          borderColor: '#5D3FD3',
          backgroundColor: '#5D3FD3',
          tension: 0.1,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: dataPoints.map(point => point === 100 ? '#5D3FD3' : '#FF0000')
        }
      ],
      presentDays,
      totalWorkingDays
    };
  };

  const weekChartData = prepareWeekChartData();
  const monthChartData = prepareMonthChartData();
  const currentChartData = activeTab === 'week' ? weekChartData : monthChartData;
  const sortedHolidays = getSortedHolidays();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5D3FD3]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">{error}</div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Mark Today's Attendance */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mark Today's Attendance</h2>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#5D3FD3] focus:border-[#5D3FD3]"
                />
              </div>
              <button
                onClick={handleMarkAttendance}
                className="px-6 py-2 bg-[#5D3FD3] text-white rounded-lg hover:bg-[#4923f4] transition-colors"
              >
                Mark Attendance
              </button>
            </div>

            {stats?.attendancePercentage < 85 && (
              <div className="mt-4 text-red-500 text-sm">
                Warning: Your attendance percentage is below 85%. Please improve your attendance.
              </div>
            )}
          </div>
        </div>

        {/* Apply for Leave */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Apply for Leave</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                  min={formatDate(new Date())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#5D3FD3] focus:border-[#5D3FD3]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                  min={leaveForm.start_date || formatDate(new Date())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#5D3FD3] focus:border-[#5D3FD3]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Reason for leave"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#5D3FD3] focus:border-[#5D3FD3]"
                />
              </div>
            </div>

            <button
              onClick={handleApplyLeave}
              className="mt-4 px-6 py-2 bg-[#5D3FD3] text-white rounded-lg hover:bg-[#4923f4] transition-colors"
            >
              Apply Leave
            </button>
          </div>
        </div>

        {/* Leave History */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Leave History</h2>

            <div className="overflow-x-auto">
              <div className="max-h-64 overflow-y-auto">
                {/* Desktop table */}
                <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveData?.length > 0 ? (
                      leaveData.map((leave) => (
                        <tr key={leave.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 rounded-full text-xs ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                                leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {leave.status === 'auto-generated' ? 'System Generated' : leave.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {leave.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {leave.status !== 'auto-generated' && new Date(leave.end_date) >= new Date() && (
                              <button
                                onClick={() => handleDeleteLeave(leave.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          No leave history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-4">
                  {leaveData?.length > 0 ? (
                    leaveData.map((leave) => (
                      <div key={leave.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {leave.reason}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                              leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {leave.status === 'auto-generated' ? 'System Generated' : leave.status}
                          </span>
                        </div>
                        {leave.status !== 'auto-generated' && new Date(leave.end_date) >= new Date() && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleDeleteLeave(leave.id)}
                              className="text-sm text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-gray-500 py-4">
                      No leave history found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Statistics */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{firstName}'s Attendance Statistics (till {new Date().toLocaleDateString()})</h2>

            {/* Desktop grid */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard
                title="Total Working Days"
                value={stats?.totalWorkingDays || 0}
                icon="📅"
              />
              <StatCard
                title="Present Days"
                value={stats?.presentDays || 0}
                icon="✅"
              />
              <StatCard
                title="Leave Days"
                value={stats?.leaveDays || 0}
                icon="🏖️"
              />
              <StatCard
                title="Days Failed to Mark"
                value={stats?.failedToMark || 0}
                icon="❌"
              />
              <StatCard
                title="Overall Attendance %"
                value={`${stats?.attendancePercentage || 0}%`}
                icon="📊"
                highlight={stats?.attendancePercentage < 85}
              />
            </div>

            {/* Mobile grid */}
            <div className="sm:hidden grid grid-cols-2 gap-3">
              <StatCard
                title="Working Days"
                value={stats?.totalWorkingDays || 0}
                icon="📅"
                small
              />
              <StatCard
                title="Present"
                value={stats?.presentDays || 0}
                icon="✅"
                small
              />
              <StatCard
                title="Leave"
                value={stats?.leaveDays || 0}
                icon="🏖️"
                small
              />
              <StatCard
                title="Failed"
                value={stats?.failedToMark || 0}
                icon="❌"
                small
              />
              <div className="col-span-2">
                <StatCard
                  title="Attendance %"
                  value={`${stats?.attendancePercentage || 0}%`}
                  icon="📊"
                  highlight={stats?.attendancePercentage < 85}
                  small
                />
              </div>
            </div>
          </div>
        </div>

        {/* Local Holidays History */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Local Holidays History</h2>
              <button
                onClick={toggleHolidaySort}
                className="flex items-center text-sm text-[#5D3FD3] hover:text-[#4923f4]"
              >
                {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ml-1 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                {/* Desktop table */}
                <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holiday Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedHolidays.length > 0 ? (
                      sortedHolidays.map((holiday) => {
                        const endDate = new Date(holiday.end_date);

                        return (
                          <tr key={holiday.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(holiday.start_date).toLocaleDateString()} - {endDate.toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {holiday.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {holiday.reason}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                          No holidays found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-4">
                  {sortedHolidays.length > 0 ? (
                    sortedHolidays.map((holiday) => {
                      const endDate = new Date(holiday.end_date);

                      return (
                        <div key={holiday.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {new Date(holiday.start_date).toLocaleDateString()} - {endDate.toLocaleDateString()}
                              </p>
                              <p className="text-sm font-semibold text-[#5D3FD3] mt-1">
                                {holiday.name}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              {holiday.reason}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-sm text-gray-500 py-4">
                      No holidays found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Attendance Analytics */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{firstName}'s Attendance Analytics</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('week')}
                  className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'week'
                      ? 'bg-[#5D3FD3] text-white'
                      : 'bg-gray-200 text-gray-800'
                    }`}
                >
                  Current Week
                </button>
                <button
                  onClick={() => setActiveTab('month')}
                  className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'month'
                      ? 'bg-[#5D3FD3] text-white'
                      : 'bg-gray-200 text-gray-800'
                    }`}
                >
                  Current Month
                </button>
              </div>
            </div>

            <div className="h-64">
              <Line
                data={currentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      min: 0,
                      max: 100,
                      ticks: {
                        stepSize: 50,
                        callback: (value) => value === 100 ? 'Present' : value === 0 ? 'Absent' : ''
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return context.parsed.y === 100 ? 'Present' : 'Absent';
                        }
                      }
                    }
                  }
                }}
              />
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-700">
                {activeTab === 'week' ? 'Week' : 'Month'} Attendance: {currentChartData.presentDays} out of {currentChartData.totalWorkingDays} working days
                (excluding holidays)
              </p>
              <p className="font-semibold">
                Attendance Percentage: {currentChartData.totalWorkingDays > 0
                  ? Math.round((currentChartData.presentDays / currentChartData.totalWorkingDays) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, highlight = false, small = false }) => (
  <div className={`bg-gray-50 p-4 rounded-lg border ${highlight ? 'border-red-300' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
    <div className="flex flex-col items-center">
      <span className={`${small ? 'text-xl' : 'text-2xl'} mb-2`}>{icon}</span>
      <p className={`${small ? 'text-xs' : 'text-sm'} font-medium text-gray-500 text-center`}>{title}</p>
      <p className={`${small ? 'text-base' : 'text-lg'} font-semibold ${highlight ? 'text-red-600' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  </div>
);

export default UserAttendance;
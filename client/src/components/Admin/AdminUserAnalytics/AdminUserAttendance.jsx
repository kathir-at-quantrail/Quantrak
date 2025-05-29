import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import API from '../../../utils/api';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const AdminUserAttendance = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [graphLoading, setGraphLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await API.get('/users');
        setUsers(data);
        
        // Extract unique positions from users
        const positions = [...new Set(data.map(user => user.position))].filter(Boolean);
        setAvailablePositions(positions);
        
        if (data.length > 0) {
          setSelectedUserId(data[0].id);
        }
      } catch (err) {
        setError('Failed to fetch users');
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/attendance/admin/user/${selectedUserId}`);
        // Process the data to include failed attendance days as leave records
        const processedData = processUserData(data);
        setUserData(processedData);
      } catch (err) {
        setError('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [selectedUserId]);

  // Function to process user data and include failed attendance days as leave records
  const processUserData = (data) => {
    if (!data || !data.user) return data;
    
    const today = new Date();
    const userStartDate = new Date(data.user.start_date);
    const processedData = { ...data };
    const failedAttendanceDays = [];

    // Check each working day from start date to today
    for (let date = new Date(userStartDate); date <= today; date.setDate(date.getDate() + 1)) {
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip holidays
      const isHoliday = data.holidays?.some(holiday => 
        new Date(holiday.start_date) <= date && new Date(holiday.end_date) >= date
      );
      if (isHoliday) continue;
      
      // Check if attendance was marked
      const attendanceMarked = processedData.attendance.some(a => a.date === dateStr && a.status === 'present');
      
      // Check if leave was applied
      const leaveApplied = processedData.leaves.some(leave => 
        new Date(leave.start_date) <= date && new Date(leave.end_date) >= date && leave.status === 'approved'
      );
      
      // If neither attendance nor leave, create a default leave record
      if (!attendanceMarked && !leaveApplied) {
        failedAttendanceDays.push({
          id: `auto-${dateStr}`,
          start_date: dateStr,
          end_date: dateStr,
          reason: 'Failed to Mark Attendance',
          status: 'auto-generated',
          user_id: data.user.id,
          created_at: dateStr,
          updated_at: dateStr
        });
      }
    }
    
    // Combine existing leaves with auto-generated ones
    processedData.leaves = [...processedData.leaves, ...failedAttendanceDays];
    
    // Sort leaves by date (newest first)
    processedData.leaves.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    
    return processedData;
  };

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setGraphLoading(true);
        let url = '/attendance/admin/summary';
        if (positionFilter) {
          url += `?position=${encodeURIComponent(positionFilter)}`;
        }
        const { data } = await API.get(url);
        
        // Find all users with max and min attendance percentages
        if (data.users && data.users.length > 0) {
          const sortedUsers = [...data.users].sort((a, b) => 
            b.stats.attendancePercentage - a.stats.attendancePercentage
          );
          
          const maxPercentage = sortedUsers[0].stats.attendancePercentage;
          const minPercentage = sortedUsers[sortedUsers.length - 1].stats.attendancePercentage;
          
          data.bestPerformers = sortedUsers.filter(
            user => user.stats.attendancePercentage === maxPercentage
          );
          data.worstPerformers = sortedUsers.filter(
            user => user.stats.attendancePercentage === minPercentage
          );
        }
        
        setComparisonData(data);
      } catch (err) {
        setError('Failed to fetch comparison data');
      } finally {
        setGraphLoading(false);
      }
    };

    if (selectedIndex === 1) { // Only fetch when on comparison tab
      fetchComparisonData();
    }
  }, [positionFilter, selectedIndex]);

  const renderComparisonGraph = () => {
    if (graphLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D3FD3]"></div>
        </div>
      );
    }

    if (!comparisonData || comparisonData.users.length === 0) {
      return (
        <div className="flex justify-center items-center h-full text-gray-500">
          No data available for the selected filter
        </div>
      );
    }

    const labels = comparisonData.users.map(user => user.name);
    const dataPoints = comparisonData.users.map(user => user.stats.attendancePercentage);

    // Generate gradient colors based on performance
    const backgroundColors = dataPoints.map(value => {
      const hue = (value * 1.2).toString(10); // Scale the hue based on percentage
      return `hsla(${hue}, 80%, 60%, 0.8)`;
    });

    const hoverBackgroundColors = dataPoints.map(value => {
      const hue = (value * 1.2).toString(10); // Scale the hue based on percentage
      return `hsla(${hue}, 90%, 50%, 1)`;
    });

    const data = {
      labels,
      datasets: [
        {
          label: 'Attendance Percentage',
          data: dataPoints,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: hoverBackgroundColors,
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          borderRadius: 6, // Rounded corners for bars
          borderSkipped: false, // Apply border radius to all sides
          barThickness: 'flex', // Flexible bar thickness
          maxBarThickness: 40, // Maximum bar thickness
          minBarLength: 5, // Minimum bar length
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              return `${context.parsed.y}% attendance`;
            }
          }
        },
        datalabels: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            drawBorder: false,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            padding: 10,
            color: '#6B7280',
            font: {
              size: 12
            },
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            padding: 10,
            color: '#6B7280',
            font: {
              size: 12
            },
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };

    return (
      <div className="relative h-full w-full">
        <Bar 
          data={data} 
          options={options}
          plugins={[{
            id: 'customGridLines',
            beforeDraw(chart) {
              const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
              
              // Draw a subtle gradient background
              const gradient = ctx.createLinearGradient(0, top, 0, bottom);
              gradient.addColorStop(0, 'rgba(245, 245, 245, 0.8)');
              gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
              
              ctx.save();
              ctx.fillStyle = gradient;
              ctx.fillRect(left, top, width, height);
              ctx.restore();
            }
          }]}
        />
      </div>
    );
  };

  const handlePositionFilterChange = (e) => {
    setPositionFilter(e.target.value);
  };

  if (loading && selectedIndex === 0) {
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
    <div className="space-y-8">
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex space-x-1 rounded-lg bg-gray-200 p-1">
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-lg ${
                selected ? 'bg-white shadow text-[#5D3FD3]' : 'text-gray-700 hover:bg-white/[0.12]'
              }`
            }
          >
            Individual Analytics
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-lg ${
                selected ? 'bg-white shadow text-[#5D3FD3]' : 'text-gray-700 hover:bg-white/[0.12]'
              }`
            }
          >
            Comparing User Analytics
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.position})
                    </option>
                  ))}
                </select>
              </div>

              {userData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-800">Total Working Days</h3>
                      <p className="text-2xl font-bold text-blue-600">{userData.stats.totalWorkingDays}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-800">Present Days</h3>
                      <p className="text-2xl font-bold text-green-600">{userData.stats.presentDays}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-yellow-800">Leave Days</h3>
                      <p className="text-2xl font-bold text-yellow-600">{userData.stats.leaveDays + userData.stats.failedToMark}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-red-800">Failed to Mark</h3>
                      <p className="text-2xl font-bold text-red-600">{userData.stats.failedToMark}</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg mb-6">
                    <h3 className="text-sm font-medium text-purple-800">Overall Attendance Percentage</h3>
                    <p className="text-2xl font-bold text-purple-600">{userData.stats.attendancePercentage}%</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Leave History</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userData.leaves.map((leave) => (
                            <tr key={leave.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  leave.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  leave.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  leave.status === 'auto-generated' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {leave.status === 'auto-generated' ? 'System Generated' : leave.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{leave.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="position-filter-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Position
                  </label>
                  <select
                    id="position-filter-select"
                    value={positionFilter}
                    onChange={handlePositionFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Positions</option>
                    {availablePositions.map(position => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setPositionFilter('')}
                    className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>

              <div className="h-96 mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                {renderComparisonGraph()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">Best Attendance</h3>
                  {comparisonData?.bestPerformers ? (
                    <div>
                      {comparisonData.bestPerformers.map((user, index) => (
                        <div key={user.id} className={index > 0 ? 'mt-2' : ''}>
                          <p className="text-lg font-bold text-green-600">
                            {user.name}
                          </p>
                          <p className="text-md text-green-600">
                            {user.stats.attendancePercentage}%
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No data available</p>
                  )}
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-800">Least Attendance</h3>
                  {comparisonData?.worstPerformers ? (
                    <div>
                      {comparisonData.worstPerformers.map((user, index) => (
                        <div key={user.id} className={index > 0 ? 'mt-2' : ''}>
                          <p className="text-lg font-bold text-red-600">
                            {user.name}
                          </p>
                          <p className="text-md text-red-600">
                            {user.stats.attendancePercentage}%
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No data available</p>
                  )}
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AdminUserAttendance;
import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import AdminUserAttendance from './AdminUserAttendance';
import AdminLocalHoliday from './AdminLocalHoliday';

const AdminUserAnalytics = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">User Analytics Dashboard</h1>
        
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-lg bg-gray-200 p-1">
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium rounded-lg ${
                  selected ? 'bg-white shadow text-[#5D3FD3]' : 'text-gray-700 hover:bg-white/[0.12]'
                }`
              }
            >
              User Attendance
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium rounded-lg ${
                  selected ? 'bg-white shadow text-[#5D3FD3]' : 'text-gray-700 hover:bg-white/[0.12]'
                }`
              }
            >
              Local Holidays
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-4">
            <Tab.Panel>
              <AdminUserAttendance />
            </Tab.Panel>
            <Tab.Panel>
              <AdminLocalHoliday />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AdminUserAnalytics;
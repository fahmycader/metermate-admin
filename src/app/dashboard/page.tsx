'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useMeterUsers, useRefreshData } from '@/hooks/useData';
import AdminLayout from '@/components/AdminLayout';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  department: string;
  role: string;
  isActive: boolean;
  lastLogin: string;
  jobsCompleted: number;
  weeklyPerformance: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const { data: usersResponse, isLoading, error, refetch } = useMeterUsers();
  const refreshMutation = useRefreshData();
  
  const users = usersResponse?.users || [];

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Current User Info */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Your Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm text-gray-900">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Username</label>
                <p className="text-sm text-gray-900">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <p className="text-sm text-gray-900 capitalize">{user?.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{user?.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Employee ID</label>
                <p className="text-sm text-gray-900">{user?.employeeId || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="text-sm text-gray-900">{user?.department || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Database Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Meter Department Users
              </h3>
              <div className="flex space-x-2">
                <ConnectionStatus />
                <button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={() => refreshMutation.mutate()}
                  disabled={refreshMutation.isPending}
                  className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {refreshMutation.isPending ? 'Syncing...' : 'Sync All'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{error.message}</div>
              </div>
            )}

            {users.length === 0 && !error ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No meter department users found</div>
                <div className="text-sm text-gray-400 mt-2">
                  Make sure your backend is running and connected to MongoDB
                </div>
              </div>
            ) : error && error.message.includes('Access denied') ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">Access Restricted</div>
                <div className="text-sm text-gray-400 mb-4">
                  Only admin users can view meter department users
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="text-sm text-blue-800">
                    <strong>Your Role:</strong> {user?.role}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    Contact an administrator to upgrade your access level
                  </div>
                </div>
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((dbUser: User) => (
                      <tr key={dbUser._id} className={dbUser._id === user?._id ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {dbUser.firstName.charAt(0)}{dbUser.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {dbUser.firstName} {dbUser.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{dbUser.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{dbUser.email || 'No email'}</div>
                          <div className="text-sm text-gray-500">{dbUser.phone || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            dbUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            dbUser.role === 'meter_reader' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {dbUser.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            dbUser.lastLogin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {dbUser.lastLogin ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>Jobs: {dbUser.jobsCompleted || 0}</div>
                          <div>Performance: {dbUser.weeklyPerformance || 0}%</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="mt-4 text-sm text-gray-500">
              Total meter department users: <span className="font-medium">{users.length}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
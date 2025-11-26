'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import DeleteDialog from '@/components/DeleteDialog';

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
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    user: User | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    user: null,
    isLoading: false,
  });
  const [progressDialog, setProgressDialog] = useState<{
    isOpen: boolean;
    user: User | null;
    isLoading: boolean;
    progressData: any;
  }>({
    isOpen: false,
    user: null,
    isLoading: false,
    progressData: null,
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await usersAPI.getMeterUsers();
      setUsers(response.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.message.includes('403') || error.message.includes('Access denied')) {
        setError('Access denied: You need admin privileges to view users');
      } else if (error.message.includes('401')) {
        setError('Authentication failed: Please login again');
      } else {
        setError(`Failed to fetch users: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = () => {
    fetchUsers();
  };

  const handleDeleteUser = (userToDelete: User) => {
    setDeleteDialog({
      isOpen: true,
      user: userToDelete,
      isLoading: false,
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteDialog.user) return;

    setDeleteDialog(prev => ({ ...prev, isLoading: true }));

    try {
      // Call the delete API (you'll need to implement this in your backend)
      await usersAPI.deleteUser(deleteDialog.user._id);
      
      // Remove user from local state
      setUsers(prev => prev.filter(u => u._id !== deleteDialog.user!._id));
      
      // Close dialog
      setDeleteDialog({
        isOpen: false,
        user: null,
        isLoading: false,
      });

      // Show success message
      setError('');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(`Failed to delete user: ${error.message}`);
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      user: null,
      isLoading: false,
    });
  };

  const handleViewProgress = async (userToView: User) => {
    setProgressDialog({
      isOpen: true,
      user: userToView,
      isLoading: true,
      progressData: null,
    });

    try {
      const response = await usersAPI.getUserProgress(userToView._id);
      setProgressDialog({
        isOpen: true,
        user: userToView,
        isLoading: false,
        progressData: response,
      });
    } catch (error: any) {
      console.error('Error fetching progress:', error);
      setProgressDialog({
        isOpen: true,
        user: userToView,
        isLoading: false,
        progressData: null,
      });
    }
  };

  const closeProgressDialog = () => {
    setProgressDialog({
      isOpen: false,
      user: null,
      isLoading: false,
      progressData: null,
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-2">Loading Users...</div>
            <div className="text-sm text-gray-500">Fetching user data from database</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">This page is only accessible to administrators.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage meter department users and their access</p>
          </div>
          <button
            onClick={refreshUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Meter Department Users
              </h3>
              <div className="text-sm text-gray-500">
                Total users: <span className="font-medium">{users.length}</span>
              </div>
            </div>

            {users.length === 0 && !error ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No meter department users found</div>
                <div className="text-sm text-gray-400 mt-2">
                  Make sure your backend is running and connected to MongoDB
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((dbUser) => (
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
                              <div className="text-xs text-gray-400">
                                ID: {dbUser.employeeId}
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
                            {dbUser.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            dbUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {dbUser.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>Jobs: {dbUser.jobsCompleted || 0}</div>
                          <div>Performance: {dbUser.weeklyPerformance || 0}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dbUser.lastLogin ? new Date(dbUser.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewProgress(dbUser)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                              title="View Progress"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </button>
                            {dbUser._id !== user?._id && (
                              <button
                                onClick={() => handleDeleteUser(dbUser)}
                                className="text-red-600 hover:text-red-900 text-sm"
                                title="Delete User"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        itemName={deleteDialog.user ? `${deleteDialog.user.firstName} ${deleteDialog.user.lastName}` : ''}
        isLoading={deleteDialog.isLoading}
      />

      {/* Progress Dialog */}
      {progressDialog.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {progressDialog.user ? `${progressDialog.user.firstName} ${progressDialog.user.lastName} - Progress Report` : 'Progress Report'}
                </h3>
                <button
                  onClick={closeProgressDialog}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {progressDialog.isLoading ? (
                <div className="text-center py-8">
                  <div className="text-lg font-medium text-gray-900 mb-2">Loading Progress...</div>
                  <div className="text-sm text-gray-500">Fetching progress data</div>
                </div>
              ) : progressDialog.progressData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Total Jobs</div>
                      <div className="text-2xl font-bold text-blue-700">{progressDialog.progressData.statistics.totalJobs}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Completed Jobs</div>
                      <div className="text-2xl font-bold text-green-700">{progressDialog.progressData.statistics.completedJobs}</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Pending Jobs</div>
                      <div className="text-2xl font-bold text-yellow-700">{progressDialog.progressData.statistics.pendingJobs}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">In Progress</div>
                      <div className="text-2xl font-bold text-purple-700">{progressDialog.progressData.statistics.inProgressJobs}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 mb-2">Completion Rate</div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-blue-600 h-4 rounded-full"
                            style={{ width: `${progressDialog.progressData.statistics.completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-blue-700">
                        {progressDialog.progressData.statistics.completionPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Jobs with Reading</div>
                      <div className="text-xl font-bold text-green-700">{progressDialog.progressData.statistics.jobsWithReading}</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Valid No Access</div>
                      <div className="text-xl font-bold text-orange-700">{progressDialog.progressData.statistics.validNoAccessJobs}</div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Total Points</div>
                      <div className="text-xl font-bold text-indigo-700">{progressDialog.progressData.statistics.totalPoints}</div>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Total Distance</div>
                      <div className="text-xl font-bold text-teal-700">{progressDialog.progressData.statistics.totalDistanceMiles.toFixed(2)} miles</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 text-center">
                    Date Range: {progressDialog.progressData.dateRange.start} to {progressDialog.progressData.dateRange.end}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-red-600">Failed to load progress data</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

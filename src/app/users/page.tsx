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
    locationData: any;
  }>({
    isOpen: false,
    user: null,
    isLoading: false,
    progressData: null,
    locationData: null,
  });
  const [editDialog, setEditDialog] = useState<{
    isOpen: boolean;
    user: User | null;
    isLoading: boolean;
    formData: Partial<User>;
  }>({
    isOpen: false,
    user: null,
    isLoading: false,
    formData: {},
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

  const handleEditUser = (userToEdit: User) => {
    setEditDialog({
      isOpen: true,
      user: userToEdit,
      isLoading: false,
      formData: {
        firstName: userToEdit.firstName,
        lastName: userToEdit.lastName,
        email: userToEdit.email,
        phone: userToEdit.phone,
        employeeId: userToEdit.employeeId,
        department: userToEdit.department,
        role: userToEdit.role,
      },
    });
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

  const closeEditDialog = () => {
    setEditDialog({
      isOpen: false,
      user: null,
      isLoading: false,
      formData: {},
    });
  };

  const handleEditSubmit = async () => {
    if (!editDialog.user) return;

    setEditDialog(prev => ({ ...prev, isLoading: true }));

    try {
      const updatedUser = await usersAPI.updateUser(editDialog.user._id, editDialog.formData);
      
      // Update user in local state
      setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
      
      // Close dialog
      closeEditDialog();
      
      // Show success message
      setError('');
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(`Failed to update user: ${error.message}`);
      setEditDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleViewProgress = async (userToView: User) => {
    setProgressDialog({
      isOpen: true,
      user: userToView,
      isLoading: true,
      progressData: null,
      locationData: null,
    });

    try {
      // Fetch both progress and location data
      const [progressResponse, locationResponse] = await Promise.all([
        usersAPI.getUserProgress(userToView._id).catch(() => null),
        usersAPI.getUserLocation(userToView._id).catch(() => null),
      ]);
      
      setProgressDialog({
        isOpen: true,
        user: userToView,
        isLoading: false,
        progressData: progressResponse,
        locationData: locationResponse,
      });
    } catch (error: any) {
      console.error('Error fetching progress:', error);
      setProgressDialog({
        isOpen: true,
        user: userToView,
        isLoading: false,
        progressData: null,
        locationData: null,
      });
    }
  };

  const closeProgressDialog = () => {
    setProgressDialog({
      isOpen: false,
      user: null,
      isLoading: false,
      progressData: null,
      locationData: null,
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
                            dbUser.lastLogin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {dbUser.lastLogin ? 'Active' : 'Inactive'}
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

                  {/* Location Section */}
                  {progressDialog.locationData?.user?.currentLocation && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-semibold text-indigo-900">Current Location</div>
                        <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Latitude:</span>
                          <span className="font-mono font-semibold text-indigo-700">
                            {progressDialog.locationData.user.currentLocation.latitude?.toFixed(6)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Longitude:</span>
                          <span className="font-mono font-semibold text-indigo-700">
                            {progressDialog.locationData.user.currentLocation.longitude?.toFixed(6)}
                          </span>
                        </div>
                        {progressDialog.locationData.user.currentLocation.accuracy && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accuracy:</span>
                            <span className="font-semibold text-indigo-700">
                              ±{progressDialog.locationData.user.currentLocation.accuracy.toFixed(0)}m
                            </span>
                          </div>
                        )}
                        {progressDialog.locationData.user.currentLocation.timestamp && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="text-indigo-600">
                              {new Date(progressDialog.locationData.user.currentLocation.timestamp).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-indigo-200">
                          <a
                            href={`https://www.google.com/maps?q=${progressDialog.locationData.user.currentLocation.latitude},${progressDialog.locationData.user.currentLocation.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View on Google Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {progressDialog.locationData && !progressDialog.locationData.user?.currentLocation && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                      <div className="text-sm text-gray-600 text-center">
                        No location data available for this operative
                      </div>
                    </div>
                  )}

                  {/* Job Locations Map Section */}
                  {progressDialog.progressData?.jobLocations && progressDialog.progressData.jobLocations.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-lg font-semibold text-blue-900">Job Locations Map</div>
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-gray-700">Job Location</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-gray-700">Start Point</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-gray-700">Completion Point</span>
                          </div>
                          {progressDialog.locationData?.user?.currentLocation && (
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                              <span className="text-gray-700">Current Location</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {progressDialog.progressData.jobLocations.map((job: any, idx: number) => (
                            <div key={idx} className="bg-white p-2 rounded border border-blue-100">
                              <div className="font-medium text-xs text-gray-900">
                                Job {job.jobId || `#${job.sequenceNumber || idx + 1}`} ({job.status})
                              </div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {job.jobLocation && (
                                  <a
                                    href={`https://www.google.com/maps?q=${job.jobLocation.latitude},${job.jobLocation.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-green-600 hover:text-green-800"
                                  >
                                    📍 Job Location
                                  </a>
                                )}
                                {job.startLocation && (
                                  <a
                                    href={`https://www.google.com/maps?q=${job.startLocation.latitude},${job.startLocation.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    🚀 Start Point
                                  </a>
                                )}
                                {job.endLocation && (
                                  <a
                                    href={`https://www.google.com/maps?q=${job.endLocation.latitude},${job.endLocation.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-red-600 hover:text-red-800"
                                  >
                                    ✅ Completion Point
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <a
                            href={`https://www.google.com/maps/dir/${progressDialog.progressData.jobLocations
                              .filter((j: any) => j.jobLocation)
                              .map((j: any) => `${j.jobLocation.latitude},${j.jobLocation.longitude}`)
                              .join('/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            View All Locations on Google Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
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

      {/* Edit User Dialog */}
      {editDialog.isOpen && editDialog.user && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Edit User: {editDialog.user.firstName} {editDialog.user.lastName}
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input
                          type="text"
                          value={editDialog.formData.firstName || ''}
                          onChange={(e) => setEditDialog(prev => ({
                            ...prev,
                            formData: { ...prev.formData, firstName: e.target.value }
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input
                          type="text"
                          value={editDialog.formData.lastName || ''}
                          onChange={(e) => setEditDialog(prev => ({
                            ...prev,
                            formData: { ...prev.formData, lastName: e.target.value }
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={editDialog.formData.email || ''}
                          onChange={(e) => setEditDialog(prev => ({
                            ...prev,
                            formData: { ...prev.formData, email: e.target.value }
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={editDialog.formData.phone || ''}
                          onChange={(e) => setEditDialog(prev => ({
                            ...prev,
                            formData: { ...prev.formData, phone: e.target.value }
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                        <input
                          type="text"
                          value={editDialog.formData.employeeId || ''}
                          onChange={(e) => setEditDialog(prev => ({
                            ...prev,
                            formData: { ...prev.formData, employeeId: e.target.value }
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                          value={editDialog.formData.department || 'meter'}
                          onChange={(e) => setEditDialog(prev => ({
                            ...prev,
                            formData: { ...prev.formData, department: e.target.value }
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="meter">Meter</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          value={editDialog.formData.role || 'meter_reader'}
                          onChange={(e) => setEditDialog(prev => ({
                            ...prev,
                            formData: { ...prev.formData, role: e.target.value }
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="meter_reader">Meter Reader</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  disabled={editDialog.isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {editDialog.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={closeEditDialog}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

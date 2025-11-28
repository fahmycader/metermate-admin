'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMileageReport, useRefreshData } from '@/hooks/useData';
import { usersAPI } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface JobData {
  _id: string;
  jobType: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  assignedTo: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    employeeId: string;
  };
  status: string;
  scheduledDate: string;
  completedDate: string;
  distanceTraveled: number;
  startLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  locationHistory: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
}

interface UserMileageData {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    employeeId: string;
  };
  totalDistance: number; // in km (for backward compatibility)
  totalDistanceKm?: number; // in km
  totalDistanceMiles?: number; // in miles
  mileagePayment?: number; // in £
  totalJobs: number;
  completedJobs: number;
  averageDistancePerJob: number;
  jobs: JobData[];
}

export default function UserMileagePage() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('week');
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [meterReaders, setMeterReaders] = useState<any[]>([]);

  const { data: mileageResponse, isLoading, error, refetch } = useMileageReport(dateRange);
  const refreshMutation = useRefreshData();

  const mileageData = mileageResponse?.data || [];

  // Fetch meter readers for the filter
  React.useEffect(() => {
    const fetchMeterReaders = async () => {
      try {
        const response = await usersAPI.getMeterReaders();
        if (response.users) {
          setMeterReaders(response.users);
        }
      } catch (error) {
        console.error('Error fetching meter readers:', error);
      }
    };

    if (user?.role === 'admin') {
      fetchMeterReaders();
    }
  }, [user]);

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(2)} km`;
  };

  const formatDistanceMiles = (distanceKm: number) => {
    const miles = distanceKm * 0.621371; // Convert km to miles
    return `${miles.toFixed(2)} miles`;
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading mileage data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Mileage Tracking</h1>
              <p className="mt-2 text-gray-600">Monitor distance traveled and job completion locations</p>
            </div>
            <div className="flex space-x-2">
              <ConnectionStatus />
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshMutation.isPending ? 'Syncing...' : 'Sync All'}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="today" className="text-gray-900">Today</option>
                <option value="week" className="text-gray-900">This Week</option>
                <option value="month" className="text-gray-900">This Month</option>
                <option value="all" className="text-gray-900">All Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="" className="text-gray-900">All Users</option>
                {meterReaders.map((reader) => (
                  <option key={reader._id} value={reader._id} className="text-gray-900">
                    {reader.firstName} {reader.lastName} ({reader.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">U</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{mileageData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">D</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Distance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDistance(mileageData.reduce((sum: number, data: UserMileageData) => sum + (data.totalDistanceKm || data.totalDistance), 0))}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceMiles(mileageData.reduce((sum: number, data: UserMileageData) => sum + (data.totalDistanceKm || data.totalDistance), 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">£</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Mileage Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(mileageData.reduce((sum: number, data: UserMileageData) => sum + (data.mileagePayment || 0), 0))}
                </p>
                <p className="text-xs text-gray-500 mt-1">@ £0.35/mile</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">J</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mileageData.reduce((sum: number, data: UserMileageData) => sum + data.totalJobs, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mileageData.reduce((sum: number, data: UserMileageData) => sum + data.completedJobs, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Mileage Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">User Mileage Report</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Miles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mileage Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jobs Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Distance/Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mileageData
                  .filter((data: UserMileageData) => !selectedUser || data.user._id === selectedUser)
                  .map((data: UserMileageData) => (
                    <tr key={data.user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {data.user.firstName} {data.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {data.user.employeeId} • {data.user.username}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDistance(data.totalDistanceKm || data.totalDistance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.totalDistanceMiles ? `${data.totalDistanceMiles.toFixed(2)} miles` : formatDistanceMiles(data.totalDistanceKm || data.totalDistance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                        {data.mileagePayment ? formatCurrency(data.mileagePayment) : formatCurrency((data.totalDistanceKm || data.totalDistance) * 0.621371 * 0.35)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.completedJobs} / {data.totalJobs}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDistance(data.averageDistancePerJob)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedJob(data.jobs[0] || null)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Jobs
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Job Details</h3>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Job Information</h4>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Job Type</p>
                        <p className="text-sm font-medium text-gray-900">{selectedJob.jobType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="text-sm font-medium text-gray-900">{selectedJob.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Scheduled Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(selectedJob.scheduledDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Completed Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedJob.completedDate ? formatDate(selectedJob.completedDate) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Address</h4>
                    <p className="text-sm text-gray-900">
                      {selectedJob.address.street}, {selectedJob.address.city}, {selectedJob.address.state} {selectedJob.address.zipCode}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Distance Traveled</h4>
                    <p className="text-sm text-gray-900">{formatDistance(selectedJob.distanceTraveled)}</p>
                  </div>

                  {selectedJob.startLocation && (
                    <div>
                      <h4 className="font-medium text-gray-900">Start Location</h4>
                      <div className="mt-2 flex items-center space-x-4">
                        <p className="text-sm text-gray-900">
                          {selectedJob.startLocation.latitude.toFixed(6)}, {selectedJob.startLocation.longitude.toFixed(6)}
                        </p>
                        <button
                          onClick={() => openGoogleMaps(selectedJob.startLocation.latitude, selectedJob.startLocation.longitude)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View on Map
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Started: {formatTime(selectedJob.startLocation.timestamp)}
                      </p>
                    </div>
                  )}

                  {selectedJob.endLocation && (
                    <div>
                      <h4 className="font-medium text-gray-900">End Location</h4>
                      <div className="mt-2 flex items-center space-x-4">
                        <p className="text-sm text-gray-900">
                          {selectedJob.endLocation.latitude.toFixed(6)}, {selectedJob.endLocation.longitude.toFixed(6)}
                        </p>
                        <button
                          onClick={() => openGoogleMaps(selectedJob.endLocation.latitude, selectedJob.endLocation.longitude)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View on Map
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Completed: {formatTime(selectedJob.endLocation.timestamp)}
                      </p>
                    </div>
                  )}

                  {selectedJob.locationHistory && selectedJob.locationHistory.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900">Location History</h4>
                      <p className="text-sm text-gray-900">
                        {selectedJob.locationHistory.length} location points recorded
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

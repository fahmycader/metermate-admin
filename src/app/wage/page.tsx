'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWageReport, useRefreshData, useMeterUsers } from '@/hooks/useData';
import AdminLayout from '@/components/AdminLayout';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface UserWageData {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    employeeId: string;
  };
  totalDistance: number;
  totalJobs: number;
  completedJobs: number;
  baseWage: number;
  fuelAllowance: number;
  totalWage: number;
  averageDistancePerJob: number;
  jobs: Array<{
    _id: string;
    jobType: string;
    status: string;
    scheduledDate: string;
    completedDate: string;
    distanceTraveled: number;
    address: {
      street: string;
      city: string;
      county: string;
      postcode: string;
    } | null;
  }>;
}

interface WageSummary {
  totalUsers: number;
  totalDistance: number;
  totalJobs: number;
  totalCompletedJobs: number;
  totalBaseWage: number;
  totalFuelAllowance: number;
  totalWage: number;
  ratePerMile: number;
  fuelAllowancePerJob: number;
}

export default function WagePage() {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week ago
    endDate: new Date().toISOString().split('T')[0], // today
  });
  const [wageSettings, setWageSettings] = useState({
    ratePerMile: 0.50, // £0.50 per mile
    fuelAllowancePerJob: 1.00, // £1.00 per job for fuel allowance
  });
  const { user } = useAuth();

  // Build query parameters
  const queryParams = {
    userId: selectedUser || undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    ratePerMile: wageSettings.ratePerMile,
    fuelAllowancePerJob: wageSettings.fuelAllowancePerJob,
  };

  const { data: wageResponse, isLoading, error, refetch } = useWageReport(queryParams);
  const { data: usersResponse } = useMeterUsers();
  const refreshMutation = useRefreshData();

  const wageData: UserWageData[] = wageResponse?.data || [];
  const summary: WageSummary = wageResponse?.summary || {
    totalUsers: 0,
    totalDistance: 0,
    totalJobs: 0,
    totalCompletedJobs: 0,
    totalBaseWage: 0,
    totalFuelAllowance: 0,
    totalWage: 0,
    ratePerMile: 0.50,
    fuelAllowancePerJob: 1.00,
  };
  const meterReaders = usersResponse?.users || [];

  const handleWageSettingsChange = (field: keyof typeof wageSettings, value: number) => {
    setWageSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(2)} miles`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
            <p className="mt-4 text-gray-600">Loading wage data...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Wage Management</h1>
            <p className="mt-1 text-sm text-gray-500">Calculate and manage user wages based on distance traveled</p>
          </div>
          <div className="flex space-x-2">
            <ConnectionStatus />
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshMutation.isPending ? 'Syncing...' : 'Sync All'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{error.message}</div>
          </div>
        )}

        {/* Wage Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Wage Calculation Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate per Mile (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={wageSettings.ratePerMile}
                  onChange={(e) => handleWageSettingsChange('ratePerMile', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Allowance per Job (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={wageSettings.fuelAllowancePerJob}
                  onChange={(e) => handleWageSettingsChange('fuelAllowancePerJob', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                <strong>Current Settings:</strong> {formatCurrency(wageSettings.ratePerMile)} per mile + {formatCurrency(wageSettings.fuelAllowancePerJob)} fuel allowance per completed job
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-900">All Users</option>
                  {meterReaders.map((reader: any) => (
                    <option key={reader._id} value={reader._id} className="text-gray-900">
                      {reader.firstName} {reader.lastName} ({reader.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Wage Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-600">Total Users</div>
                <div className="text-2xl font-bold text-blue-900">{summary.totalUsers}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-600">Total Distance</div>
                <div className="text-2xl font-bold text-green-900">{formatDistance(summary.totalDistance)}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-yellow-600">Completed Jobs</div>
                <div className="text-2xl font-bold text-yellow-900">{summary.totalCompletedJobs}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-purple-600">Total Wage</div>
                <div className="text-2xl font-bold text-purple-900">{formatCurrency(summary.totalWage)}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-orange-600">Base Wage (Distance)</div>
                <div className="text-xl font-bold text-orange-900">{formatCurrency(summary.totalBaseWage)}</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-indigo-600">Fuel Allowance</div>
                <div className="text-xl font-bold text-indigo-900">{formatCurrency(summary.totalFuelAllowance)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Wage Details */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              User Wage Details
            </h3>
            {wageData.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No wage data found</div>
                <div className="text-sm text-gray-400 mt-2">
                  Adjust your filters or check if users have completed jobs
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {wageData.map((userData) => (
                  <div key={userData.user._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {userData.user.firstName} {userData.user.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">@{userData.user.username} • {userData.user.employeeId}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(userData.totalWage)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userData.completedJobs} completed • {formatDistance(userData.totalDistance)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-sm text-blue-600">Distance Wage</div>
                        <div className="text-lg font-semibold text-blue-900">
                          {formatCurrency(userData.baseWage)}
                        </div>
                        <div className="text-xs text-blue-500">
                          {formatDistance(userData.totalDistance)} × {formatCurrency(wageSettings.ratePerMile)}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded">
                        <div className="text-sm text-orange-600">Fuel Allowance</div>
                        <div className="text-lg font-semibold text-orange-900">
                          {formatCurrency(userData.fuelAllowance)}
                        </div>
                        <div className="text-xs text-orange-500">
                          {userData.completedJobs} jobs × {formatCurrency(wageSettings.fuelAllowancePerJob)}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-sm text-green-600">Total Wage</div>
                        <div className="text-lg font-semibold text-green-900">
                          {formatCurrency(userData.totalWage)}
                        </div>
                        <div className="text-xs text-green-500">
                          Avg: {formatDistance(userData.averageDistancePerJob)} per job
                        </div>
                      </div>
                    </div>

                    {userData.jobs.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Job Details</h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Wage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {userData.jobs.map((job) => (
                                <tr key={job._id}>
                                  <td className="px-3 py-2 text-gray-900 capitalize">{job.jobType || 'N/A'}</td>
                                  <td className="px-3 py-2 text-gray-900">
                                    {job.address ? `${job.address.street || ''}, ${job.address.city || ''}`.trim() || 'N/A' : (job.house ? `${job.house.address || ''}, ${job.house.city || ''}`.trim() || 'N/A' : 'N/A')}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      job.status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {job.status || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">{formatDistance(job.distanceTraveled || 0)}</td>
                                  <td className="px-3 py-2 text-gray-900">
                                    {job.completedDate ? formatDate(job.completedDate) : 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 text-gray-900 font-medium">
                                    {job.status === 'completed' && job.distanceTraveled !== undefined
                                      ? formatCurrency((job.distanceTraveled || 0) * wageSettings.ratePerMile + wageSettings.fuelAllowancePerJob)
                                      : 'N/A'
                                    }
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
 
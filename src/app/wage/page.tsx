'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { jobsAPI, usersAPI } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';

interface UserWageData {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  totalDistance: number;
  totalJobs: number;
  baseWage: number;
  fuelAllowance: number;
  totalWage: number;
  jobs: Array<{
    jobId: string;
    jobType: string;
    address: string;
    distance: number;
    completedDate: string;
    wage: number;
  }>;
}

interface WageCalculation {
  ratePerKm: number;
  fuelAllowancePerJob: number;
}

export default function WagePage() {
  const [wageData, setWageData] = useState<UserWageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wageSettings, setWageSettings] = useState<WageCalculation>({
    ratePerKm: 0.50, // £0.50 per kilometer
    fuelAllowancePerJob: 10.00, // £10 per job for fuel
  });
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchWageData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWageData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch mileage report from jobs API
      const mileageResponse = await jobsAPI.getMileageReport();
      const usersResponse = await usersAPI.getMeterUsers();
      
      if (mileageResponse.success && usersResponse.users) {
        const users = usersResponse.users;
        const mileageData = mileageResponse.data || [];
        
        // Calculate wages for each user
        const calculatedWages = users.map((user: any) => {
          const userMileage = mileageData.find((m: any) => m.userId === user._id);
          
          if (!userMileage) {
            return {
              userId: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              totalDistance: 0,
              totalJobs: 0,
              baseWage: 0,
              fuelAllowance: 0,
              totalWage: 0,
              jobs: [],
            };
          }

          const totalDistance = userMileage.totalDistance || 0;
          const totalJobs = userMileage.jobsCompleted || 0;
          const baseWage = totalDistance * wageSettings.ratePerKm;
          const fuelAllowance = totalJobs * wageSettings.fuelAllowancePerJob;
          const totalWage = baseWage + fuelAllowance;

          return {
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            totalDistance,
            totalJobs,
            baseWage,
            fuelAllowance,
            totalWage,
            jobs: userMileage.jobs?.map((job: any) => ({
              jobId: job._id,
              jobType: job.jobType,
              address: job.address?.street || 'Unknown',
              distance: job.distanceTraveled || 0,
              completedDate: job.completedDate || job.updatedAt,
              wage: (job.distanceTraveled || 0) * wageSettings.ratePerKm + wageSettings.fuelAllowancePerJob,
            })) || [],
          };
        });

        setWageData(calculatedWages);
      }
    } catch (error: any) {
      console.error('Error fetching wage data:', error);
      setError(`Failed to fetch wage data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWageSettingsChange = (field: keyof WageCalculation, value: number) => {
    setWageSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const recalculateWages = () => {
    const updatedWageData = wageData.map(userData => {
      const baseWage = userData.totalDistance * wageSettings.ratePerKm;
      const fuelAllowance = userData.totalJobs * wageSettings.fuelAllowancePerJob;
      const totalWage = baseWage + fuelAllowance;

      return {
        ...userData,
        baseWage,
        fuelAllowance,
        totalWage,
        jobs: userData.jobs.map(job => ({
          ...job,
          wage: job.distance * wageSettings.ratePerKm + wageSettings.fuelAllowancePerJob,
        })),
      };
    });

    setWageData(updatedWageData);
  };

  const filteredWageData = wageData.filter(userData => {
    const matchesUser = !selectedUser || userData.userId === selectedUser;
    const matchesDateRange = !dateRange.startDate || !dateRange.endDate || 
      userData.jobs.some(job => {
        const jobDate = new Date(job.completedDate);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        return jobDate >= startDate && jobDate <= endDate;
      });
    return matchesUser && matchesDateRange;
  });

  const totalWageAmount = filteredWageData.reduce((sum, userData) => sum + userData.totalWage, 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-2">Loading Wage Data...</div>
            <div className="text-sm text-gray-500">Calculating wages and fuel allowances</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Wage Management</h1>
            <p className="mt-1 text-sm text-gray-500">Calculate and manage user wages based on distance traveled</p>
          </div>
          <button
            onClick={fetchWageData}
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

        {/* Wage Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Wage Calculation Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate per Kilometer (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={wageSettings.ratePerKm}
                  onChange={(e) => handleWageSettingsChange('ratePerKm', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={recalculateWages}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
              >
                Recalculate Wages
              </button>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Users</option>
                  {wageData.map((userData) => (
                    <option key={userData.userId} value={userData.userId}>
                      {userData.firstName} {userData.lastName}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="text-2xl font-bold text-blue-900">{filteredWageData.length}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-600">Total Distance</div>
                <div className="text-2xl font-bold text-green-900">
                  {filteredWageData.reduce((sum, userData) => sum + userData.totalDistance, 0).toFixed(2)} km
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-yellow-600">Total Jobs</div>
                <div className="text-2xl font-bold text-yellow-900">
                  {filteredWageData.reduce((sum, userData) => sum + userData.totalJobs, 0)}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-purple-600">Total Wage</div>
                <div className="text-2xl font-bold text-purple-900">£{totalWageAmount.toFixed(2)}</div>
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
            {filteredWageData.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No wage data found</div>
                <div className="text-sm text-gray-400 mt-2">
                  Adjust your filters or check if users have completed jobs
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWageData.map((userData) => (
                  <div key={userData.userId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {userData.firstName} {userData.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">@{userData.username}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          £{userData.totalWage.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userData.totalJobs} jobs • {userData.totalDistance.toFixed(2)} km
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-sm text-blue-600">Distance Wage</div>
                        <div className="text-lg font-semibold text-blue-900">
                          £{userData.baseWage.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded">
                        <div className="text-sm text-orange-600">Fuel Allowance</div>
                        <div className="text-lg font-semibold text-orange-900">
                          £{userData.fuelAllowance.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-sm text-green-600">Total Wage</div>
                        <div className="text-lg font-semibold text-green-900">
                          £{userData.totalWage.toFixed(2)}
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
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Wage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {userData.jobs.map((job) => (
                                <tr key={job.jobId}>
                                  <td className="px-3 py-2 text-gray-900 capitalize">{job.jobType}</td>
                                  <td className="px-3 py-2 text-gray-900">{job.address}</td>
                                  <td className="px-3 py-2 text-gray-900">{job.distance.toFixed(2)} km</td>
                                  <td className="px-3 py-2 text-gray-900">
                                    {new Date(job.completedDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 text-gray-900 font-medium">
                                    £{job.wage.toFixed(2)}
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

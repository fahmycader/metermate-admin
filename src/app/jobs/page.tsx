'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { jobsAPI, usersAPI } from '@/lib/api';
import { CustomTextInput, CustomNumberInput } from '@/components/CustomInput';
import { JobTypeSelect, UserSelect, PrioritySelect, StatusSelect } from '@/components/JobDropdowns';
import AdminLayout from '@/components/AdminLayout';
import DeleteDialog from '@/components/DeleteDialog';

interface Job {
  _id: string;
  jobType: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  assignedTo: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    department: string;
  };
  status: string;
  priority: string;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  meterReadings?: {
    electric?: number;
    gas?: number;
    water?: number;
  };
  photos?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  department: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    job: Job | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    job: null,
    isLoading: false,
  });
  const [filters, setFilters] = useState({
    status: '',
    jobType: '',
    priority: '',
    assignedTo: '',
  });
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    jobType: 'electricity',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    assignedTo: '',
    priority: 'medium',
    status: 'pending',
    scheduledDate: '',
    notes: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchUsers();
    }
  }, [user]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchJobs();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await jobsAPI.getJobs(filters);
      setJobs(response.jobs || []);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      setError(`Failed to fetch jobs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getMeterUsers();
      setUsers(response.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    console.log('Validating form data:', formData);

    if (!formData.jobType.trim()) {
      errors.jobType = 'Job type is required';
    }

    if (!formData.address.street.trim()) {
      errors.street = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.address.state.trim()) {
      errors.state = 'State is required';
    }

    if (!formData.address.zipCode.trim()) {
      errors.zipCode = 'Zip code is required';
    }

    if (!formData.assignedTo || formData.assignedTo.trim() === '') {
      errors.assignedTo = 'Assigned user is required';
    }

    if (!formData.scheduledDate.trim()) {
      errors.scheduledDate = 'Scheduled date is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    try {
      setError('');
      if (editingJob) {
        await jobsAPI.updateJob(editingJob._id, formData);
        setEditingJob(null);
      } else {
        await jobsAPI.createJob(formData);
      }
      
      resetForm();
      fetchJobs();
    } catch (error: any) {
      setError(error.message || 'Failed to save job');
    }
  };

  const resetForm = () => {
    setFormData({
      jobType: 'electricity',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
      },
      assignedTo: '',
      priority: 'medium',
      status: 'pending',
      scheduledDate: '',
      notes: '',
    });
    setValidationErrors({});
    setShowCreateForm(false);
    setEditingJob(null);
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      jobType: job.jobType,
      address: job.address,
      assignedTo: job.assignedTo._id,
      priority: job.priority,
      status: job.status,
      scheduledDate: job.scheduledDate.split('T')[0],
      notes: job.notes || '',
    });
    setShowCreateForm(true);
  };

  const handleDeleteJob = (jobToDelete: Job) => {
    setDeleteDialog({
      isOpen: true,
      job: jobToDelete,
      isLoading: false,
    });
  };

  const confirmDeleteJob = async () => {
    if (!deleteDialog.job) return;

    setDeleteDialog(prev => ({ ...prev, isLoading: true }));

    try {
      await jobsAPI.deleteJob(deleteDialog.job._id);
      
      // Remove job from local state
      setJobs(prev => prev.filter(j => j._id !== deleteDialog.job!._id));
      
      // Close dialog
      setDeleteDialog({
        isOpen: false,
        job: null,
        isLoading: false,
      });

      // Show success message
      setError('');
    } catch (error: any) {
      console.error('Error deleting job:', error);
      setError(`Failed to delete job: ${error.message}`);
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      job: null,
      isLoading: false,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'electricity': return '⚡';
      case 'gas': return '🔥';
      case 'water': return '💧';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-2">Loading Jobs...</div>
            <div className="text-sm text-gray-500">Fetching job data from database</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
          <p className="mt-1 text-sm text-gray-500">Create, assign, and manage meter reading jobs</p>
        </div>
          
          {/* Filters */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatusSelect
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="col-span-1"
                />
                <JobTypeSelect
                  value={filters.jobType}
                  onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                  className="col-span-1"
                />
                <PrioritySelect
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="col-span-1"
                />
                <UserSelect
                  value={filters.assignedTo}
                  onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                  users={users}
                  className="col-span-1"
                />
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={fetchJobs}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    setFilters({ status: '', jobType: '', priority: '', assignedTo: '' });
                    fetchJobs();
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Create/Edit Job Form */}
          {showCreateForm && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {editingJob ? 'Edit Job' : 'Create New Job'}
                </h3>
                
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-600">{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <JobTypeSelect
                      value={formData.jobType}
                      onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                      error={validationErrors.jobType}
                    />
                    
                    <UserSelect
                      value={formData.assignedTo}
                      onChange={(e) => {
                        console.log('UserSelect changed to:', e.target.value);
                        setFormData({ ...formData, assignedTo: e.target.value });
                        // Clear validation error when user selects a value
                        if (validationErrors.assignedTo) {
                          setValidationErrors({ ...validationErrors, assignedTo: '' });
                        }
                      }}
                      users={users}
                      error={validationErrors.assignedTo}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Address Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CustomTextInput
                        id="street"
                        name="street"
                        type="text"
                        label="Street Address"
                        value={formData.address.street}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, street: e.target.value }
                        })}
                        required
                        error={validationErrors.street}
                      />
                      
                      <CustomTextInput
                        id="city"
                        name="city"
                        type="text"
                        label="City"
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value }
                        })}
                        required
                        error={validationErrors.city}
                      />
                      
                      <CustomTextInput
                        id="state"
                        name="state"
                        type="text"
                        label="State"
                        value={formData.address.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value }
                        })}
                        required
                        error={validationErrors.state}
                      />
                      
                      <CustomTextInput
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        label="Zip Code"
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, zipCode: e.target.value }
                        })}
                        required
                        error={validationErrors.zipCode}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PrioritySelect
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    />
                    
                    <StatusSelect
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    />
                    
                    <CustomTextInput
                      id="scheduledDate"
                      name="scheduledDate"
                      type="date"
                      label="Scheduled Date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      required
                      error={validationErrors.scheduledDate}
                    />
                  </div>

                  <CustomTextInput
                    id="notes"
                    name="notes"
                    type="text"
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                    >
                      {editingJob ? 'Update Job' : 'Create Job'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Jobs List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Jobs ({jobs.length})
                  </h3>
                  {lastUpdated && (
                    <p className="text-sm text-gray-500 mt-1">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={fetchJobs}
                    disabled={loading}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                  >
                    Create New Job
                  </button>
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No jobs found</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Create a new job or adjust your filters
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scheduled
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs.map((job) => (
                        <tr key={job._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{getJobTypeIcon(job.jobType)}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900 capitalize">
                                  {job.jobType}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {job._id.slice(-8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {job.address.street}
                            </div>
                            <div className="text-sm text-gray-500">
                              {job.address.city}, {job.address.state} {job.address.zipCode}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {job.assignedTo ? `${job.assignedTo.firstName} ${job.assignedTo.lastName}` : 'Unassigned'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {job.assignedTo ? `@${job.assignedTo.username}` : 'No user assigned'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                              {job.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(job.priority)}`}>
                              {job.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(job.scheduledDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(job)}
                                className="text-indigo-600 hover:text-indigo-900 text-sm"
                                title="Edit Job"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job)}
                                className="text-red-600 hover:text-red-900 text-sm"
                                title="Delete Job"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteJob}
        title="Delete Job"
        itemName={deleteDialog.job ? `${deleteDialog.job.jobType} job at ${deleteDialog.job.address.street}` : ''}
        isLoading={deleteDialog.isLoading}
      />
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs, useMeterUsers, useRefreshData } from '@/hooks/useData';
import { jobsAPI } from '@/lib/api';
import { CustomTextInput, CustomNumberInput } from '@/components/CustomInput';
import { JobTypeSelect, UserSelect, PrioritySelect, StatusSelect } from '@/components/JobDropdowns';
import AdminLayout from '@/components/AdminLayout';
import DeleteDialog from '@/components/DeleteDialog';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface Job {
  _id: string;
  jobType?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  house?: {
    address?: string;
    city?: string;
    county?: string;
    postcode?: string;
  };
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    department: string;
  };
  status?: string;
  priority?: string;
  scheduledDate?: string;
  sequenceNumber?: number | null;
  completedDate?: string;
  notes?: string;
  sup?: string;
  jt?: string;
  cust?: string;
  meterMake?: string;
  meterModel?: string;
  meterSerialNumber?: string;
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelUploadData, setExcelUploadData] = useState({
    assignedTo: '',
    scheduledDate: '',
    priority: 'medium',
  });
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
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
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{
    isOpen: boolean;
    count: number;
    isLoading: boolean;
  }>({
    isOpen: false,
    count: 0,
    isLoading: false,
  });
  const [deleteUserJobsDialog, setDeleteUserJobsDialog] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    userId: null,
    userName: '',
    isLoading: false,
  });
  const [filters, setFilters] = useState({
    status: '',
    jobType: '',
    priority: '',
    assignedTo: '',
  });
  const [submitError, setSubmitError] = useState('');
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    jobType: 'electricity',
    address: {
      street: '',
      city: '',
      state: '',
      postcode: '',
      country: 'USA',
    },
    assignedTo: '',
    priority: 'medium',
    status: 'pending',
    scheduledDate: '',
    notes: '',
    sup: '',
    jt: '',
    cust: '',
    meterMake: '',
    meterModel: '',
    meterSerialNumber: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data: jobsResponse, isLoading, error, refetch } = useJobs(filters);
  const { data: usersResponse } = useMeterUsers();
  const refreshMutation = useRefreshData();

  const jobs = jobsResponse?.jobs || [];
  const users = usersResponse?.users || [];

  useEffect(() => {
    if (jobsResponse) {
      setLastUpdated(new Date());
    }
  }, [jobsResponse]);

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

    if (!formData.address.postcode.trim()) {
      errors.postcode = 'Postcode is required';
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
      setSubmitError('');
      if (editingJob) {
        await jobsAPI.updateJob(editingJob._id, formData);
        setEditingJob(null);
      } else {
        await jobsAPI.createJob(formData);
      }
      
      resetForm();
      setShowCreateForm(false);
      refetch();
    } catch (err: any) {
      console.error('Job creation error:', err);
      // Extract error message from response
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to save job';
      setSubmitError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      jobType: 'electricity',
      address: {
        street: '',
        city: '',
        state: '',
        postcode: '',
        country: 'USA',
      },
      assignedTo: '',
      priority: 'medium',
      status: 'pending',
      scheduledDate: '',
      notes: '',
      sup: '',
      jt: '',
      cust: '',
      meterMake: '',
      meterModel: '',
      meterSerialNumber: '',
    });
    setValidationErrors({});
    setShowCreateForm(false);
    setEditingJob(null);
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      jobType: job.jobType || 'electricity',
      address: job.address || (job.house ? {
        street: job.house.address || '',
        city: job.house.city || '',
        state: job.house.county || '',
        postcode: job.house.postcode || '',
      } : {
        street: '',
        city: '',
        state: '',
        postcode: '',
      }),
      assignedTo: job.assignedTo?._id || '',
      priority: job.priority || 'medium',
      status: job.status || 'pending',
      scheduledDate: job.scheduledDate ? job.scheduledDate.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: job.notes || '',
      sup: job.sup || '',
      jt: job.jt || '',
      cust: job.cust || '',
      meterMake: job.meterMake || '',
      meterModel: job.meterModel || '',
      meterSerialNumber: job.meterSerialNumber || '',
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
      
      // Refresh the jobs list
      refetch();
      
      // Close dialog
      setDeleteDialog({
        isOpen: false,
        job: null,
        isLoading: false,
      });

      // Clear selection if deleted job was selected
      setSelectedJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(deleteDialog.job!._id);
        return newSet;
      });

      // Show success message
      setSubmitError('');
    } catch (err: any) {
      console.error('Error deleting job:', err);
      setSubmitError(`Failed to delete job: ${err.message}`);
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobs.map((job: Job) => job._id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedJobs.size === 0) return;
    setBulkDeleteDialog({
      isOpen: true,
      count: selectedJobs.size,
      isLoading: false,
    });
  };

  const confirmBulkDelete = async () => {
    if (selectedJobs.size === 0) return;

    setBulkDeleteDialog(prev => ({ ...prev, isLoading: true }));

    try {
      await jobsAPI.deleteJobsBulk(Array.from(selectedJobs));
      
      // Refresh the jobs list
      refetch();
      
      // Clear selection
      setSelectedJobs(new Set());
      
      // Close dialog
      setBulkDeleteDialog({
        isOpen: false,
        count: 0,
        isLoading: false,
      });

      // Show success message
      setSubmitError('');
    } catch (err: any) {
      console.error('Error deleting jobs:', err);
      setSubmitError(`Failed to delete jobs: ${err.message}`);
      setBulkDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteUserJobs = () => {
    const userId = filters.assignedTo;
    if (!userId) return;

    const user = users.find((u: User) => u._id === userId);
    const userName = user ? `${user.firstName} ${user.lastName}` : 'this user';

    setDeleteUserJobsDialog({
      isOpen: true,
      userId,
      userName,
      isLoading: false,
    });
  };

  const confirmDeleteUserJobs = async () => {
    if (!deleteUserJobsDialog.userId) return;

    setDeleteUserJobsDialog(prev => ({ ...prev, isLoading: true }));

    try {
      await jobsAPI.deleteUserJobs(deleteUserJobsDialog.userId);
      
      // Refresh the jobs list
      refetch();
      
      // Clear selection
      setSelectedJobs(new Set());
      
      // Close dialog
      setDeleteUserJobsDialog({
        isOpen: false,
        userId: null,
        userName: '',
        isLoading: false,
      });

      // Show success message
      setSubmitError('');
    } catch (err: any) {
      console.error('Error deleting user jobs:', err);
      setSubmitError(`Failed to delete user jobs: ${err.message}`);
      setDeleteUserJobsDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      job: null,
      isLoading: false,
    });
  };

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!excelFile) {
      setSubmitError('Please select an Excel file');
      return;
    }

    if (!excelUploadData.assignedTo) {
      setSubmitError('Please select an assigned user');
      return;
    }

    if (!excelUploadData.scheduledDate) {
      setSubmitError('Please select a scheduled date');
      return;
    }

    try {
      setIsUploadingExcel(true);
      setSubmitError('');
      const result = await jobsAPI.uploadExcel(
        excelFile,
        excelUploadData.assignedTo,
        excelUploadData.scheduledDate,
        excelUploadData.priority
      );
      
      setShowExcelUpload(false);
      setExcelFile(null);
      setExcelUploadData({ assignedTo: '', scheduledDate: '', priority: 'medium' });
      refetch();
      alert(`Successfully uploaded ${result.count} jobs ordered by location!`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to upload Excel file');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeIcon = (jobType: string | undefined) => {
    if (!jobType) return '';
    switch (jobType) {
      case 'electricity': return '';
      case 'gas': return '';
      case 'water': return '';
      default: return '';
    }
  };

  if (isLoading) {
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
                  onClick={() => refetch()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    setFilters({ status: '', jobType: '', priority: '', assignedTo: '' });
                    refetch();
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Excel Upload Form */}
          {showExcelUpload && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Upload Excel File with Job Details
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload an Excel file (.xlsx, .xls, .csv) with job details. Jobs will be automatically ordered by nearest location and numbered sequentially.
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Required columns: street, city, state, postcode (optional: jobType, sup, jt, cust, meterMake, meterModel, meterSerialNumber, notes, priority)
                </p>
                
                {submitError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-600">{submitError}</div>
                  </div>
                )}

                <form onSubmit={handleExcelUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Excel File
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UserSelect
                      value={excelUploadData.assignedTo}
                      onChange={(e) => setExcelUploadData({ ...excelUploadData, assignedTo: e.target.value })}
                      users={users}
                      error={excelUploadData.assignedTo ? '' : 'Required'}
                    />
                    
                    <CustomTextInput
                      id="excelScheduledDate"
                      name="excelScheduledDate"
                      type="date"
                      label="Scheduled Date"
                      value={excelUploadData.scheduledDate}
                      onChange={(e) => setExcelUploadData({ ...excelUploadData, scheduledDate: e.target.value })}
                      required
                    />
                    
                    <PrioritySelect
                      value={excelUploadData.priority}
                      onChange={(e) => setExcelUploadData({ ...excelUploadData, priority: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExcelUpload(false);
                        setExcelFile(null);
                        setExcelUploadData({ assignedTo: '', scheduledDate: '', priority: 'medium' });
                        setSubmitError('');
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploadingExcel}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center"
                    >
                      {isUploadingExcel ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        'Upload & Create Jobs'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Create/Edit Job Form */}
          {showCreateForm && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {editingJob ? 'Edit Job' : 'Create New Job'}
                </h3>
                
                {(error?.message || submitError) && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-600">{error?.message || submitError}</div>
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
                        // Clear validation error?.message when user selects a value
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
                        id="postcode"
                        name="postcode"
                        type="text"
                        label="Postcode"
                        value={formData.address.postcode}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, postcode: e.target.value }
                        })}
                        required
                        error={validationErrors.postcode}
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CustomTextInput
                      id="sup"
                      name="sup"
                      type="text"
                      label="Supplier (Sup)"
                      value={formData.sup}
                      onChange={(e) => setFormData({ ...formData, sup: e.target.value })}
                      placeholder="Enter supplier name"
                    />
                    
                    <CustomTextInput
                      id="jt"
                      name="jt"
                      type="text"
                      label="Job Title (JT)"
                      value={formData.jt}
                      onChange={(e) => setFormData({ ...formData, jt: e.target.value })}
                      placeholder="Enter job title"
                    />
                    
                    <CustomTextInput
                      id="cust"
                      name="cust"
                      type="text"
                      label="Customer (Cust)"
                      value={formData.cust}
                      onChange={(e) => setFormData({ ...formData, cust: e.target.value })}
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Meter Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <CustomTextInput
                        id="meterMake"
                        name="meterMake"
                        type="text"
                        label="Meter Make"
                        value={formData.meterMake}
                        onChange={(e) => setFormData({ ...formData, meterMake: e.target.value })}
                        placeholder="Enter meter make"
                      />
                      
                      <CustomTextInput
                        id="meterModel"
                        name="meterModel"
                        type="text"
                        label="Meter Model"
                        value={formData.meterModel}
                        onChange={(e) => setFormData({ ...formData, meterModel: e.target.value })}
                        placeholder="Enter meter model"
                      />
                      
                      <CustomTextInput
                        id="meterSerialNumber"
                        name="meterSerialNumber"
                        type="text"
                        label="Meter Serial Number"
                        value={formData.meterSerialNumber}
                        onChange={(e) => setFormData({ ...formData, meterSerialNumber: e.target.value })}
                        placeholder="Enter meter serial number"
                      />
                    </div>
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
                  {selectedJobs.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Selected ({selectedJobs.size})
                    </button>
                  )}
                  {filters.assignedTo && (
                    <button
                      onClick={handleDeleteUserJobs}
                      className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm hover:bg-orange-700 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete All Jobs for User
                    </button>
                  )}
                  <button
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={() => setShowExcelUpload(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Excel
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
                          <input
                            type="checkbox"
                            checked={selectedJobs.size === jobs.length && jobs.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
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
                          Additional Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs.map((job: Job) => (
                        <tr key={job._id} className={selectedJobs.has(job._id) ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedJobs.has(job._id)}
                              onChange={() => handleSelectJob(job._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{getJobTypeIcon(job.jobType)}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900 capitalize">
                                  {job.jobType || 'N/A'}
                                  {job.sequenceNumber !== null && job.sequenceNumber !== undefined && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      #{job.sequenceNumber}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {job._id ? job._id.slice(-8) : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {job.address ? (
                              <>
                                <div className="text-sm text-gray-900">
                                  {job.address.street || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {[job.address.city, job.address.state, job.address.postcode].filter(Boolean).join(', ') || 'N/A'}
                                </div>
                              </>
                            ) : job.house ? (
                              <>
                                <div className="text-sm text-gray-900">
                                  {job.house.address || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {[job.house.city, job.house.county, job.house.postcode].filter(Boolean).join(', ') || 'N/A'}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-500">Address not available</div>
                            )}
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
                              {job.status ? job.status.replace('_', ' ') : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(job.priority)}`}>
                              {job.priority || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {job.sup && <div>Sup: {job.sup}</div>}
                              {job.jt && <div>JT: {job.jt}</div>}
                              {job.cust && <div>Cust: {job.cust}</div>}
                            </div>
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
        itemName={deleteDialog.job ? `${deleteDialog.job.jobType} job at ${deleteDialog.job.address?.street || deleteDialog.job.house?.address || 'unknown location'}` : ''}
        isLoading={deleteDialog.isLoading}
      />

      {/* Bulk Delete Dialog */}
      <DeleteDialog
        isOpen={bulkDeleteDialog.isOpen}
        onClose={() => setBulkDeleteDialog({ isOpen: false, count: 0, isLoading: false })}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Jobs"
        itemName={`${bulkDeleteDialog.count} job(s)`}
        isLoading={bulkDeleteDialog.isLoading}
      />

      {/* Delete User Jobs Dialog */}
      <DeleteDialog
        isOpen={deleteUserJobsDialog.isOpen}
        onClose={() => setDeleteUserJobsDialog({ isOpen: false, userId: null, userName: '', isLoading: false })}
        onConfirm={confirmDeleteUserJobs}
        title="Delete All Jobs for User"
        itemName={`all jobs assigned to ${deleteUserJobsDialog.userName}`}
        isLoading={deleteUserJobsDialog.isLoading}
      />
    </AdminLayout>
  );
}

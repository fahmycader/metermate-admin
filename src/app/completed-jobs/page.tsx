'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI, jobsAPI } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { ConnectionStatus } from '@/components/ConnectionStatus';

const API_BASE_URL = 'http://localhost:3001/api';

// Helper to get auth token for photo requests
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

interface CompletedJob {
  _id: string;
  jobId?: string;
  jobType?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  house?: {
    address?: string;
    postcode?: string;
    city?: string;
    county?: string;
  };
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    employeeId?: string;
    department?: string;
  };
  status?: string;
  priority?: string;
  scheduledDate?: string;
  completedDate?: string;
  sequenceNumber?: number | null;
  notes?: string;
  meterReadings?: {
    electric?: number | string;
    gas?: number | string;
    water?: number | string;
    reg1?: number | string;
  };
  registerValues?: (number | string)[];
  registerIds?: string[];
  photos?: string[];
  meterPhotos?: Array<{
    meterType: string;
    photoUrl: string;
    serialNumber?: string;
    reading?: number;
    timestamp?: Date;
  }>;
  startLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  distanceTraveled?: number;
  points?: number;
  validNoAccess?: boolean;
  noAccessReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Operator {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  employeeId?: string;
}

export default function CompletedJobsPage() {
  const { user } = useAuth();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CompletedJob | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [expandedPhotos, setExpandedPhotos] = useState<string | null>(null);

  useEffect(() => {
    loadOperators();
  }, []);

  useEffect(() => {
    if (selectedOperatorId) {
      loadCompletedJobs(selectedOperatorId);
    } else {
      setCompletedJobs([]);
    }
  }, [selectedOperatorId]);

  const loadOperators = async () => {
    try {
      // Try getMeterUsers first (for meter department), fallback to getMeterReaders
      let response;
      try {
        response = await usersAPI.getMeterUsers();
        if (response.users && response.users.length > 0) {
          setOperators(response.users || []);
          return;
        }
      } catch (e) {
        console.log('getMeterUsers failed, trying getMeterReaders:', e);
      }
      
      // Fallback to getMeterReaders (role-based)
      response = await usersAPI.getMeterReaders();
      setOperators(response.users || []);
    } catch (error) {
      console.error('Error loading operators:', error);
      // Set empty array on error to prevent UI issues
      setOperators([]);
    }
  };

  const loadCompletedJobs = async (operatorId: string) => {
    setIsLoading(true);
    try {
      const response = await jobsAPI.getCompletedJobsByOperator(operatorId);
      const jobs = response.jobs || [];
      // Debug: Log photos data
      console.log('Loaded jobs:', jobs.length);
      jobs.forEach((job: any, index: number) => {
        console.log(`Job ${index + 1} (${job._id}):`, {
          photos: job.photos,
          photosLength: job.photos?.length || 0,
          meterPhotos: job.meterPhotos,
          meterPhotosLength: job.meterPhotos?.length || 0,
        });
      });
      setCompletedJobs(jobs);
    } catch (error) {
      console.error('Error loading completed jobs:', error);
      setCompletedJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getPhotoUrl = (photoPath: string) => {
    if (!photoPath || photoPath.trim() === '') {
      return '';
    }
    
    // If it's already a full URL, return as is
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    // Extract just the filename if it's a full path
    let filename = photoPath;
    if (photoPath.includes('/')) {
      filename = photoPath.split('/').pop() || photoPath;
    }
    
    // Construct URL using the upload endpoint with token
    const token = getAuthToken();
    const url = `${API_BASE_URL}/upload/meter-photos/${filename}`;
    
    // For now, return the URL - the API will handle auth via interceptors
    return url;
  };

  const getAllPhotos = (job: CompletedJob) => {
    const photos: Array<{ url: string; label: string; type?: string }> = [];
    
    // Debug logging
    console.log('Getting photos for job:', job._id, {
      hasPhotos: !!job.photos,
      photosArray: job.photos,
      photosLength: job.photos?.length || 0,
      hasMeterPhotos: !!job.meterPhotos,
      meterPhotosArray: job.meterPhotos,
      meterPhotosLength: job.meterPhotos?.length || 0,
      jobKeys: Object.keys(job),
    });
    
    // Add photos from photos array
    if (job.photos && Array.isArray(job.photos) && job.photos.length > 0) {
      job.photos.forEach((photo, index) => {
        if (photo && typeof photo === 'string' && photo.trim() !== '') {
          const photoUrl = getPhotoUrl(photo);
          console.log(`Photo ${index + 1} URL:`, photoUrl);
          photos.push({
            url: photoUrl,
            label: `Photo ${index + 1}`,
          });
        }
      });
    }
    
    // Add photos from meterPhotos array
    if (job.meterPhotos && Array.isArray(job.meterPhotos) && job.meterPhotos.length > 0) {
      job.meterPhotos.forEach((meterPhoto, index) => {
        if (meterPhoto && typeof meterPhoto === 'object' && meterPhoto.photoUrl && meterPhoto.photoUrl.trim() !== '') {
          const photoUrl = getPhotoUrl(meterPhoto.photoUrl);
          console.log(`Meter Photo ${index + 1} URL:`, photoUrl);
          photos.push({
            url: photoUrl,
            label: `${meterPhoto.meterType || 'Meter'} Photo ${index + 1}${meterPhoto.serialNumber ? ` - ${meterPhoto.serialNumber}` : ''}`,
            type: meterPhoto.meterType,
          });
        }
      });
    }
    
    console.log('Total photos found:', photos.length, 'URLs:', photos.map(p => p.url));
    return photos;
  };

  const formatAddress = (job: CompletedJob) => {
    if (job.address?.street) {
      return `${job.address.street}, ${job.address.city || ''}, ${job.address.state || ''} ${job.address.zipCode || ''}`.trim();
    }
    if (job.house?.address) {
      return `${job.house.address}, ${job.house.city || ''}, ${job.house.county || ''} ${job.house.postcode || ''}`.trim();
    }
    return 'Address not available';
  };

  const viewJobDetails = (job: CompletedJob) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Completed Jobs</h1>
            <p className="mt-2 text-sm text-gray-600">
              View all completed jobs by operator
            </p>
          </div>
          <ConnectionStatus />
        </div>

        {/* Operator Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <label htmlFor="operator" className="block text-sm font-medium text-gray-700 mb-2">
            Select Operator
          </label>
          <select
            id="operator"
            value={selectedOperatorId}
            onChange={(e) => setSelectedOperatorId(e.target.value)}
            className="block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select an operator --</option>
            {operators.map((operator) => (
              <option key={operator._id} value={operator._id}>
                {operator.employeeId ? `${operator.employeeId} - ` : ''}
                {operator.firstName} {operator.lastName} ({operator.username})
              </option>
            ))}
          </select>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading completed jobs...</p>
          </div>
        ) : selectedOperatorId && completedJobs.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-600">No completed jobs found for this operator.</p>
          </div>
        ) : selectedOperatorId && completedJobs.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {completedJobs.length} Completed Job{completedJobs.length !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {completedJobs.map((job) => (
                <div key={job._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {job.jobType ? job.jobType.toUpperCase() : 'N/A'}
                        </span>
                        {job.sequenceNumber && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Sequence #{job.sequenceNumber}
                          </span>
                        )}
                        {job.jobId && (
                          <span className="text-sm text-gray-500">Job ID: {job.jobId}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {formatAddress(job)}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                        <div>
                          <span className="font-medium">Scheduled:</span> {formatDate(job.scheduledDate)}
                        </div>
                        <div>
                          <span className="font-medium">Completed:</span> {formatDate(job.completedDate)}
                        </div>
                        <div>
                          <span className="font-medium">Priority:</span> {job.priority || 'N/A'}
                        </div>
                        {job.points !== undefined && (
                          <div>
                            <span className="font-medium">Points:</span> {job.points}
                          </div>
                        )}
                        {(() => {
                          const photoCount = getAllPhotos(job).length;
                          return photoCount > 0 ? (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium text-blue-600">{photoCount} Photo{photoCount !== 1 ? 's' : ''}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                      {job.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {job.notes}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => viewJobDetails(job)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      {(() => {
                        const photoCount = getAllPhotos(job).length;
                        return photoCount > 0 ? (
                          <button
                            onClick={() => {
                              viewJobDetails(job);
                              // Scroll to photos section after modal opens
                              setTimeout(() => {
                                const photosSection = document.querySelector('[data-photos-section]');
                                if (photosSection) {
                                  photosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            View Photos ({photoCount})
                          </button>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Job Details Modal */}
        {showJobDetails && selectedJob && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
                <button
                  onClick={() => {
                    setShowJobDetails(false);
                    setSelectedJob(null);
                    setExpandedPhotos(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Basic Information */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Job Type:</span>
                      <span className="ml-2 text-gray-900">{selectedJob.jobType || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className="ml-2 text-gray-900">{selectedJob.status || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Priority:</span>
                      <span className="ml-2 text-gray-900">{selectedJob.priority || 'N/A'}</span>
                    </div>
                    {selectedJob.sequenceNumber && (
                      <div>
                        <span className="font-medium text-gray-700">Sequence Number:</span>
                        <span className="ml-2 text-gray-900">{selectedJob.sequenceNumber}</span>
                      </div>
                    )}
                    {selectedJob.jobId && (
                      <div>
                        <span className="font-medium text-gray-700">Job ID:</span>
                        <span className="ml-2 text-gray-900">{selectedJob.jobId}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Scheduled Date:</span>
                      <span className="ml-2 text-gray-900">{formatDate(selectedJob.scheduledDate)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Completed Date:</span>
                      <span className="ml-2 text-gray-900">{formatDate(selectedJob.completedDate)}</span>
                    </div>
                    {selectedJob.points !== undefined && (
                      <div>
                        <span className="font-medium text-gray-700">Points:</span>
                        <span className="ml-2 text-gray-900">{selectedJob.points}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Address</h3>
                  <p className="text-sm text-gray-900">{formatAddress(selectedJob)}</p>
                </div>

                {/* Operator Information */}
                {selectedJob.assignedTo && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Operator</h3>
                    <div className="text-sm text-gray-900">
                      <p>
                        {selectedJob.assignedTo.firstName || ''} {selectedJob.assignedTo.lastName || ''}
                      </p>
                      <p className="text-gray-600">
                        {selectedJob.assignedTo.employeeId && `ID: ${selectedJob.assignedTo.employeeId} | `}
                        Username: {selectedJob.assignedTo.username || 'N/A'}
                      </p>
                      {selectedJob.assignedTo.department && (
                        <p className="text-gray-600">Department: {selectedJob.assignedTo.department}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Meter Readings */}
                {(selectedJob.meterReadings || selectedJob.registerValues || selectedJob.registerIds) && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Meter Readings</h3>
                    {selectedJob.meterReadings && (
                      <div className="space-y-2 text-sm">
                        {selectedJob.meterReadings.electric !== undefined && selectedJob.meterReadings.electric !== '' && (
                          <div>
                            <span className="font-medium text-gray-700">Electric:</span>
                            <span className="ml-2 text-gray-900">{selectedJob.meterReadings.electric}</span>
                          </div>
                        )}
                        {selectedJob.meterReadings.gas !== undefined && selectedJob.meterReadings.gas !== '' && (
                          <div>
                            <span className="font-medium text-gray-700">Gas:</span>
                            <span className="ml-2 text-gray-900">{selectedJob.meterReadings.gas}</span>
                          </div>
                        )}
                        {selectedJob.meterReadings.water !== undefined && selectedJob.meterReadings.water !== '' && (
                          <div>
                            <span className="font-medium text-gray-700">Water:</span>
                            <span className="ml-2 text-gray-900">{selectedJob.meterReadings.water}</span>
                          </div>
                        )}
                        {selectedJob.meterReadings.reg1 !== undefined && selectedJob.meterReadings.reg1 !== '' && (
                          <div>
                            <span className="font-medium text-gray-700">Reg1:</span>
                            <span className="ml-2 text-gray-900">{selectedJob.meterReadings.reg1}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedJob.registerValues && selectedJob.registerValues.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700">Register Values:</span>
                        <div className="mt-1 space-y-1">
                          {selectedJob.registerValues.map((value, index) => (
                            <div key={index} className="text-sm text-gray-900">
                              Register {index + 1}: {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedJob.registerIds && selectedJob.registerIds.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700">Register IDs:</span>
                        <div className="mt-1 space-y-1">
                          {selectedJob.registerIds.map((id, index) => (
                            <div key={index} className="text-sm text-gray-900">
                              Register {index + 1} ID: {id}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No Access Information */}
                {selectedJob.validNoAccess && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">No Access Information</h3>
                    <div className="text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Reason:</span>
                        <span className="ml-2 text-gray-900">{selectedJob.noAccessReason || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Information */}
                {(selectedJob.startLocation || selectedJob.endLocation || selectedJob.distanceTraveled) && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Information</h3>
                    <div className="space-y-2 text-sm">
                      {selectedJob.startLocation && (
                        <div>
                          <span className="font-medium text-gray-700">Start Location:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedJob.startLocation.latitude.toFixed(6)}, {selectedJob.startLocation.longitude.toFixed(6)}
                          </span>
                          {selectedJob.startLocation.timestamp && (
                            <span className="ml-2 text-gray-600">
                              ({formatDate(selectedJob.startLocation.timestamp.toString())})
                            </span>
                          )}
                        </div>
                      )}
                      {selectedJob.endLocation && (
                        <div>
                          <span className="font-medium text-gray-700">End Location:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedJob.endLocation.latitude.toFixed(6)}, {selectedJob.endLocation.longitude.toFixed(6)}
                          </span>
                          {selectedJob.endLocation.timestamp && (
                            <span className="ml-2 text-gray-600">
                              ({formatDate(selectedJob.endLocation.timestamp.toString())})
                            </span>
                          )}
                        </div>
                      )}
                      {selectedJob.distanceTraveled !== undefined && (
                        <div>
                          <span className="font-medium text-gray-700">Distance Traveled:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedJob.distanceTraveled.toFixed(2)} km
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Photos */}
                {(() => {
                  const allPhotos = getAllPhotos(selectedJob);
                  return allPhotos.length > 0 ? (
                    <div className="border-b pb-4" data-photos-section>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Photos ({allPhotos.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {allPhotos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo.url}
                              alt={photo.label}
                              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity border-2 border-gray-200"
                              onClick={() => setExpandedPhotos(expandedPhotos === photo.url ? null : photo.url)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                console.error('Failed to load photo:', photo.url);
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center';
                                  errorDiv.innerHTML = `
                                    <div class="text-center">
                                      <svg class="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <p class="text-xs text-gray-500">Photo unavailable</p>
                                    </div>
                                  `;
                                  parent.appendChild(errorDiv);
                                }
                              }}
                            />
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                              {photo.label}
                            </div>
                            {photo.type && (
                              <div className="absolute top-2 right-2 bg-blue-600 bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                                {photo.type}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                              <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500 italic">
                        Click on any photo to view in full size
                      </p>
                    </div>
                  ) : null;
                })()}

                {/* Notes */}
                {selectedJob.notes && (
                  <div className="pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedJob.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expanded Photo Modal */}
        {expandedPhotos && selectedJob && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedPhotos(null)}
          >
            <div className="relative max-w-6xl max-h-full w-full">
              <img
                src={expandedPhotos}
                alt="Expanded photo"
                className="max-w-full max-h-[90vh] object-contain mx-auto rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                crossOrigin="anonymous"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.error('Failed to load expanded photo:', expandedPhotos);
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-96 bg-gray-800 rounded-lg flex items-center justify-center">
                        <div class="text-center text-white">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p class="text-lg">Photo not available</p>
                          <p class="text-sm text-gray-400 mt-2">Unable to load image</p>
                        </div>
                      </div>
                    `;
                  }
                }}
              />
              <button
                onClick={() => setExpandedPhotos(null)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all"
                aria-label="Close photo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Navigation buttons if multiple photos */}
              {(() => {
                const allPhotos = getAllPhotos(selectedJob);
                const currentIndex = allPhotos.findIndex(p => p.url === expandedPhotos);
                if (allPhotos.length > 1) {
                  return (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const prevIndex = currentIndex > 0 ? currentIndex - 1 : allPhotos.length - 1;
                          setExpandedPhotos(allPhotos[prevIndex].url);
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-3 transition-all"
                        aria-label="Previous photo"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextIndex = currentIndex < allPhotos.length - 1 ? currentIndex + 1 : 0;
                          setExpandedPhotos(allPhotos[nextIndex].url);
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-3 transition-all"
                        aria-label="Next photo"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                        {currentIndex + 1} / {allPhotos.length}
                      </div>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


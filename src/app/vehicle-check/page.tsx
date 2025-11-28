'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI, vehicleCheckAPI } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface VehicleCheck {
  _id: string;
  operative: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    employeeId?: string;
  };
  checkDate: string;
  tyres: string;
  hazardLights: string;
  brakeLights: string;
  bodyCondition: string;
  engineOil: string;
  dashboardLights: string;
  comments?: string;
  shiftStartTime: string;
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

const getStatusLabel = (value: string): string => {
  const labels: { [key: string]: string } = {
    // Tyres
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    needs_replacement: 'Needs Replacement',
    // Lights
    working: 'Working',
    not_working: 'Not Working',
    partial: 'Partial',
    // Body Condition
    excellent: 'Excellent',
    damaged: 'Damaged',
    // Engine Oil
    low: 'Low',
    needs_change: 'Needs Change',
    critical: 'Critical',
    // Dashboard Lights
    none: 'None',
    warning: 'Warning',
    error: 'Error',
    multiple: 'Multiple',
  };
  return labels[value] || value;
};

const getStatusColor = (value: string, field: string): string => {
  if (field === 'tyres' || field === 'bodyCondition' || field === 'engineOil') {
    if (value === 'good' || value === 'excellent') return 'bg-green-100 text-green-800';
    if (value === 'fair') return 'bg-yellow-100 text-yellow-800';
    if (value === 'poor' || value === 'low' || value === 'needs_change') return 'bg-orange-100 text-orange-800';
    if (value === 'needs_replacement' || value === 'damaged' || value === 'critical') return 'bg-red-100 text-red-800';
  }
  if (field === 'hazardLights' || field === 'brakeLights') {
    if (value === 'working') return 'bg-green-100 text-green-800';
    if (value === 'partial') return 'bg-yellow-100 text-yellow-800';
    if (value === 'not_working') return 'bg-red-100 text-red-800';
  }
  if (field === 'dashboardLights') {
    if (value === 'none') return 'bg-green-100 text-green-800';
    if (value === 'warning') return 'bg-yellow-100 text-yellow-800';
    if (value === 'error' || value === 'multiple') return 'bg-red-100 text-red-800';
  }
  return 'bg-gray-100 text-gray-800';
};

export default function VehicleCheckPage() {
  const { user } = useAuth();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [vehicleChecks, setVehicleChecks] = useState<VehicleCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<VehicleCheck | null>(null);
  const [showCheckDetails, setShowCheckDetails] = useState(false);

  useEffect(() => {
    loadOperators();
  }, []);

  useEffect(() => {
    if (selectedOperatorId) {
      loadVehicleChecks(selectedOperatorId);
    } else {
      setVehicleChecks([]);
    }
  }, [selectedOperatorId]);

  const loadOperators = async () => {
    try {
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
      
      response = await usersAPI.getMeterReaders();
      setOperators(response.users || []);
    } catch (error) {
      console.error('Error loading operators:', error);
      setOperators([]);
    }
  };

  const loadVehicleChecks = async (operatorId: string) => {
    setIsLoading(true);
    try {
      const response = await vehicleCheckAPI.getVehicleChecksByOperative(operatorId);
      const checks = response.data || [];
      setVehicleChecks(checks);
    } catch (error) {
      console.error('Error loading vehicle checks:', error);
      setVehicleChecks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (check: VehicleCheck) => {
    setSelectedCheck(check);
    setShowCheckDetails(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Check Report</h1>
          <p className="mt-1 text-sm text-gray-500">View vehicle check reports by operative</p>
        </div>

        <ConnectionStatus />

        {/* Operator Selection */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <label htmlFor="operator-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Operative
            </label>
            <select
              id="operator-select"
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">-- Select an operative --</option>
              {operators.map((operator) => (
                <option key={operator._id} value={operator._id}>
                  {operator.employeeId ? `${operator.employeeId} - ` : ''}
                  {operator.firstName} {operator.lastName} ({operator.username})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vehicle Checks List */}
        {isLoading ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading vehicle checks...</span>
            </div>
          </div>
        ) : vehicleChecks.length === 0 && selectedOperatorId ? (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-center text-gray-500">No vehicle checks found for this operative.</p>
          </div>
        ) : vehicleChecks.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Vehicle Checks ({vehicleChecks.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tyres
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hazard Lights
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brake Lights
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Body Condition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engine Oil
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dashboard Lights
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vehicleChecks.map((check) => (
                      <tr key={check._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(check.checkDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(check.tyres, 'tyres')}`}>
                            {getStatusLabel(check.tyres)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(check.hazardLights, 'hazardLights')}`}>
                            {getStatusLabel(check.hazardLights)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(check.brakeLights, 'brakeLights')}`}>
                            {getStatusLabel(check.brakeLights)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(check.bodyCondition, 'bodyCondition')}`}>
                            {getStatusLabel(check.bodyCondition)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(check.engineOil, 'engineOil')}`}>
                            {getStatusLabel(check.engineOil)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(check.dashboardLights, 'dashboardLights')}`}>
                            {getStatusLabel(check.dashboardLights)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(check)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {/* Details Modal */}
        {showCheckDetails && selectedCheck && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Vehicle Check Details</h3>
                  <button
                    onClick={() => {
                      setShowCheckDetails(false);
                      setSelectedCheck(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Operative</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedCheck.operative.firstName} {selectedCheck.operative.lastName}
                      {selectedCheck.operative.employeeId && ` (${selectedCheck.operative.employeeId})`}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Check Date & Time</p>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedCheck.checkDate)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Shift Start Time</p>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedCheck.shiftStartTime)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tyres</p>
                      <p className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedCheck.tyres, 'tyres')}`}>
                          {getStatusLabel(selectedCheck.tyres)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Hazard Lights</p>
                      <p className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedCheck.hazardLights, 'hazardLights')}`}>
                          {getStatusLabel(selectedCheck.hazardLights)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Brake Lights</p>
                      <p className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedCheck.brakeLights, 'brakeLights')}`}>
                          {getStatusLabel(selectedCheck.brakeLights)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Body Condition</p>
                      <p className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedCheck.bodyCondition, 'bodyCondition')}`}>
                          {getStatusLabel(selectedCheck.bodyCondition)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Engine Oil</p>
                      <p className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedCheck.engineOil, 'engineOil')}`}>
                          {getStatusLabel(selectedCheck.engineOil)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Dashboard Lights</p>
                      <p className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedCheck.dashboardLights, 'dashboardLights')}`}>
                          {getStatusLabel(selectedCheck.dashboardLights)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {selectedCheck.comments && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Comments</p>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedCheck.comments}</p>
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => {
                        setShowCheckDetails(false);
                        setSelectedCheck(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


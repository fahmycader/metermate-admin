'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import DeleteDialog from '@/components/DeleteDialog';
import { CustomTextInput, CustomNumberInput } from '@/components/CustomInput';

interface House {
  _id: string;
  address: string;
  postcode: string;
  city: string;
  county: string;
  latitude: number;
  longitude: number;
  meterType: string;
  lastReading?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [formData, setFormData] = useState({
    address: '',
    postcode: '',
    city: '',
    county: '',
    latitude: '',
    longitude: '',
    meterType: 'all',
    isActive: true,
    notes: '',
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    house: House | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    house: null,
    isLoading: false,
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchHouses();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/houses');
      setHouses(response.data.houses || []);
    } catch (error: any) {
      console.error('Error fetching houses:', error);
      if (error.message.includes('403') || error.message.includes('Access denied')) {
        setError('Access denied: You need admin privileges to view houses');
      } else if (error.message.includes('401')) {
        setError('Authentication failed: Please login again');
      } else {
        setError(`Failed to fetch houses: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshHouses = () => {
    fetchHouses();
  };

  const geocodeAddress = async () => {
    if (!formData.address.trim() || !formData.postcode.trim() || !formData.city.trim()) {
      setError('Please enter address, postcode, and city to find coordinates');
      return;
    }

    setIsGeocoding(true);
    setError('');

    try {
      // Create a full address string
      const fullAddress = `${formData.address}, ${formData.postcode}, ${formData.city}, ${formData.county}`;
      
      // Use a free geocoding service (Nominatim from OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        setFormData(prev => ({
          ...prev,
          latitude: result.lat,
          longitude: result.lon,
        }));
        setError('');
      } else {
        setError('Could not find coordinates for this address. Please check the address or enter coordinates manually.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('Failed to find coordinates. Please enter them manually.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    if (!formData.postcode.trim()) {
      errors.postcode = 'Postcode is required';
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.county.trim()) {
      errors.county = 'County is required';
    }
    
    // Coordinates are optional - can be auto-generated or manually entered
    if (formData.latitude.trim() && isNaN(parseFloat(formData.latitude))) {
      errors.latitude = 'Latitude must be a valid number';
    }
    if (formData.longitude.trim() && isNaN(parseFloat(formData.longitude))) {
      errors.longitude = 'Longitude must be a valid number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // If coordinates are missing, try to geocode first
    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      await geocodeAddress();
      // If geocoding still fails, allow submission with 0,0 coordinates
      if (!formData.latitude.trim() || !formData.longitude.trim()) {
        console.log('Geocoding failed, proceeding with 0,0 coordinates');
      }
    }

    try {
      const houseData = {
        address: formData.address,
        postcode: formData.postcode,
        city: formData.city,
        county: formData.county,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        meterType: formData.meterType,
        isActive: formData.isActive,
        notes: formData.notes,
      };

      if (editingHouse) {
        await api.put(`/houses/${editingHouse._id}`, houseData);
      } else {
        await api.post('/houses', houseData);
      }

      resetForm();
      fetchHouses();
      setError('');
    } catch (error: any) {
      console.error('Error saving house:', error);
      setError(`Failed to save house: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      address: '',
      postcode: '',
      city: '',
      county: '',
      latitude: '',
      longitude: '',
      meterType: 'all',
      isActive: true,
      notes: '',
    });
    setValidationErrors({});
    setShowCreateForm(false);
    setEditingHouse(null);
  };

  const handleEdit = (house: House) => {
    setEditingHouse(house);
    setFormData({
      address: house.address,
      postcode: house.postcode,
      city: house.city,
      county: house.county,
      latitude: house.latitude ? house.latitude.toString() : '',
      longitude: house.longitude ? house.longitude.toString() : '',
      meterType: house.meterType,
      isActive: house.isActive,
      notes: house.notes || '',
    });
    setShowCreateForm(true);
  };

  const handleDeleteHouse = (houseToDelete: House) => {
    setDeleteDialog({
      isOpen: true,
      house: houseToDelete,
      isLoading: false,
    });
  };

  const confirmDeleteHouse = async () => {
    if (!deleteDialog.house) return;

    setDeleteDialog(prev => ({ ...prev, isLoading: true }));

    try {
      await api.delete(`/houses/${deleteDialog.house._id}`);
      
      // Remove house from local state
      setHouses(prev => prev.filter(h => h._id !== deleteDialog.house!._id));
      
      // Close dialog
      setDeleteDialog({
        isOpen: false,
        house: null,
        isLoading: false,
      });

      // Show success message
      setError('');
    } catch (error: any) {
      console.error('Error deleting house:', error);
      setError(`Failed to delete house: ${error.message}`);
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      house: null,
      isLoading: false,
    });
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-2">Loading Houses...</div>
            <div className="text-sm text-gray-500">Fetching house data from database</div>
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
            <h1 className="text-2xl font-bold text-gray-900">House Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage properties and their meter information</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={refreshHouses}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Refresh Data
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
            >
              Create New House
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Create/Edit House Form */}
        {showCreateForm && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {editingHouse ? 'Edit House' : 'Create New House'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CustomTextInput
                    id="address"
                    name="address"
                    type="text"
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    error={validationErrors.address}
                  />
                  
                  <CustomTextInput
                    id="postcode"
                    name="postcode"
                    type="text"
                    label="Postcode"
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    required
                    error={validationErrors.postcode}
                  />
                  
                  <CustomTextInput
                    id="city"
                    name="city"
                    type="text"
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    error={validationErrors.city}
                  />
                  
                  <CustomTextInput
                    id="county"
                    name="county"
                    type="text"
                    label="County"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    required
                    error={validationErrors.county}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coordinates (Optional)
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <button
                        type="button"
                        onClick={geocodeAddress}
                        disabled={isGeocoding || !formData.address.trim() || !formData.postcode.trim() || !formData.city.trim()}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isGeocoding ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Finding...
                          </>
                        ) : (
                          'Find Coordinates'
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <CustomNumberInput
                        id="latitude"
                        name="latitude"
                        label="Latitude"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        error={validationErrors.latitude}
                        placeholder="Auto-generated"
                        min={-90}
                        max={90}
                      />
                      
                      <CustomNumberInput
                        id="longitude"
                        name="longitude"
                        label="Longitude"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        error={validationErrors.longitude}
                        placeholder="Auto-generated"
                        min={-180}
                        max={180}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter address details above and click "Find Coordinates" to automatically get location coordinates.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meter Type
                    </label>
                    <select
                      value={formData.meterType}
                      onChange={(e) => setFormData({ ...formData, meterType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      style={{ backgroundColor: '#ffffff', color: '#111827' }}
                    >
                      <option value="all">All Meters</option>
                      <option value="electric">Electric</option>
                      <option value="gas">Gas</option>
                      <option value="water">Water</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Active House
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    style={{ backgroundColor: '#ffffff', color: '#111827' }}
                    placeholder="Additional notes about this house..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {editingHouse ? 'Update House' : 'Create House'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Registered Houses
              </h3>
              <div className="text-sm text-gray-500">
                Total houses: <span className="font-medium">{houses.length}</span>
              </div>
            </div>

            {houses.length === 0 && !error ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No houses found</div>
                <div className="text-sm text-gray-400 mt-2">
                  Houses will appear here once they are registered in the system
                </div>
              </div>
            ) : houses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meter Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coordinates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {houses.map((house) => (
                      <tr key={house._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {house.address}
                          </div>
                          <div className="text-sm text-gray-500">
                            {house.postcode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {house.city}
                          </div>
                          <div className="text-sm text-gray-500">
                            {house.county}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            house.meterType === 'electric' ? 'bg-yellow-100 text-yellow-800' :
                            house.meterType === 'gas' ? 'bg-orange-100 text-orange-800' :
                            house.meterType === 'water' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {house.meterType === 'all' ? 'All Meters' : house.meterType.charAt(0).toUpperCase() + house.meterType.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{house.latitude && house.latitude !== 0 ? house.latitude.toFixed(6) : 'N/A'}</div>
                          <div>{house.longitude && house.longitude !== 0 ? house.longitude.toFixed(6) : 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(house)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm"
                              title="Edit House"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {house.latitude && house.longitude && (
                              <button
                                onClick={() => openGoogleMaps(house.latitude, house.longitude)}
                                className="text-blue-600 hover:text-blue-900 text-sm"
                                title="View on Map"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteHouse(house)}
                              className="text-red-600 hover:text-red-900 text-sm"
                              title="Delete House"
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
            ) : null}
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteHouse}
        title="Delete House"
        itemName={deleteDialog.house ? deleteDialog.house.address : ''}
        isLoading={deleteDialog.isLoading}
      />
    </AdminLayout>
  );
}

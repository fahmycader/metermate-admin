'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/AdminLayout';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import type { OperativeMapLocation } from '@/components/OperativeLocationMap';
import { usersAPI } from '@/lib/api';

const OperativeLocationMap = dynamic(
  () => import('@/components/OperativeLocationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[520px] items-center justify-center text-gray-600">
        Loading map...
      </div>
    ),
  },
);

interface Operative {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  employeeId?: string;
  role?: string;
  isActive?: boolean;
  currentLocation?: {
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    timestamp?: string | null;
  } | null;
}

function formatLastSeen(timestamp?: string | null) {
  if (!timestamp) return 'No location reported';
  const reportedAt = Date.parse(timestamp);
  if (!Number.isFinite(reportedAt)) return 'Update time unavailable';

  const minutes = Math.max(0, Math.floor((Date.now() - reportedAt) / 60000));
  if (minutes === 0) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function OperativeLocationsPage() {
  const [operatives, setOperatives] = useState<Operative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedOperativeId, setSelectedOperativeId] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  const loadOperatives = useCallback(async (backgroundRefresh = false) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (backgroundRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await usersAPI.getMeterUsers();
      const meterReaders = (response.users || []).filter((operative: Operative) => operative.role === 'meter_reader');
      setOperatives(meterReaders);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load operative locations.');
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOperatives();
    const refreshTimer = window.setInterval(() => void loadOperatives(true), 15000);
    return () => window.clearInterval(refreshTimer);
  }, [loadOperatives]);

  const mapLocations = useMemo<OperativeMapLocation[]>(() => (
    operatives.flatMap((operative) => {
      const latitude = operative.currentLocation?.latitude;
      const longitude = operative.currentLocation?.longitude;
      if (
        typeof latitude !== 'number' ||
        !Number.isFinite(latitude) ||
        typeof longitude !== 'number' ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return [];
      }

      return [{
        id: operative._id,
        name: `${operative.firstName || ''} ${operative.lastName || ''}`.trim() || operative.username || 'Operative',
        employeeId: operative.employeeId,
        latitude,
        longitude,
        accuracy: operative.currentLocation?.accuracy,
        updatedAt: operative.currentLocation?.timestamp,
        isActive: operative.isActive !== false,
      }];
    })
  ), [operatives]);

  const freshLocationCount = mapLocations.filter((location) => {
    const timestamp = location.updatedAt ? Date.parse(location.updatedAt) : NaN;
    return Number.isFinite(timestamp) && Date.now() - timestamp <= 5 * 60 * 1000;
  }).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operative Locations</h1>
            <p className="mt-2 text-sm text-gray-600">
              View every operative&apos;s most recently reported mobile location in one map.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <button
              type="button"
              onClick={() => void loadOperatives()}
              disabled={isLoading || isRefreshing}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Operatives</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{operatives.length}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">With a reported location</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{mapLocations.length}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Updated in the last 5 minutes</p>
            <p className="mt-1 text-2xl font-semibold text-green-700">{freshLocationCount}</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <section className="min-w-0 rounded-lg bg-white p-3 shadow" aria-label="All operative locations map">
            {isLoading ? (
              <div className="flex min-h-[520px] items-center justify-center text-gray-600">
                Loading operative locations...
              </div>
            ) : (
              <OperativeLocationMap
                locations={mapLocations}
                selectedOperativeId={selectedOperativeId}
                formatLastSeen={formatLastSeen}
              />
            )}
            <p className="px-2 pt-3 text-xs text-gray-500">
              Locations refresh automatically every 15 seconds. A stale marker shows the last known location and may not be current.
            </p>
          </section>

          <section className="rounded-lg bg-white shadow" aria-label="Operative location list">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="font-semibold text-gray-900">All Operatives</h2>
            </div>
            <div className="max-h-[640px] divide-y divide-gray-100 overflow-y-auto">
              {operatives.map((operative) => {
                const location = mapLocations.find((item) => item.id === operative._id);
                const timestamp = operative.currentLocation?.timestamp;
                const reportedAt = timestamp ? Date.parse(timestamp) : NaN;
                const isFresh = Number.isFinite(reportedAt) && Date.now() - reportedAt <= 5 * 60 * 1000;
                const name = `${operative.firstName || ''} ${operative.lastName || ''}`.trim() || operative.username || 'Operative';

                return (
                  <button
                    key={operative._id}
                    type="button"
                    disabled={!location}
                    onClick={() => setSelectedOperativeId(location ? operative._id : null)}
                    className={`block w-full px-4 py-3 text-left transition-colors ${
                      location ? 'hover:bg-blue-50' : 'cursor-default'
                    } ${selectedOperativeId === operative._id ? 'bg-blue-50' : ''}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-900">{name}</span>
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        !operative.isActive
                          ? 'bg-gray-100 text-gray-600'
                          : !location || !isFresh
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {!operative.isActive ? 'Inactive' : !location ? 'No location' : isFresh ? 'Live' : 'Stale'}
                      </span>
                    </span>
                    {operative.employeeId && (
                      <span className="mt-1 block text-xs text-gray-500">Employee ID: {operative.employeeId}</span>
                    )}
                    <span className="mt-1 block text-xs text-gray-500">{formatLastSeen(timestamp)}</span>
                    {location && (
                      <span className="mt-1 block text-xs text-gray-500">
                        {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                      </span>
                    )}
                  </button>
                );
              })}
              {!isLoading && operatives.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-gray-500">No operatives found.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

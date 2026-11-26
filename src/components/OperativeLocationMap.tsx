'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';

export interface OperativeMapLocation {
  id: string;
  name: string;
  employeeId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  updatedAt?: string | null;
  isActive: boolean;
}

interface OperativeLocationMapProps {
  locations: OperativeMapLocation[];
  selectedOperativeId: string | null;
  formatLastSeen: (timestamp?: string | null) => string;
}

function MapViewport({
  locations,
  selectedOperativeId,
}: Pick<OperativeLocationMapProps, 'locations' | 'selectedOperativeId'>) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (locations.length === 1) {
      const [location] = locations;
      map.setView([location.latitude, location.longitude], 14);
    } else if (locations.length > 1) {
      const bounds = L.latLngBounds(
        locations.map((location) => [location.latitude, location.longitude] as L.LatLngTuple),
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [locations, map]);

  useEffect(() => {
    const selectedLocation = locations.find((location) => location.id === selectedOperativeId);
    if (selectedLocation) {
      map.flyTo([selectedLocation.latitude, selectedLocation.longitude], 15, { duration: 0.5 });
    }
  }, [locations, map, selectedOperativeId]);

  return null;
}

export default function OperativeLocationMap({
  locations,
  selectedOperativeId,
  formatLastSeen,
}: OperativeLocationMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      scrollWheelZoom
      className="h-full min-h-[520px] w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport locations={locations} selectedOperativeId={selectedOperativeId} />
      {locations.map((location) => {
        const reportedAt = location.updatedAt ? Date.parse(location.updatedAt) : NaN;
        const isFresh = Number.isFinite(reportedAt) && Date.now() - reportedAt <= 5 * 60 * 1000;
        const fillColor = !location.isActive ? '#64748b' : isFresh ? '#16a34a' : '#f59e0b';

        return (
          <CircleMarker
            key={location.id}
            center={[location.latitude, location.longitude]}
            radius={9}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor, fillOpacity: 0.95 }}
          >
            <Popup>
              <div className="space-y-1">
                <strong>{location.name || 'Operative'}</strong>
                {location.employeeId && <div>Employee ID: {location.employeeId}</div>}
                <div>{location.isActive ? 'Active account' : 'Inactive account'}</div>
                <div>Last location update: {formatLastSeen(location.updatedAt)}</div>
                {location.accuracy != null && <div>Accuracy: {Math.round(location.accuracy)} m</div>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

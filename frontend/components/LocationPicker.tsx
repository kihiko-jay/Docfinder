
import React, { useEffect, useRef, useState } from 'react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialLat, initialLng }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const marker = useRef<any>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Nairobi default center
    const defaultLat = initialLat || -1.2921;
    const defaultLng = initialLng || 36.8219;

    // @ts-ignore
    const L = window.L;
    if (!L) return;

    leafletMap.current = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap.current);

    // If we have initial coords, place marker
    if (initialLat && initialLng) {
      marker.current = L.marker([initialLat, initialLng], { draggable: true }).addTo(leafletMap.current);
    }

    leafletMap.current.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng);
    });

    // Try to get user location
    if (navigator.geolocation && !initialLat) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        leafletMap.current.setView([latitude, longitude], 15);
        updateMarker(latitude, longitude);
      });
    }
  }, []);

  const updateMarker = async (lat: number, lng: number) => {
    // @ts-ignore
    const L = window.L;
    if (marker.current) {
      marker.current.setLatLng([lat, lng]);
    } else {
      marker.current = L.marker([lat, lng], { draggable: true }).addTo(leafletMap.current);
      marker.current.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        updateMarker(pos.lat, pos.lng);
      });
    }

    setAddressLoading(true);
    try {
      // Reverse geocoding using Nominatim
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const address = data.display_name || `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      onLocationSelect(lat, lng, address);
    } catch (err) {
      onLocationSelect(lat, lng, `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setAddressLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest px-1">
          Pick Precise Location
        </label>
        {addressLoading && (
          <span className="text-[10px] font-bold text-red-600 animate-pulse uppercase tracking-wider">
            Fetching Address...
          </span>
        )}
      </div>
      <div 
        ref={mapRef} 
        className="h-64 w-full bg-gray-100 border-2 border-gray-100 shadow-inner overflow-hidden"
      ></div>
      <p className="text-[10px] text-gray-400 italic px-1">
        Tap the map to set the exact spot where the document was found.
      </p>
    </div>
  );
};

export default LocationPicker;

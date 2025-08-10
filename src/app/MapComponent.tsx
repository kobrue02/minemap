"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.fullscreen/Control.FullScreen.css';
import 'leaflet.fullscreen/Control.FullScreen.js';

// Fix for default markers in Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MiningDeposit {
  id: number;
  companyName: string;
  projectName: string;
  resource: string;
  latitude: number;
  longitude: number;
  country: string;
  status: string;
  description: string;
}

interface MapComponentProps {
  deposits: MiningDeposit[];
  selectedDeposit: MiningDeposit | null;
  onDepositSelect: (deposit: MiningDeposit) => void;
}

// Resource colors for map markers
const resourceColors: Record<string, string> = {
  'Gold': '#FFD700',
  'Silver': '#C0C0C0',
  'Copper': '#B87333',
  'Iron Ore': '#8B4513',
  'Platinum': '#E5E4E2',
  'Zinc': '#7F7F7F',
  'Lead': '#2F4F4F',
  'Nickel': '#D3D3D3'
};

const MapComponent: React.FC<MapComponentProps> = ({ deposits, selectedDeposit, onDepositSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false, // We'll add custom controls
      attributionControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add custom zoom controls
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    // Add scale control
    L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: true,
    }).addTo(map);

    // Add fullscreen control
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (L.control as any).fullscreen({
      position: 'topright',
      title: {
        'false': 'View Fullscreen',
        'true': 'Exit Fullscreen'
      }
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when deposits change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    deposits.forEach(deposit => {
      const color = resourceColors[deposit.resource] || '#666';
      
      // Create custom icon
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 20px; 
            height: 20px; 
            background-color: ${color}; 
            border: 2px solid white; 
            border-radius: 50%; 
            box-shadow: 0 0 10px ${color}80;
            cursor: pointer;
            transition: all 0.3s ease;
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([deposit.latitude, deposit.longitude], {
        icon: customIcon,
        title: `${deposit.projectName} - ${deposit.companyName}`
      }).addTo(mapInstanceRef.current!);

      // Add popup with deposit info
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #333;">${deposit.projectName}</h3>
          <p style="margin: 4px 0; color: #666;"><strong>Company:</strong> ${deposit.companyName}</p>
          <p style="margin: 4px 0; color: #666;"><strong>Resource:</strong> ${deposit.resource}</p>
          <p style="margin: 4px 0; color: #666;"><strong>Country:</strong> ${deposit.country}</p>
          <p style="margin: 4px 0; color: #666;"><strong>Status:</strong> ${deposit.status}</p>
          ${deposit.description ? `<p style="margin: 8px 0 0 0; color: #666; font-style: italic;">${deposit.description}</p>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        onDepositSelect(deposit);
      });

      markersRef.current.push(marker);
    });
  }, [deposits, onDepositSelect]);

  // Update selected marker
  useEffect(() => {
    markersRef.current.forEach(marker => {
      const markerElement = marker.getElement();
      if (markerElement) {
        const markerDiv = markerElement.querySelector('div');
        if (markerDiv) {
          const deposit = deposits.find(d => 
            d.latitude === marker.getLatLng().lat && 
            d.longitude === marker.getLatLng().lng
          );
          
          if (deposit && selectedDeposit && deposit.id === selectedDeposit.id) {
            markerDiv.style.transform = 'scale(1.5)';
            markerDiv.style.boxShadow = `0 0 20px ${resourceColors[deposit.resource] || '#666'}`;
          } else if (deposit) {
            markerDiv.style.transform = 'scale(1)';
            markerDiv.style.boxShadow = `0 0 10px ${resourceColors[deposit.resource] || '#666'}80`;
          }
        }
      }
    });
  }, [selectedDeposit, deposits]);

  return (
    <div className="relative w-full h-full overflow-hidden border border-gray-200">
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ 
          background: '#ffffff'
        }}
      />
      
      {/* Map overlay with subtle border */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border border-gray-100"></div>
      </div>
    </div>
  );
};

export default MapComponent;

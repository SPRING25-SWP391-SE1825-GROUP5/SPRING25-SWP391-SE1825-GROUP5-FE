import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { CenterService, type NearbyCenter } from '@/services/centerService'
import { MapPin, Navigation, Phone, Mail } from 'lucide-react'
import './leaflet.css'

// Fix for default markers in Leaflet with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png'

// Create custom icon
const createCustomIcon = (color: string = '#10b981') => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          color: white;
          font-size: 16px;
          transform: rotate(45deg);
          font-weight: bold;
        ">📍</div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  })
}

interface LeafletMapProps {
  onCenterSelect?: (center: NearbyCenter) => void
  selectedCenterId?: number
  userLocation?: { lat: number; lng: number }
  radiusKm?: number
  className?: string
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  onCenterSelect,
  selectedCenterId,
  userLocation,
  radiusKm = 10,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [centers, setCenters] = useState<NearbyCenter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null)

  // Default location (Ho Chi Minh City)
  const defaultLocation = { lat: 10.8231, lng: 106.6297 }

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create map
    const map = L.map(mapRef.current, {
      center: userLocation || defaultLocation,
      zoom: 13,
      zoomControl: true
    })

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    mapInstanceRef.current = map

    // Add user location marker if available
    if (userLocation) {
      const userIcon = createCustomIcon('#3b82f6')
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <strong>📍 Vị trí của bạn</strong>
          </div>
        `)
      setUserMarker(marker)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Load nearby centers
  useEffect(() => {
    const loadNearbyCenters = async () => {
      if (!mapInstanceRef.current) return

      const location = userLocation || defaultLocation
      setLoading(true)
      setError(null)

      try {
        const nearbyCenters = await CenterService.getNearbyCenters({
          lat: location.lat,
          lng: location.lng,
          radiusKm,
          limit: 20
        })

        setCenters(nearbyCenters)

        // Clear existing markers
        markersRef.current.forEach(marker => {
          mapInstanceRef.current?.removeLayer(marker)
        })
        markersRef.current = []

        // Add markers for each center
        nearbyCenters.forEach((center, index) => {
          // For demo purposes, generate random coordinates near the user location
          // In real implementation, centers should have lat/lng coordinates
          const lat = location.lat + (Math.random() - 0.5) * 0.1
          const lng = location.lng + (Math.random() - 0.5) * 0.1

          const isSelected = selectedCenterId === center.centerId
          const icon = createCustomIcon(isSelected ? '#ef4444' : '#10b981')

          const marker = L.marker([lat, lng], { icon })
            .addTo(mapInstanceRef.current!)
            .bindPopup(`
              <div style="min-width: 200px; padding: 8px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">
                  ${center.centerName}
                </h3>
                <div style="margin-bottom: 6px; color: #6b7280; font-size: 14px;">
                  <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                    <span style="font-size: 12px;">📍</span>
                    ${center.address}
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                    <span style="font-size: 12px;">📞</span>
                    ${center.phoneNumber}
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
                    <span style="font-size: 12px;">📏</span>
                    ${center.distance.toFixed(1)} km
                  </div>
                </div>
                <button 
                  onclick="window.selectCenter(${center.centerId})"
                  style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    width: 100%;
                  "
                >
                  Chọn trung tâm này
                </button>
              </div>
            `)

          // Add click handler
          marker.on('click', () => {
            onCenterSelect?.(center)
          })

          markersRef.current.push(marker)
        })

        // Fit map to show all markers
        if (nearbyCenters.length > 0) {
          const group = new L.FeatureGroup(markersRef.current)
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
        }

      } catch (err: any) {
        console.error('Error loading nearby centers:', err)
        setError('Không thể tải danh sách trung tâm gần đây')
      } finally {
        setLoading(false)
      }
    }

    loadNearbyCenters()
  }, [userLocation, radiusKm, selectedCenterId, onCenterSelect])

  // Update map center when user location changes
  useEffect(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13)
      
      // Update user marker
      if (userMarker) {
        userMarker.setLatLng([userLocation.lat, userLocation.lng])
      }
    }
  }, [userLocation, userMarker])

  // Get user location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        // Update user location in parent component
        // This would need to be passed as a prop or handled by parent
        console.log('User location:', { lat: latitude, lng: longitude })
      },
      (error) => {
        console.error('Geolocation error:', error)
        setError('Không thể lấy vị trí hiện tại')
      }
    )
  }

  return (
    <div className={`leaflet-map-container ${className}`}>
      <div className="map-controls">
        <button
          onClick={getUserLocation}
          className="location-btn"
          disabled={loading}
        >
          <Navigation size={16} />
          Vị trí của tôi
        </button>
        {loading && <span className="loading-text">Đang tải...</span>}
        {error && <span className="error-text">{error}</span>}
      </div>
      
      <div ref={mapRef} className="leaflet-map" />
      
      {centers.length > 0 && (
        <div className="centers-list">
          <h4>Trung tâm gần đây ({centers.length})</h4>
          <div className="centers-grid">
            {centers.map((center) => (
              <div
                key={center.centerId}
                className={`center-card ${selectedCenterId === center.centerId ? 'selected' : ''}`}
                onClick={() => onCenterSelect?.(center)}
              >
                <div className="center-header">
                  <MapPin size={16} />
                  <span className="center-name">{center.centerName}</span>
                </div>
                <div className="center-details">
                  <div className="center-address">{center.address}</div>
                  <div className="center-meta">
                    <span className="distance">{center.distance.toFixed(1)} km</span>
                    <span className="phone">{center.phoneNumber}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .leaflet-map-container {
          position: relative;
          width: 100%;
          height: 500px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .map-controls {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .location-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .location-btn:hover {
          background: #f9fafb;
          border-color: #10b981;
        }

        .location-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-text, .error-text {
          background: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .error-text {
          color: #ef4444;
        }

        .leaflet-map {
          width: 100%;
          height: 100%;
        }

        .centers-list {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e5e7eb;
          max-height: 200px;
          overflow-y: auto;
          padding: 16px;
        }

        .centers-list h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #1f2937;
        }

        .centers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
        }

        .center-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .center-card:hover {
          border-color: #10b981;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
        }

        .center-card.selected {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .center-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .center-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }

        .center-details {
          font-size: 12px;
          color: #6b7280;
        }

        .center-address {
          margin-bottom: 4px;
        }

        .center-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .distance {
          color: #10b981;
          font-weight: 500;
        }

        .phone {
          color: #6b7280;
        }

        /* Custom marker styles */
        :global(.custom-marker) {
          background: transparent !important;
          border: none !important;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .centers-grid {
            grid-template-columns: 1fr;
          }
          
          .centers-list {
            max-height: 150px;
          }
        }
      `}</style>
    </div>
  )
}

export default LeafletMap

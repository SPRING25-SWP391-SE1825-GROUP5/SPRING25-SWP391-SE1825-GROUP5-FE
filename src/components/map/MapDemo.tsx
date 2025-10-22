import React, { useState } from 'react'
import LeafletMap from './LeafletMap'
import { type NearbyCenter } from '@/services/centerService'
import { MapPin, Phone, Mail, Navigation } from 'lucide-react'

const MapDemo: React.FC = () => {
  const [selectedCenter, setSelectedCenter] = useState<NearbyCenter | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>()

  const handleCenterSelect = (center: NearbyCenter) => {
    setSelectedCenter(center)
    console.log('Selected center:', center)
  }

  const handleGetUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Không thể lấy vị trí hiện tại')
      }
    )
  }

  return (
    <div className="map-demo">
      <div className="demo-header">
        <h2>Tìm trung tâm dịch vụ gần bạn</h2>
        <p>Sử dụng bản đồ để tìm và chọn trung tâm dịch vụ xe điện gần nhất</p>
        
        <div className="demo-controls">
          <button onClick={handleGetUserLocation} className="btn-primary">
            <Navigation size={16} />
            Lấy vị trí của tôi
          </button>
          {userLocation && (
            <div className="location-info">
              <span>📍 Vị trí: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="map-section">
        <LeafletMap
          onCenterSelect={handleCenterSelect}
          selectedCenterId={selectedCenter?.centerId}
          userLocation={userLocation}
          radiusKm={15}
          className="demo-map"
        />
      </div>

      {selectedCenter && (
        <div className="selected-center-info">
          <h3>Trung tâm đã chọn</h3>
          <div className="center-details">
            <div className="center-header">
              <MapPin size={20} />
              <h4>{selectedCenter.centerName}</h4>
            </div>
            <div className="center-info">
              <div className="info-item">
                <strong>Địa chỉ:</strong> {selectedCenter.address}
              </div>
              <div className="info-item">
                <strong>Thành phố:</strong> {selectedCenter.city}
              </div>
              <div className="info-item">
                <strong>Khoảng cách:</strong> {selectedCenter.distance.toFixed(1)} km
              </div>
              <div className="info-item">
                <Phone size={16} />
                <strong>Số điện thoại:</strong> {selectedCenter.phoneNumber}
              </div>
              <div className="info-item">
                <strong>Trạng thái:</strong> 
                <span className={`status ${selectedCenter.isActive ? 'active' : 'inactive'}`}>
                  {selectedCenter.isActive ? 'Hoạt động' : 'Tạm dừng'}
                </span>
              </div>
            </div>
            <div className="center-actions">
              <button className="btn-primary">
                Đặt lịch tại trung tâm này
              </button>
              <button className="btn-secondary">
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .map-demo {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .demo-header h2 {
          color: #1f2937;
          margin-bottom: 8px;
          font-size: 28px;
        }

        .demo-header p {
          color: #6b7280;
          margin-bottom: 20px;
          font-size: 16px;
        }

        .demo-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #10b981;
        }

        .location-info {
          background: #f0fdf4;
          border: 1px solid #10b981;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          color: #059669;
        }

        .map-section {
          margin-bottom: 30px;
        }

        .demo-map {
          height: 500px;
        }

        .selected-center-info {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .selected-center-info h3 {
          color: #1f2937;
          margin-bottom: 20px;
          font-size: 20px;
        }

        .center-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .center-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .center-header h4 {
          color: #1f2937;
          margin: 0;
          font-size: 18px;
        }

        .center-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
        }

        .info-item strong {
          color: #1f2937;
          min-width: 100px;
        }

        .status {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status.active {
          background: #f0fdf4;
          color: #059669;
        }

        .status.inactive {
          background: #fef2f2;
          color: #dc2626;
        }

        .center-actions {
          display: flex;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .map-demo {
            padding: 16px;
          }

          .demo-header h2 {
            font-size: 24px;
          }

          .demo-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .center-info {
            grid-template-columns: 1fr;
          }

          .center-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default MapDemo

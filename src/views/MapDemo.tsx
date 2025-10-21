import React from 'react'
import MapDemo from '@/components/map/MapDemo'

const MapDemoPage: React.FC = () => {
  return (
    <div className="map-demo-page">
      <div className="page-header">
        <h1>Bản đồ trung tâm dịch vụ</h1>
        <p>Tìm kiếm và chọn trung tâm dịch vụ xe điện gần bạn nhất</p>
      </div>
      
      <MapDemo />
      
      <style>{`
        .map-demo-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          padding: 20px 0;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 0 20px;
        }

        .page-header h1 {
          color: #1f2937;
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .page-header p {
          color: #6b7280;
          font-size: 18px;
          max-width: 600px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 28px;
          }
          
          .page-header p {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default MapDemoPage

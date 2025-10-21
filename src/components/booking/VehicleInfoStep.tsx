import React, { useState, useEffect } from 'react'
import api from '@/services/api'

interface VehicleInfo {
  carModel: string
  mileage: string
  licensePlate: string
  year?: string
  color?: string
  brand?: string
}

interface VehicleInfoStepProps {
  data: VehicleInfo
  onUpdate: (data: Partial<VehicleInfo>) => void
  onNext: () => void
  onPrev: () => void
}

interface VehicleModel {
  id: number
  name: string
  brand: string
}

const VehicleInfoStep: React.FC<VehicleInfoStepProps> = ({ data, onUpdate, onNext, onPrev }) => {
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVehicleModels = async () => {
      try {
        setLoading(true)
        console.log('Fetching vehicle models from /VehicleModel/active...')
        const response = await api.get('/VehicleModel/active')
        console.log('Vehicle models response:', response.data)
        console.log('Response type:', typeof response.data)
        console.log('Is array:', Array.isArray(response.data))
        console.log('First item:', response.data?.[0])
        
        // Check if data is nested
        let models = response.data
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Try common nested structures
          models = response.data.data || response.data.models || response.data.items || response.data
          console.log('Extracted models from nested structure:', models)
        }
        
        console.log('Final models array:', models)
        console.log('Models length:', models?.length)
        setVehicleModels(models || [])
      } catch (error: any) {
        console.error('Error fetching vehicle models:', error)
        console.error('Error details:', {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          message: error?.message
        })
        setVehicleModels([])
      } finally {
        setLoading(false)
      }
    }

    fetchVehicleModels()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.carModel && data.licensePlate) {
      onNext()
    }
  }

  return (
    <div className="vehicle-info-step">
      <h2>Thông tin xe</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Dòng xe *</label>
          <select
            value={data.carModel}
            onChange={(e) => onUpdate({ carModel: e.target.value })}
            required
            disabled={loading}
          >
            <option value="">
              {loading ? 'Đang tải...' : 'Chọn dòng xe'}
            </option>
            {vehicleModels.map((model, index) => {
              console.log(`Model ${index}:`, model)
              console.log(`Model ${index} name:`, model.name)
              console.log(`Model ${index} brand:`, model.brand)
              console.log(`Model ${index} id:`, model.id)
              
              const displayName = model.name || model.modelName || model.title || `Model ${index + 1}`
              const brand = model.brand || model.brandName || ''
              
              return (
                <option key={model.id || `model-${index}`} value={displayName}>
                  {displayName}{brand ? ` (${brand})` : ''}
                </option>
              )
            })}
          </select>
        </div>
        <div className="form-group">
          <label>Số km đã đi</label>
          <input
            type="text"
            value={data.mileage}
            onChange={(e) => onUpdate({ mileage: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Biển số xe *</label>
          <input
            type="text"
            value={data.licensePlate}
            onChange={(e) => onUpdate({ licensePlate: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Hãng xe</label>
          <select
            value={data.brand || ''}
            onChange={(e) => onUpdate({ brand: e.target.value })}
          >
            <option value="">Chọn hãng xe</option>
            <option value="AutoEV">AutoEV</option>
            <option value="Tesla">Tesla</option>
            <option value="VinFast">VinFast</option>
            <option value="BMW">BMW</option>
            <option value="Mercedes">Mercedes</option>
            <option value="Audi">Audi</option>
            <option value="Toyota">Toyota</option>
            <option value="Honda">Honda</option>
            <option value="Hyundai">Hyundai</option>
            <option value="Kia">Kia</option>
            <option value="other">Khác</option>
          </select>
        </div>
        <div className="form-group">
          <label>Năm sản xuất</label>
          <input
            type="number"
            min="1990"
            max="2025"
            value={data.year || ''}
            onChange={(e) => onUpdate({ year: e.target.value })}
            placeholder="2020"
          />
        </div>
        <div className="form-group">
          <label>Màu sắc</label>
          <select
            value={data.color || ''}
            onChange={(e) => onUpdate({ color: e.target.value })}
          >
            <option value="">Chọn màu sắc</option>
            <option value="Đen">Đen</option>
            <option value="Trắng">Trắng</option>
            <option value="Xám">Xám</option>
            <option value="Bạc">Bạc</option>
            <option value="Xanh">Xanh</option>
            <option value="Đỏ">Đỏ</option>
            <option value="Vàng">Vàng</option>
            <option value="Nâu">Nâu</option>
            <option value="Khác">Khác</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="button" onClick={onPrev} className="btn-secondary">
            Quay lại
          </button>
          <button type="submit" className="btn-primary">
            Tiếp theo
          </button>
        </div>
      </form>
    </div>
  )
}

export default VehicleInfoStep
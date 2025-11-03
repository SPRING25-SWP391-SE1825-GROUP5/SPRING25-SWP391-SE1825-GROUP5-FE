import React, { useEffect, useState } from 'react'
import { Eye, Edit, CheckCircle, X, Wrench, FileText, Banknote, Calendar as CalendarIcon, Settings } from 'lucide-react'

export type ServiceRow = {
  id: number
  name: string
  description: string
  price: number
  isActive: boolean
  createAt: string
}

type SortOrder = 'asc' | 'desc'

type Props = {
  services: ServiceRow[]
  sortBy: string
  sortOrder: SortOrder
  onSort: (field: string) => void
  onView: (id: number) => void
  onEdit: (service: ServiceRow) => void
}

export default function ServicesListTable({ services, sortBy, sortOrder, onSort, onView, onEdit }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  useEffect(() => {
    // reset selection when list changes
    setSelectedIds([])
  }, [services])
  const allSelected = services.length > 0 && selectedIds.length === services.length
  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : services.map(s => s.id))
  }
  const toggleOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="sort-placeholder" />
    return <span className={`sort-icon ${sortOrder === 'asc' ? 'asc' : 'desc'}`} />
  }

  return (
    <div className="services-table-wrapper">
      <table className="services-table">
        <thead>
          <tr>
            <th>
              <div className="th-inner left">
                <input type="checkbox" className="table-checkbox" checked={allSelected} onChange={toggleAll} />
                <Wrench size={16} className="th-icon" />
                <span>Tên dịch vụ</span>
              </div>
            </th>
            <th>
              <div className="th-inner left">
                <FileText size={16} className="th-icon" />
                Mô tả
              </div>
            </th>
            <th className="is-sortable" onClick={() => onSort('price')}>
              <div className="th-inner left">
                <Banknote size={16} className="th-icon" />
                <span>Giá</span>
                <SortIcon field="price" />
              </div>
            </th>
            <th>
              <div className="th-inner left">
                <CheckCircle size={16} className="th-icon" />
                Trạng thái
              </div>
            </th>
            <th className="is-sortable" onClick={() => onSort('createAt')}>
              <div className="th-inner left">
                <CalendarIcon size={16} className="th-icon" />
                <span>Ngày tạo</span>
                <SortIcon field="createAt" />
              </div>
            </th>
            <th>
              <div className="th-inner left">
                <Settings size={16} className="th-icon" />
                Thao tác
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
           {services.map((service, index) => (
            <tr key={service.id} className={index % 2 === 0 ? 'odd' : 'even'}>
              <td>
                <div className="cell-name">
                  <input type="checkbox" className="table-checkbox" checked={selectedIds.includes(service.id)} onChange={() => toggleOne(service.id)} />
                  {service.name}
                </div>
              </td>
              <td>
                <div className="cell-desc">{service.description}</div>
              </td>
              <td>
                {(service.price || 0).toLocaleString()} VNĐ
              </td>
              <td>
                <div className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                  {service.isActive ? (
                    <>
                      <CheckCircle size={12} />
                      Hoạt động
                    </>
                  ) : (
                    <>
                      <X size={12} />
                      Ngừng hoạt động
                    </>
                  )}
                </div>
              </td>
              <td>{new Date(service.createAt).toLocaleDateString('vi-VN')}</td>
              <td>
                <div className="row-actions">
                  <button className="action-btn" title="Xem chi tiết" onClick={() => onView(service.id)}>
                    <Eye size={16} />
                  </button>
                  <button className="action-btn" title="Sửa dịch vụ" onClick={() => onEdit(service)}>
                    <Edit size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}



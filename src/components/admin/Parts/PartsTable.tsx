import React from 'react'
import { Part } from '../../../types/parts'

interface PartsTableProps {
  parts: Part[]
  onEdit: (part: Part) => void
  onDelete: (partId: string) => void
  showPagination?: boolean
  currentPage?: number
  itemsPerPage?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
}

export default function PartsTable({ 
  parts, 
  onEdit, 
  onDelete, 
  showPagination = false,
  currentPage = 1,
  itemsPerPage = 10,
  totalItems = 0,
  onPageChange,
  onItemsPerPageChange
}: PartsTableProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Còn hàng': return '#10b981'
      case 'Sắp hết': return '#f59e0b'
      case 'Hết hàng': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #f1f5f9',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Table Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '20px 24px',
        borderBottom: '2px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            📋
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0
          }}>
            Danh sách phụ tùng
          </h3>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: '#dbeafe',
          color: '#1d4ed8',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          <span>📦</span>
          <span>{parts.length} sản phẩm</span>
        </div>
      </div>
      
      <div style={{
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead style={{
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <tr style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🆔</span>
                  <span>ID</span>
                </div>
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏷️</span>
                  <span>Mã sản phẩm</span>
                </div>
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📦</span>
                  <span>Tên sản phẩm</span>
                </div>
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏷️</span>
                  <span>Danh mục</span>
                </div>
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>📊</span>
                  <span>Tồn kho</span>
                </div>
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'right',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                  <span>💰</span>
                  <span>Giá</span>
                </div>
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏢</span>
                  <span>NCC</span>
                </div>
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>⚡</span>
                  <span>Trạng thái</span>
                </div>
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>⚙️</span>
                  <span>Thao tác</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part, index) => (
              <tr key={part.id} style={{
                borderBottom: '1px solid #f3f4f6',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: index % 2 === 0 ? '#ffffff' : '#fafbfc'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f9ff'
                e.currentTarget.style.transform = 'translateX(4px)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafbfc'
                e.currentTarget.style.transform = 'translateX(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              >
                <td style={{
                  padding: '20px 24px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)'
                    }} />
                    <span style={{
                      fontFamily: 'monospace',
                      background: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {part.id}
                    </span>
                  </div>
                </td>
                <td style={{
                  padding: '20px 24px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    }} />
                    <span style={{
                      fontFamily: 'monospace',
                      background: '#f1f5f9',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {part.partNumber}
                    </span>
                  </div>
                </td>
                <td style={{
                  padding: '20px 24px',
                  fontSize: '14px',
                  color: '#1f2937'
                }}>
                  <div style={{
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {part.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    Cập nhật: {part.lastUpdated}
                  </div>
                </td>
                <td style={{
                  padding: '20px 24px',
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    background: '#f3f4f6',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {part.category}
                  </span>
                </td>
                <td style={{
                  padding: '20px 24px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: part.stock < 15 ? '#ef4444' : part.stock < 25 ? '#f59e0b' : '#10b981'
                    }}>
                      {part.stock}
                    </span>
                    <div style={{
                      width: '40px',
                      height: '4px',
                      background: '#f3f4f6',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        background: part.stock < 15 ? '#ef4444' : part.stock < 25 ? '#f59e0b' : '#10b981',
                        width: `${Math.min((part.stock / 50) * 100, 100)}%`,
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                </td>
                <td style={{
                  padding: '20px 24px',
                  textAlign: 'right'
                }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {formatPrice(part.price)}
                  </div>
                </td>
                <td style={{
                  padding: '20px 24px',
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }}>
                      {part.supplier.charAt(0)}
                    </div>
                    <span style={{ fontWeight: '500' }}>
                      {part.supplier}
                    </span>
                  </div>
                </td>
                <td style={{
                  padding: '20px 24px',
                  textAlign: 'center'
                }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: getStatusColor(part.status),
                    boxShadow: `0 2px 4px ${getStatusColor(part.status)}40`
                  }}>
                    {part.status}
                  </span>
                </td>
                <td style={{
                  padding: '20px 24px',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => onEdit(part)}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)'
                      }}
                      title="Chỉnh sửa phụ tùng"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => onDelete(part.id)}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)'
                      }}
                      title="Xóa phụ tùng"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showPagination && onPageChange && onItemsPerPageChange && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderTop: '2px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Hiển thị <span style={{ fontWeight: '700', color: '#1f2937' }}>
                {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}
              </span> trong tổng số <span style={{ fontWeight: '700', color: '#1f2937' }}>
                {totalItems}
              </span> phụ tùng
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Hiển thị:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: currentPage === 1 ? '#f9fafb' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: currentPage === 1 ? '#9ca3af' : '#ffffff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                <span>←</span>
                <span>Trước</span>
              </button>
              
              <div style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '700',
                color: '#1f2937',
                background: '#f1f5f9',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>📄</span>
                <span>{currentPage} / {Math.ceil(totalItems / itemsPerPage)}</span>
              </div>
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: currentPage >= Math.ceil(totalItems / itemsPerPage) ? '#f9fafb' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: currentPage >= Math.ceil(totalItems / itemsPerPage) ? '#9ca3af' : '#ffffff',
                  cursor: currentPage >= Math.ceil(totalItems / itemsPerPage) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (currentPage < Math.ceil(totalItems / itemsPerPage)) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage < Math.ceil(totalItems / itemsPerPage)) {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                <span>Sau</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

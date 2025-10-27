interface BookingPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function BookingPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange
}: BookingPaginationProps) {
  if (totalPages <= 1) return null

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
      background: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      border: '0.5px solid #F1F5F9',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    }}>
      <div style={{ fontSize: '14px', color: '#6B7280' }}>
        Hiển thị <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> trong tổng số <strong>{totalItems}</strong> đặt lịch
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 16px',
            border: '1px solid #E5E7EB',
            background: 'white',
            color: '#111827',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          Trước
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: currentPage === page ? '#FFD875' : 'transparent',
              color: currentPage === page ? '#000' : '#6B7280',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: currentPage === page ? '600' : '500',
              cursor: 'pointer',
              minWidth: '40px',
              transition: 'all 0.2s ease'
            }}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 16px',
            border: '1px solid #E5E7EB',
            background: 'white',
            color: '#111827',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          Sau
        </button>
      </div>
    </div>
  )
}

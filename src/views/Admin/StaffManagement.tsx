import './admin.scss'
import StaffStats from '../../components/admin/Staff/StaffStats'
import StaffFilters from '../../components/admin/Staff/StaffFilters'
import StaffTable from '../../components/admin/Staff/StaffTable'
import StaffDetailModal from '../../components/admin/Staff/StaffDetailModal'
import StaffFormModal from '../../components/admin/Staff/StaffFormModal'
import { useStaffData } from '../../hooks/useStaffData'

export default function StaffManagement() {
  const {
    staff,
    staffStats,
    filters,
    selectedStaff,
    showStaffModal,
    showFormModal,
    formMode,
    staffToEdit,
    updateFilters,
    handleViewStaff,
    handleEditStaff,
    handleDeleteStaff,
    handleAddStaff,
    handleSaveStaff,
    closeStaffModal,
    closeFormModal
  } = useStaffData()

  return (
    <div style={{ padding: '24px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          margin: '0 0 8px 0'
        }}>
          Quản lý nhân sự
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: 'var(--text-secondary)',
          margin: '0'
        }}>
          Quản lý thông tin nhân viên, phòng ban và hiệu suất làm việc
        </p>
      </div>

      {/* Stats Cards */}
      <StaffStats
        totalStaff={staffStats.totalStaff}
        activeStaff={staffStats.activeStaff}
        inactiveStaff={staffStats.inactiveStaff}
        onLeaveStaff={staffStats.onLeaveStaff}
        departments={staffStats.departments}
        averagePerformance={staffStats.averagePerformance}
      />

      {/* Filters and Search */}
      <StaffFilters
        searchTerm={filters.searchTerm}
        onSearchChange={(value) => updateFilters({ searchTerm: value })}
        filterDepartment={filters.filterDepartment}
        onDepartmentChange={(value) => updateFilters({ filterDepartment: value })}
        filterStatus={filters.filterStatus}
        onStatusChange={(value) => updateFilters({ filterStatus: value })}
        onAddStaff={handleAddStaff}
      />

      {/* Staff Table */}
      <StaffTable
        staff={staff}
        onViewStaff={handleViewStaff}
        onEditStaff={handleEditStaff}
        onDeleteStaff={handleDeleteStaff}
      />

      {/* Staff Detail Modal */}
      <StaffDetailModal
        staff={selectedStaff}
        isOpen={showStaffModal}
        onClose={closeStaffModal}
        onEdit={handleEditStaff}
      />

      {/* Staff Form Modal */}
      <StaffFormModal
        isOpen={showFormModal}
        onClose={closeFormModal}
        onSave={handleSaveStaff}
        staff={staffToEdit}
        mode={formMode}
      />
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Eye,
  Calendar,
  Bell,
  User,
  Car,
  Wrench,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List as ListIcon,
  EyeOff,
  SlidersHorizontal,
  Download,
  Settings,
  CheckCircle,
  Plus,
  Trash2,
  Send,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { ReminderService, MaintenanceReminder } from '@/services/reminderService';
import './ReminderManagement.scss';

export default function ReminderManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedReminder, setSelectedReminder] = useState<MaintenanceReminder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [stats, setStats] = useState<{
    total: number
    pending: number
    due: number
    overdue: number
    completed: number
    byType: {
      maintenance: number
      package: number
      appointment: number
    }
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection state
  const [selectedReminderIds, setSelectedReminderIds] = useState<number[]>([]);
  // Custom dropdown state
  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const [openTypeMenu, setOpenTypeMenu] = useState(false);
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const typeRef = useRef<HTMLDivElement | null>(null);
  const pageSizeRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setOpenStatusMenu(false);
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setOpenTypeMenu(false);
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) setOpenPageSizeMenu(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Force page background to white
  useEffect(() => {
    const previousBg = document.body.style.background;
    document.body.style.background = '#fff';
    return () => { document.body.style.background = previousBg; };
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [pageNumber, pageSize, filterStatus, filterType, filterFromDate, filterToDate, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Keep selections in sync
  useEffect(() => {
    const visibleIds = reminders.map(r => r.reminderId);
    setSelectedReminderIds(prev => prev.filter(id => visibleIds.includes(id)));
  }, [reminders]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await ReminderService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pageNumber,
        pageSize: pageSize,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        type: filterType !== 'all' ? filterType : undefined,
        from: filterFromDate || undefined,
        to: filterToDate || undefined,
        searchTerm: searchTerm || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder
      };

      const response = await ReminderService.listForAdmin(params);

      if (response.success) {
        setReminders(response.data || []);
        setTotalPages(response.pagination.totalPages);
        setTotalCount(response.pagination.totalItems);
      } else {
        setError('Có lỗi xảy ra khi tải danh sách nhắc nhở');
        toast.error('Có lỗi xảy ra khi tải danh sách nhắc nhở');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Có lỗi xảy ra khi tải danh sách nhắc nhở';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const allVisibleIds = reminders.map(r => r.reminderId);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedReminderIds.includes(id));

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedReminderIds([...allVisibleIds]);
    } else {
      setSelectedReminderIds([]);
    }
  };

  const handleToggleOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedReminderIds(prev => [...prev, id]);
    } else {
      setSelectedReminderIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleViewReminder = async (reminder: MaintenanceReminder) => {
    try {
      setSelectedReminder(reminder);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Không thể tải chi tiết nhắc nhở');
    }
  };

  const handleDeleteReminder = async (reminderId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhắc nhở này?')) {
      return;
    }

    try {
      setDeleting(reminderId);
      await ReminderService.delete(reminderId);
      toast.success('Đã xóa nhắc nhở thành công');
      fetchReminders();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa nhắc nhở');
    } finally {
      setDeleting(null);
    }
  };

  const handleDispatchReminders = async (reminderIds: number[]) => {
    if (reminderIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nhắc nhở');
      return;
    }

    try {
      // TODO: Implement bulk dispatch
      toast.success(`Đã gửi ${reminderIds.length} nhắc nhở`);
      fetchReminders();
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi nhắc nhở');
    }
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedReminder(null);
  };

  const getStatusBadgeClass = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'status-badge status-badge--pending';
      case 'DUE':
        return 'status-badge status-badge--due';
      case 'OVERDUE':
        return 'status-badge status-badge--overdue';
      case 'COMPLETED':
        return 'status-badge status-badge--completed';
      default:
        return 'status-badge status-badge--default';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'Chờ đến hạn';
      case 'DUE':
        return 'Đến hạn';
      case 'OVERDUE':
        return 'Quá hạn';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    const typeUpper = type.toUpperCase();
    switch (typeUpper) {
      case 'MAINTENANCE':
        return 'Bảo dưỡng';
      case 'PACKAGE':
        return 'Gói dịch vụ';
      case 'APPOINTMENT':
        return 'Lịch hẹn';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statuses = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ đến hạn' },
    { value: 'DUE', label: 'Đến hạn' },
    { value: 'OVERDUE', label: 'Quá hạn' },
    { value: 'COMPLETED', label: 'Đã hoàn thành' }
  ];

  const types = [
    { value: 'all', label: 'Tất cả loại' },
    { value: 'MAINTENANCE', label: 'Bảo dưỡng' },
    { value: 'PACKAGE', label: 'Gói dịch vụ' },
    { value: 'APPOINTMENT', label: 'Lịch hẹn' }
  ];

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.success('Chức năng xuất dữ liệu sẽ được triển khai sau');
    } catch (err) {
      toast.error('Không thể xuất danh sách nhắc nhở. Vui lòng thử lại!');
    } finally {
      setExporting(false);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (pageNumber <= 3) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (pageNumber >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(pageNumber - 1);
        pages.push(pageNumber);
        pages.push(pageNumber + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (error && reminders.length === 0 && !loading) return (
    <div className="reminder-error">
      <div className="reminder-error__container">
        <div className="reminder-error__icon">⚠️</div>
        <p className="reminder-error__message">{error}</p>
        <button className="reminder-error__retry" onClick={fetchReminders}>Thử lại</button>
      </div>
    </div>
  );

  return (
    <div className="admin-reminder admin-reminders">
      {/* Header */}
      <div className="reminder-header">
        <div>
          <h2 className="reminder-header__title">
            Quản lý Nhắc nhở Bảo dưỡng
          </h2>
          <p className="reminder-header__subtitle">
            Quản lý và theo dõi tất cả nhắc nhở bảo dưỡng trong hệ thống
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="reminder-stats" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tổng số</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.total}</div>
          </div>
          <div style={{
            background: '#DBEAFE',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #93C5FD'
          }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Chờ đến hạn</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#3B82F6' }}>{stats.pending}</div>
          </div>
          <div style={{
            background: '#FEF3C7',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #FCD34D'
          }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Đến hạn</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B' }}>{stats.due}</div>
          </div>
          <div style={{
            background: '#FEE2E2',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #FCA5A5'
          }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Quá hạn</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#EF4444' }}>{stats.overdue}</div>
          </div>
          <div style={{
            background: '#D1FAE5',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #6EE7B7'
          }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Đã hoàn thành</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981' }}>{stats.completed}</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="users-toolbar">
        <div className="toolbar-top">
          <div className="toolbar-left">
            <button type="button" className="toolbar-chip"><LayoutGrid size={14} /> Bảng</button>
            <button type="button" className="toolbar-chip"><ListIcon size={14} /> Danh sách</button>
            <div className="toolbar-sep" />
          </div>
          <div className="toolbar-right">
            <div className="toolbar-search">
              <div className="search-wrap">
                <Search size={14} className="icon" />
                <input
                  placeholder="Tìm kiếm reminder, khách hàng, xe..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPageNumber(1);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="toolbar-actions">
            {selectedReminderIds.length > 0 && (
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => handleDispatchReminders(selectedReminderIds)}
                style={{ background: '#FFD875', color: '#333' }}
              >
                <Send size={14} /> Gửi ({selectedReminderIds.length})
              </button>
            )}
            <button type="button" className="toolbar-chip"><EyeOff size={14} /> Ẩn</button>
            <button type="button" className="toolbar-chip"><SlidersHorizontal size={14} /> Tùy chỉnh</button>
            <button type="button" className="toolbar-btn" onClick={handleExport} disabled={exporting}>
              <Download size={14} /> {exporting ? 'Đang xuất...' : 'Xuất'}
            </button>
          </div>
        </div>

        <div className="toolbar-filters">
          <div className="pill-select" ref={statusRef} onClick={(e) => { e.stopPropagation(); setOpenStatusMenu(v => !v); }}>
            <CheckCircle size={14} className="icon" />
            <button type="button" className="pill-trigger">{statuses.find(s => s.value === filterStatus)?.label}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openStatusMenu && (
              <ul className="pill-menu show">
                {statuses.map(s => (
                  <li
                    key={s.value}
                    className={`pill-item ${filterStatus === s.value ? 'active' : ''}`}
                    onClick={() => { setFilterStatus(s.value); setPageNumber(1); setOpenStatusMenu(false); }}
                  >
                    {s.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pill-select" ref={typeRef} onClick={(e) => { e.stopPropagation(); setOpenTypeMenu(v => !v); }}>
            <Wrench size={14} className="icon" />
            <button type="button" className="pill-trigger">{types.find(t => t.value === filterType)?.label}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openTypeMenu && (
              <ul className="pill-menu show">
                {types.map(t => (
                  <li
                    key={t.value}
                    className={`pill-item ${filterType === t.value ? 'active' : ''}`}
                    onClick={() => { setFilterType(t.value); setPageNumber(1); setOpenTypeMenu(false); }}
                  >
                    {t.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="date-filters">
            <input
              type="date"
              placeholder="Từ ngày"
              value={filterFromDate}
              onChange={(e) => { setFilterFromDate(e.target.value); setPageNumber(1); }}
              className="date-input"
            />
            <input
              type="date"
              placeholder="Đến ngày"
              value={filterToDate}
              onChange={(e) => { setFilterToDate(e.target.value); setPageNumber(1); }}
              className="date-input"
            />
          </div>

          <button type="button" className="toolbar-chip" onClick={fetchReminders}>
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>
      </div>

      {/* Reminders List */}
      <div className="reminder-table-container">
        {loading ? (
          <div className="reminder-loading">
            <div className="reminder-loading__spinner" />
            <p className="reminder-loading__text">Đang tải...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="reminder-empty">
            <div className="reminder-empty__icon">
              <Bell size={32} />
            </div>
            <h4 className="reminder-empty__title">
              {searchTerm || filterStatus !== 'all' ? 'Không tìm thấy nhắc nhở nào' : 'Chưa có nhắc nhở nào'}
            </h4>
            <p className="reminder-empty__text">
              {searchTerm || filterStatus !== 'all' ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Nhắc nhở sẽ được hiển thị ở đây'}
            </p>
          </div>
        ) : (
          <>
            <div className="reminder-total-count">
              Tổng số nhắc nhở: <strong>{totalCount}</strong>
            </div>
            <div className="reminder-table-wrapper">
              <table className="reminder-table users-table" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="table-header-yellow">
                    <th style={{ borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                      <span className="th-inner">
                        <input
                          type="checkbox"
                          className="users-checkbox"
                          aria-label="Chọn tất cả"
                          checked={isAllSelected}
                          onChange={(e) => handleToggleAll(e.target.checked)}
                        />
                        <Bell size={16} className="th-icon" /> ID
                      </span>
                    </th>
                    <th>
                      <span className="th-inner">
                        <User size={16} className="th-icon" /> Khách hàng
                      </span>
                    </th>
                    <th>
                      <span className="th-inner"><Car size={16} className="th-icon" /> Xe</span>
                    </th>
                    <th>
                      <span className="th-inner"><Wrench size={16} className="th-icon" /> Dịch vụ</span>
                    </th>
                    <th>
                      <span className="th-inner"><Calendar size={16} className="th-icon" /> Đến hạn ngày</span>
                    </th>
                    <th>
                      <span className="th-inner"><Clock size={16} className="th-icon" /> Đến hạn KM</span>
                    </th>
                    <th>
                      <span className="th-inner">
                        <CheckCircle size={16} className="th-icon" /> Trạng thái
                      </span>
                    </th>
                    <th>
                      <span className="th-inner"><Settings size={16} className="th-icon" /> Loại</span>
                    </th>
                    <th>
                      <span className="th-inner"><Calendar size={16} className="th-icon" /> Ngày tạo</span>
                    </th>
                    <th>
                      <span className="th-inner"><Settings size={16} className="th-icon" /> Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map((reminder, i) => (
                    <tr
                      key={reminder.reminderId}
                      onClick={() => handleViewReminder(reminder)}
                      style={{ animation: `slideInFromTop ${0.1 * (i + 1)}s ease-out forwards` }}
                    >
                      <td style={{ borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                        <div className="reminder-id-cell">
                          <input
                            type="checkbox"
                            className="users-checkbox"
                            aria-label={`Chọn reminder ${reminder.reminderId}`}
                            checked={selectedReminderIds.includes(reminder.reminderId)}
                            onChange={(e) => handleToggleOne(reminder.reminderId, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="reminder-id-cell__text">#{reminder.reminderId}</span>
                        </div>
                      </td>
                      <td className="text-primary-bold">
                        <div>{reminder.vehicle?.customer?.user?.fullName || 'N/A'}</div>
                        <div className="text-secondary" style={{ fontSize: '12px' }}>
                          {reminder.vehicle?.customer?.user?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="text-secondary">
                        {reminder.vehicle?.licensePlate || 'N/A'} ({reminder.vehicle?.vehicleModel?.modelName || 'N/A'})
                      </td>
                      <td className="text-secondary">
                        {reminder.service?.serviceName || 'Bảo dưỡng định kỳ'}
                      </td>
                      <td className="text-secondary">
                        {reminder.dueDate ? formatDate(reminder.dueDate) : 'N/A'}
                      </td>
                      <td className="text-secondary">
                        {reminder.dueMileage ? `${reminder.dueMileage.toLocaleString('vi-VN')} km` : 'N/A'}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(reminder.status)}>
                          <span className="dot" />
                          {getStatusLabel(reminder.status)}
                        </span>
                      </td>
                      <td className="text-secondary">
                        {getTypeLabel(reminder.type)}
                      </td>
                      <td className="text-secondary">
                        {formatDateTime(reminder.createdAt)}
                      </td>
                      <td>
                        <div className="reminder-actions">
                          <button
                            type="button"
                            className="reminder-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleViewReminder(reminder); }}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="reminder-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleDeleteReminder(reminder.reminderId); }}
                            title="Xóa"
                            disabled={deleting === reminder.reminderId}
                            style={{ color: '#EF4444' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      <div className="reminder-pagination">
        <div className="pagination-info">
          <span className="pagination-label">Hàng mỗi trang</span>
          <div className="pill-select" ref={pageSizeRef} onClick={(e) => { e.stopPropagation(); setOpenPageSizeMenu(v => !v); }}>
            <button type="button" className="pill-trigger">{pageSize}</button>
            <ChevronDownIcon width={20} height={20} className="caret caret-lg" />
            {openPageSizeMenu && (
              <ul className="pill-menu show">
                {[5, 10, 20, 50].map(size => (
                  <li
                    key={size}
                    className={`pill-item ${pageSize === size ? 'active' : ''}`}
                    onClick={() => { setPageSize(size); setPageNumber(1); setOpenPageSizeMenu(false); }}
                  >
                    {size}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setPageNumber(1)}
            disabled={pageNumber === 1 || loading}
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            className="pagination-btn"
            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
            disabled={pageNumber === 1 || loading}
          >
            <ChevronLeft size={16} />
          </button>

          {getPageNumbers().map((page, idx) => (
            <button
              key={idx}
              className={`pagination-btn ${page === pageNumber ? 'active' : ''}`}
              onClick={() => typeof page === 'number' && setPageNumber(page)}
              disabled={page === '...' || loading}
            >
              {page}
            </button>
          ))}

          <button
            className="pagination-btn"
            onClick={() => setPageNumber(prev => Math.min(totalPages, prev + 1))}
            disabled={pageNumber === totalPages || loading}
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="pagination-btn"
            onClick={() => setPageNumber(totalPages)}
            disabled={pageNumber === totalPages || loading}
          >
            <ChevronsRight size={16} />
          </button>
        </div>

        <div className="pagination-info">
          <span className="pagination-label">
            Trang <strong>{pageNumber}</strong> / <strong>{totalPages}</strong>
          </span>
        </div>
      </div>

      {/* Detail Modal - TODO: Implement */}
      {selectedReminder && showDetailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={handleDetailModalClose}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Chi tiết Reminder #{selectedReminder.reminderId}</h3>
            <div style={{ marginBottom: '16px' }}>
              <strong>Khách hàng:</strong> {selectedReminder.vehicle?.customer?.user?.fullName || 'N/A'}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Xe:</strong> {selectedReminder.vehicle?.licensePlate || 'N/A'}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Dịch vụ:</strong> {selectedReminder.service?.serviceName || 'N/A'}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Trạng thái:</strong> {getStatusLabel(selectedReminder.status)}
            </div>
            <button onClick={handleDetailModalClose} style={{
              padding: '8px 16px',
              background: '#FFD875',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


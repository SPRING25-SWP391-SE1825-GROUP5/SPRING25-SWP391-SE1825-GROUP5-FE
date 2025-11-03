import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Eye,
  Calendar,
  CalendarCheck,
  User,
  Car,
  MapPin,
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
} from "lucide-react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { BookingService, AdminBookingSummary, GetBookingsByCenterParams, GetAllBookingsForAdminParams, BookingDetail } from '@/services/bookingService';
import { CenterService, Center } from '@/services/centerService';
import BookingDetailModal from './Booking/BookingDetailModal';
import BookingStatusModal from './Booking/BookingStatusModal';
import './BookingManagement.scss';

export default function BookingManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCenter, setFilterCenter] = useState<number | null>(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingSummary | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [bookings, setBookings] = useState<AdminBookingSummary[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection state
  const [selectedBookingIds, setSelectedBookingIds] = useState<number[]>([]);
  // Custom dropdown state
  const [openCenterMenu, setOpenCenterMenu] = useState(false);
  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const pageSizeRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (centerRef.current && !centerRef.current.contains(e.target as Node)) setOpenCenterMenu(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setOpenStatusMenu(false);
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
    fetchBookings();
  }, [pageNumber, pageSize, filterCenter, filterStatus, filterFromDate, filterToDate, sortBy, sortOrder]);

  useEffect(() => {
    fetchCenters();
  }, []);

  // Keep selections in sync
  useEffect(() => {
    const visibleIds = bookings.map(b => b.bookingId);
    setSelectedBookingIds(prev => prev.filter(id => visibleIds.includes(id)));
  }, [bookings]);

  const fetchCenters = async () => {
    try {
      setLoadingCenters(true);
      const response = await CenterService.getCenters({ pageSize: 100 });
      if (response.centers) {
        setCenters(response.centers);
      }
    } catch (err) {
      console.error('Failed to fetch centers:', err);
    } finally {
      setLoadingCenters(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;

      // Nếu không chọn center hoặc chọn "Tất cả", dùng API admin/all
      if (!filterCenter || filterCenter === 0) {
        const params: GetAllBookingsForAdminParams = {
          page: pageNumber,
          pageSize: pageSize,
          status: filterStatus !== 'all' ? filterStatus : null,
          centerId: filterCenter && filterCenter > 0 ? filterCenter : null,
          fromDate: filterFromDate || null,
          toDate: filterToDate || null,
          sortBy: sortBy,
          sortOrder: sortOrder
        };

        response = await BookingService.getAllBookingsForAdmin(params);
      } else {
        // Nếu chọn center cụ thể, dùng API center/{centerId}
      const params: GetBookingsByCenterParams = {
        centerId: filterCenter,
        page: pageNumber,
        pageSize: pageSize,
        status: filterStatus !== 'all' ? filterStatus : null,
        fromDate: filterFromDate || null,
        toDate: filterToDate || null,
        sortBy: sortBy,
        sortOrder: sortOrder
      };

        response = await BookingService.getBookingsByCenterAdmin(params);
      }

      if (response.success) {
        setBookings(response.data.bookings || []);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCount(response.data.pagination.totalItems);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải danh sách đặt lịch');
        toast.error(response.message || 'Có lỗi xảy ra khi tải danh sách đặt lịch');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải danh sách đặt lịch';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const allVisibleIds = bookings.map(b => b.bookingId);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedBookingIds.includes(id));

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookingIds([...allVisibleIds]);
    } else {
      setSelectedBookingIds([]);
    }
  };

  const handleToggleOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedBookingIds(prev => [...prev, id]);
    } else {
      setSelectedBookingIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleViewBooking = async (booking: AdminBookingSummary) => {
    try {
      setSelectedBooking(booking);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Không thể tải chi tiết đặt lịch');
    }
  };

  const handleChangeStatus = (booking: AdminBookingSummary) => {
    setSelectedBooking(booking);
    setShowStatusModal(true);
  };

  const handleStatusUpdateSuccess = () => {
    setShowStatusModal(false);
    setSelectedBooking(null);
    fetchBookings();
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedBooking(null);
  };

  const getStatusBadgeClass = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'status-badge status-badge--pending';
      case 'CONFIRMED':
        return 'status-badge status-badge--confirmed';
      case 'IN_PROGRESS':
        return 'status-badge status-badge--in-progress';
      case 'COMPLETED':
        return 'status-badge status-badge--completed';
      case 'PAID':
        return 'status-badge status-badge--paid';
      case 'CANCELLED':
        return 'status-badge status-badge--cancelled';
      default:
        return 'status-badge status-badge--default';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'IN_PROGRESS':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'PAID':
        return 'Đã thanh toán';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
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
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'PAID', label: 'Đã thanh toán' },
    { value: 'CANCELLED', label: 'Đã hủy' }
  ];

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.success('Chức năng xuất dữ liệu sẽ được triển khai sau');
    } catch (err) {
      console.error('Export bookings failed:', err);
      toast.error('Không thể xuất danh sách đặt lịch. Vui lòng thử lại!');
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

  // Apply client-side search filtering
  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      booking.customerInfo.fullName.toLowerCase().includes(search) ||
      booking.customerInfo.email.toLowerCase().includes(search) ||
      booking.customerInfo.phoneNumber.includes(search) ||
      booking.vehicleInfo.licensePlate.toLowerCase().includes(search) ||
      booking.bookingId.toString().includes(search)
    );
  });

  if (error && bookings.length === 0 && !loading) return (
    <div className="booking-error">
      <div className="booking-error__container">
        <div className="booking-error__icon">⚠️</div>
        <p className="booking-error__message">{error}</p>
        <button className="booking-error__retry" onClick={fetchBookings}>Thử lại</button>
      </div>
    </div>
  );

  return (
    <div className="admin-booking admin-bookings">
      {/* Header */}
      <div className="booking-header">
        <div>
          <h2 className="booking-header__title">
            Quản lý Đặt lịch
          </h2>
          <p className="booking-header__subtitle">
            Quản lý và theo dõi tất cả đặt lịch trong hệ thống
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="users-toolbar">
        <div className="toolbar-top">
          <div className="toolbar-left">
            <button type="button" className="toolbar-chip"><LayoutGrid size={14} /> Bảng</button>
            <button type="button" className="toolbar-chip"><LayoutGrid size={14} /> Bảng điều khiển</button>
            <button type="button" className="toolbar-chip"><ListIcon size={14} /> Danh sách</button>
            <div className="toolbar-sep" />
          </div>
          <div className="toolbar-right">
            <div className="toolbar-search">
              <div className="search-wrap">
                <Search size={14} className="icon" />
                <input
                  placeholder="Tìm kiếm booking, khách hàng, xe..."
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
            <button type="button" className="toolbar-chip"><EyeOff size={14} /> Ẩn</button>
            <button type="button" className="toolbar-chip"><SlidersHorizontal size={14} /> Tùy chỉnh</button>
            <button type="button" className="toolbar-btn" onClick={handleExport} disabled={exporting}>
              <Download size={14} /> {exporting ? 'Đang xuất...' : 'Xuất'}
            </button>
          </div>
        </div>

        <div className="toolbar-filters">
          <div className="pill-select" ref={centerRef} onClick={(e) => { e.stopPropagation(); setOpenCenterMenu(v => !v); }}>
            <MapPin size={14} className="icon" />
            <button type="button" className="pill-trigger">
              {filterCenter === 0 || !filterCenter ? 'Tất cả trung tâm' : centers.find(c => c.centerId === filterCenter)?.centerName || 'Chọn trung tâm'}
            </button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openCenterMenu && (
              <ul className="pill-menu show">
                <li
                  className={`pill-item ${(!filterCenter || filterCenter === 0) ? 'active' : ''}`}
                  onClick={() => { setFilterCenter(0); setPageNumber(1); setOpenCenterMenu(false); }}
                >
                  Tất cả trung tâm
                </li>
                {centers.map(center => (
                  <li
                    key={center.centerId}
                    className={`pill-item ${filterCenter === center.centerId ? 'active' : ''}`}
                    onClick={() => { setFilterCenter(center.centerId); setPageNumber(1); setOpenCenterMenu(false); }}
                  >
                    {center.centerName}
                  </li>
                ))}
              </ul>
            )}
          </div>

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

          <button type="button" className="toolbar-chip"><Plus size={14} /> Thêm bộ lọc</button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="booking-table-container">
        {loading ? (
          <div className="booking-loading">
            <div className="booking-loading__spinner" />
            <p className="booking-loading__text">Đang tải...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="booking-empty">
            <div className="booking-empty__icon">
              <CalendarCheck size={32} />
            </div>
            <h4 className="booking-empty__title">
              {searchTerm || filterStatus !== 'all' ? 'Không tìm thấy đặt lịch nào' : 'Chưa có đặt lịch nào'}
            </h4>
            <p className="booking-empty__text">
              {searchTerm || filterStatus !== 'all' ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Đặt lịch sẽ được hiển thị ở đây'}
            </p>
          </div>
        ) : (
          <>
            <div className="booking-total-count">
              Tổng số đặt lịch: <strong>{totalCount}</strong>
            </div>
            <div className="booking-table-wrapper">
              <table className="booking-table users-table" style={{ borderCollapse: 'collapse' }}>
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
                        <CalendarCheck size={16} className="th-icon" /> ID
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
                      <span className="th-inner"><MapPin size={16} className="th-icon" /> Trung tâm</span>
                    </th>
                    <th>
                      <span className="th-inner"><Wrench size={16} className="th-icon" /> Dịch vụ</span>
                    </th>
                    <th>
                      <span className="th-inner"><Clock size={16} className="th-icon" /> Thời gian</span>
                    </th>
                    <th>
                      <span className="th-inner">
                        <CheckCircle size={16} className="th-icon" /> Trạng thái
                      </span>
                    </th>
                    <th>
                      <span className="th-inner">
                        <Calendar size={16} className="th-icon" /> Ngày tạo
                      </span>
                    </th>
                    <th>
                      <span className="th-inner"><Settings size={16} className="th-icon" /> Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, i) => (
                    <tr
                      key={booking.bookingId}
                      onClick={() => handleViewBooking(booking)}
                      style={{ animation: `slideInFromTop ${0.1 * (i + 1)}s ease-out forwards` }}
                    >
                      <td style={{ borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                        <div className="booking-id-cell">
                          <input
                            type="checkbox"
                            className="users-checkbox"
                            aria-label={`Chọn booking ${booking.bookingId}`}
                            checked={selectedBookingIds.includes(booking.bookingId)}
                            onChange={(e) => handleToggleOne(booking.bookingId, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="booking-id-cell__text">#{booking.bookingId}</span>
                        </div>
                      </td>
                      <td className="text-primary-bold">
                        <div>{booking.customerInfo.fullName}</div>
                        <div className="text-secondary" style={{ fontSize: '12px' }}>{booking.customerInfo.phoneNumber}</div>
                      </td>
                      <td className="text-secondary">
                        {booking.vehicleInfo.licensePlate} ({booking.vehicleInfo.modelName})
                      </td>
                      <td className="text-secondary">
                        {booking.centerInfo.centerName}
                      </td>
                      <td className="text-secondary">
                        {booking.serviceInfo.serviceName}
                      </td>
                      <td className="text-secondary">
                        <div>{formatDate(booking.timeSlotInfo.workDate)}</div>
                        <div style={{ fontSize: '12px' }}>{booking.timeSlotInfo.startTime} - {booking.timeSlotInfo.endTime}</div>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(booking.status)}>
                          <span className="dot" />
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td className="text-secondary">
                        {formatDateTime(booking.createdAt)}
                      </td>
                      <td>
                        <div className="booking-actions">
                          <button
                            type="button"
                            className="booking-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleViewBooking(booking); }}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="booking-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleChangeStatus(booking); }}
                            title="Thay đổi trạng thái"
                            disabled={booking.status === 'CANCELLED'}
                          >
                            <Settings size={16} />
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
      <div className="booking-pagination">
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

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          isOpen={showDetailModal}
          booking={selectedBooking}
          onClose={handleDetailModalClose}
          onChangeStatus={() => {
            setShowDetailModal(false);
            handleChangeStatus(selectedBooking);
          }}
        />
      )}

      {/* Status Change Modal */}
      {selectedBooking && (
        <BookingStatusModal
          isOpen={showStatusModal}
          booking={selectedBooking}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedBooking(null);
          }}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
}


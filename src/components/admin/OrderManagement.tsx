import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Eye,
  Calendar,
  ShoppingCart,
  User,
  DollarSign,
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
  Edit,
} from "lucide-react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { OrderService } from '@/services/orderService';
import ConfirmModal from '../chat/ConfirmModal';
import './BookingManagement.scss';

interface Order {
  orderId: number;
  orderNumber?: string;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function OrderManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const [allOrders, setAllOrders] = useState<Order[]>([]); // Store all orders from API
  const [orders, setOrders] = useState<Order[]>([]); // Displayed orders after filtering/pagination
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  // Custom dropdown state
  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const pageSizeRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
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

  // Fetch orders only once on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter and paginate when filters or pagination change
  useEffect(() => {
    filterAndPaginateOrders();
  }, [allOrders, pageNumber, pageSize, filterStatus, filterFromDate, filterToDate, sortBy, sortOrder, searchTerm]);

  // Keep selections in sync
  useEffect(() => {
    const visibleIds = orders.map(o => o.orderId);
    setSelectedOrderIds(prev => prev.filter(id => visibleIds.includes(id)));
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Backend currently returns all orders without pagination/filter
      // We'll do client-side filtering and pagination
      const response = await OrderService.getAllOrders();

      if (response.success) {
        const ordersData = Array.isArray(response.data) ? response.data : [];
        setAllOrders(ordersData);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải danh sách đơn hàng');
        toast.error(response.message || 'Có lỗi xảy ra khi tải danh sách đơn hàng');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải danh sách đơn hàng';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterAndPaginateOrders = useCallback(() => {
    let filteredData = [...allOrders];

    // Client-side filtering by status
    if (filterStatus !== 'all') {
      filteredData = filteredData.filter((order: Order) =>
        (order.status || '').toUpperCase() === filterStatus.toUpperCase()
      );
    }

    // Client-side filtering by date range
    if (filterFromDate) {
      const fromDate = new Date(filterFromDate);
      fromDate.setHours(0, 0, 0, 0);
      filteredData = filteredData.filter((order: Order) => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate >= fromDate;
      });
    }

    if (filterToDate) {
      const toDate = new Date(filterToDate);
      toDate.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter((order: Order) => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return orderDate <= toDate;
      });
    }

    // Client-side search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredData = filteredData.filter((order: Order) => {
        return (
          (order.orderNumber || '').toLowerCase().includes(search) ||
          (order.customerName || '').toLowerCase().includes(search) ||
          (order.customerPhone || '').includes(search) ||
          order.orderId.toString().includes(search)
        );
      });
    }

    // Sort orders
    filteredData.sort((a: Order, b: Order) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case 'totalAmount':
          aValue = a.totalAmount || 0;
          bValue = b.totalAmount || 0;
          break;
        case 'orderId':
        default:
          aValue = a.orderId;
          bValue = b.orderId;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // Update total count and pages
    setTotalCount(filteredData.length);
    setTotalPages(Math.ceil(filteredData.length / pageSize));

    // Client-side pagination
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrders = filteredData.slice(startIndex, endIndex);

    setOrders(paginatedOrders);
  }, [allOrders, pageNumber, pageSize, filterStatus, filterFromDate, filterToDate, sortBy, sortOrder, searchTerm]);

  const allVisibleIds = orders.map(o => o.orderId);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedOrderIds.includes(id));

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds([...allVisibleIds]);
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(prev => [...prev, id]);
    } else {
      setSelectedOrderIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleViewOrder = async (order: Order) => {
    try {
      setSelectedOrder(order);
      setShowDetailModal(true);
      // Load order items
      const itemsResponse = await OrderService.getOrderItems(order.orderId);
      if (itemsResponse.success && itemsResponse.data) {
        setOrderItems(Array.isArray(itemsResponse.data) ? itemsResponse.data : []);
      }
    } catch (err) {
      toast.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const handleChangeStatus = (order: Order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      const response = await OrderService.updateOrderStatus(selectedOrder.orderId, newStatus);
      if (response.success) {
        toast.success('Cập nhật trạng thái đơn hàng thành công');
        setShowStatusModal(false);
        setSelectedOrder(null);
        // Update the order in allOrders state
        setAllOrders(prev => prev.map(order =>
          order.orderId === selectedOrder.orderId
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        ));
      } else {
        toast.error(response.message || 'Không thể cập nhật trạng thái');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleDeleteOrder = () => {
    if (!selectedOrder) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteOrder = async () => {
    if (!selectedOrder) return;
    try {
      const response = await OrderService.deleteOrder(selectedOrder.orderId);
      if (response.success) {
        toast.success('Xóa đơn hàng thành công');
        setShowDeleteModal(false);
        setSelectedOrder(null);
        // Remove the order from allOrders state
        setAllOrders(prev => prev.filter(order => order.orderId !== selectedOrder.orderId));
      } else {
        toast.error(response.message || 'Không thể xóa đơn hàng');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa đơn hàng');
    }
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const getStatusBadgeClass = (status: string) => {
    const statusUpper = (status || '').toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'status-badge status-badge--pending';
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'status-badge status-badge--confirmed';
      case 'PAID':
        return 'status-badge status-badge--paid';
      case 'COMPLETED':
        return 'status-badge status-badge--completed';
      case 'CANCELLED':
      case 'CANCELED':
        return 'status-badge status-badge--cancelled';
      case 'FAILED':
        return 'status-badge status-badge--cancelled';
      case 'REFUNDED':
        return 'status-badge status-badge--default';
      default:
        return 'status-badge status-badge--default';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusUpper = (status || '').toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'PAID':
        return 'Đã thanh toán';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
      case 'CANCELED':
        return 'Đã hủy';
      case 'FAILED':
        return 'Thất bại';
      case 'REFUNDED':
        return 'Đã hoàn tiền';
      default:
        return status || 'Không xác định';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const statuses = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'PROCESSING', label: 'Đang xử lý' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PAID', label: 'Đã thanh toán' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'FAILED', label: 'Thất bại' },
    { value: 'REFUNDED', label: 'Đã hoàn tiền' }
  ];

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await OrderService.exportOrders();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Xuất file Excel thành công');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xuất danh sách đơn hàng. Vui lòng thử lại!');
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

  // Orders are already filtered and paginated in fetchOrders
  const filteredOrders = orders;

  if (error && orders.length === 0 && !loading) return (
    <div className="booking-error">
      <div className="booking-error__container">
        <div className="booking-error__icon">⚠️</div>
        <p className="booking-error__message">{error}</p>
        <button className="booking-error__retry" onClick={fetchOrders}>Thử lại</button>
      </div>
    </div>
  );

  return (
    <div className="admin-booking admin-bookings">
      {/* Header */}
      <div className="booking-header">
        <div>
          <h2 className="booking-header__title">
            Quản lý Đơn hàng
          </h2>
          <p className="booking-header__subtitle">
            Quản lý và theo dõi tất cả đơn hàng trong hệ thống
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
                  placeholder="Tìm kiếm đơn hàng, khách hàng, số điện thoại..."
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

      {/* Orders List */}
      <div className="booking-table-container">
        {loading ? (
          <div className="booking-loading">
            <div className="booking-loading__spinner" />
            <p className="booking-loading__text">Đang tải...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="booking-empty">
            <div className="booking-empty__icon">
              <ShoppingCart size={32} />
            </div>
            <h4 className="booking-empty__title">
              {searchTerm || filterStatus !== 'all' ? 'Không tìm thấy đơn hàng nào' : 'Chưa có đơn hàng nào'}
            </h4>
            <p className="booking-empty__text">
              {searchTerm || filterStatus !== 'all' ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Đơn hàng sẽ được hiển thị ở đây'}
            </p>
          </div>
        ) : (
          <>
            <div className="booking-total-count">
              Tổng số đơn hàng: <strong>{totalCount}</strong>
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
                        <ShoppingCart size={16} className="th-icon" /> ID
                      </span>
                    </th>
                    <th>
                      <span className="th-inner">
                        <User size={16} className="th-icon" /> Khách hàng
                      </span>
                    </th>
                    <th>
                      <span className="th-inner"><DollarSign size={16} className="th-icon" /> Tổng tiền</span>
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
                      <span className="th-inner">
                        <Clock size={16} className="th-icon" /> Cập nhật
                      </span>
                    </th>
                    <th>
                      <span className="th-inner"><Settings size={16} className="th-icon" /> Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, i) => (
                    <tr
                      key={order.orderId}
                      onClick={() => handleViewOrder(order)}
                      style={{ animation: `slideInFromTop ${0.1 * (i + 1)}s ease-out forwards` }}
                    >
                      <td style={{ borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                        <div className="booking-id-cell">
                          <input
                            type="checkbox"
                            className="users-checkbox"
                            aria-label={`Chọn đơn hàng ${order.orderId}`}
                            checked={selectedOrderIds.includes(order.orderId)}
                            onChange={(e) => handleToggleOne(order.orderId, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="booking-id-cell__text">#{order.orderNumber || order.orderId}</span>
                        </div>
                      </td>
                      <td className="text-primary-bold">
                        <div>{order.customerName || 'Khách hàng'}</div>
                        <div className="text-secondary" style={{ fontSize: '12px' }}>{order.customerPhone || 'N/A'}</div>
                      </td>
                      <td className="text-primary-bold">
                        {formatCurrency(order.totalAmount || 0)}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(order.status || '')}>
                          <span className="dot" />
                          {getStatusLabel(order.status || '')}
                        </span>
                      </td>
                      <td className="text-secondary">
                        {formatDateTime(order.createdAt || '')}
                      </td>
                      <td className="text-secondary">
                        {formatDateTime(order.updatedAt || order.createdAt || '')}
                      </td>
                      <td>
                        <div className="booking-actions">
                          <button
                            type="button"
                            className="booking-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleViewOrder(order); }}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="booking-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleChangeStatus(order); }}
                            title="Thay đổi trạng thái"
                            disabled={order.status === 'CANCELLED' || order.status === 'CANCELED'}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            className="booking-action-btn"
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); handleDeleteOrder(); }}
                            title="Xóa đơn hàng"
                            style={{ color: '#ef4444' }}
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
      {selectedOrder && showDetailModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={handleDetailModalClose}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Chi tiết đơn hàng #{selectedOrder.orderNumber || selectedOrder.orderId}</h3>
              <button onClick={handleDetailModalClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <strong>Khách hàng:</strong> {selectedOrder.customerName || 'N/A'}
              </div>
              <div>
                <strong>Số điện thoại:</strong> {selectedOrder.customerPhone || 'N/A'}
              </div>
              <div>
                <strong>Tổng tiền:</strong> {formatCurrency(selectedOrder.totalAmount || 0)}
              </div>
              <div>
                <strong>Trạng thái:</strong> <span className={getStatusBadgeClass(selectedOrder.status || '')}>
                  {getStatusLabel(selectedOrder.status || '')}
                </span>
              </div>
              <div>
                <strong>Ngày tạo:</strong> {formatDateTime(selectedOrder.createdAt || '')}
              </div>
              {orderItems.length > 0 && (
                <div>
                  <strong>Chi tiết sản phẩm:</strong>
                  <div style={{ marginTop: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                    {orderItems.map((item: any, idx: number) => (
                      <div key={idx} style={{ padding: '8px 0', borderBottom: idx < orderItems.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div>{item.partName || item.serviceName || `Sản phẩm #${item.partId || ''}`}</div>
                            {item.quantity && <div style={{ fontSize: '12px', color: '#6B7280' }}>Số lượng: {item.quantity}</div>}
                          </div>
                          <div style={{ fontWeight: '500' }}>{formatCurrency(item.totalPrice || item.unitPrice || 0)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleChangeStatus(selectedOrder);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--primary-500)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Thay đổi trạng thái
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {selectedOrder && showStatusModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={() => {
            setShowStatusModal(false);
            setSelectedOrder(null);
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Thay đổi trạng thái đơn hàng</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {statuses.filter(s => s.value !== 'all').map(status => (
                <button
                  key={status.value}
                  onClick={() => handleUpdateStatus(status.value)}
                  style={{
                    padding: '10px 16px',
                    background: selectedOrder.status === status.value ? 'var(--primary-500)' : '#f3f4f6',
                    color: selectedOrder.status === status.value ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {status.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowStatusModal(false);
                setSelectedOrder(null);
              }}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        message={`Bạn có chắc chắn muốn xóa đơn hàng #${selectedOrder?.orderNumber || selectedOrder?.orderId}? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={confirmDeleteOrder}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedOrder(null);
        }}
        type="delete"
      />
    </div>
  );
}


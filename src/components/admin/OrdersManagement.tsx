import { useState, useEffect, useRef } from "react";
import {
  Search,
  Eye,
  ShoppingCart,
  User,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List as ListIcon,
  EyeOff,
  SlidersHorizontal,
  Download,
  CheckCircle,
} from "lucide-react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { OrderService } from '@/services/orderService';
import OrderDetailModal from './Order/OrderDetailModal';
import './BookingManagement.scss'; // Reuse booking styles

export default function OrdersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Mặc định 10 dòng mỗi trang
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Order detail modal state
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  useEffect(() => {
    fetchOrders();
  }, [pageNumber, pageSize, filterStatus, filterFromDate, filterToDate, sortBy, sortOrder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        pageNumber,
        pageSize,
        searchTerm: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        fromDate: filterFromDate || undefined,
        toDate: filterToDate || undefined,
        sortBy,
        sortOrder,
      };

      const response = await OrderService.getAllOrders(params);

      // Debug: Log response để kiểm tra cấu trúc
      console.log('Orders API Response:', response);

      // Xử lý nhiều cấu trúc response khác nhau
      let ordersData: any[] = [];
      let totalPagesValue = 1;
      let totalCountValue = 0;

      if (response.success) {
        // Case 1: response.data.items hoặc response.data.Items
        if (response.data) {
          // Kiểm tra nếu response.data là array
          if (Array.isArray(response.data)) {
            ordersData = response.data;
            totalCountValue = response.data.length;
          } else {
            // response.data là object với items/Items
            const dataObj = response.data as {
              items?: any[]
              Items?: any[]
              totalCount?: number
              TotalCount?: number
              totalPages?: number
              TotalPages?: number
              [key: string]: any
            }
            ordersData = dataObj.items || dataObj.Items || [];
            // Ưu tiên lấy totalCount trước, sau đó tính totalPages
            totalCountValue = dataObj.totalCount || dataObj.TotalCount || ordersData.length;
            totalPagesValue = dataObj.totalPages || dataObj.TotalPages || 1;
          }

          // Nếu có totalCount nhưng totalPages = 1 và totalCount > pageSize, tính lại totalPages
          if (totalCountValue > pageSize && totalPagesValue === 1) {
            totalPagesValue = Math.ceil(totalCountValue / pageSize);
          }
        }
        // Case 2: response trực tiếp là array (không có trong type nhưng xử lý để an toàn)
        else if (Array.isArray(response as any)) {
          ordersData = response as any;
          totalCountValue = (response as any).length;
        }
      } else {
        // Nếu không có success flag, thử lấy data trực tiếp
        if (response.data) {
          if (Array.isArray(response.data)) {
            ordersData = response.data;
            totalCountValue = response.data.length;
          } else {
            const dataObj = response.data as {
              items?: any[]
              Items?: any[]
              [key: string]: any
            }
            ordersData = dataObj.items || dataObj.Items || [];
            totalCountValue = ordersData.length;
          }
        }
      }

      console.log('Parsed Orders Data:', ordersData);
      console.log('Total Count:', totalCountValue);
      console.log('Total Pages from API:', totalPagesValue);
      console.log('Page Size:', pageSize);
      console.log('Page Number:', pageNumber);

      // Tính toán totalPages dựa trên totalCount và pageSize
      // Ưu tiên: totalCount từ API > totalPages từ API > tính từ ordersData.length
      const finalTotalCount = totalCountValue || ordersData.length;
      let finalTotalPages = totalPagesValue;

      // Nếu totalPages = 1 nhưng có nhiều items hơn pageSize, tính lại totalPages
      if (finalTotalPages === 1 && finalTotalCount > pageSize) {
        // Backend trả về tất cả items hoặc totalPages không đúng, tính lại
        finalTotalPages = Math.ceil(finalTotalCount / pageSize);
        console.log('Tính lại totalPages từ totalCount:', finalTotalPages, '(totalCount:', finalTotalCount, ', pageSize:', pageSize, ')');
      } else if (finalTotalPages === 1 && finalTotalCount <= pageSize) {
        // Đúng rồi, chỉ có 1 trang
        finalTotalPages = 1;
      } else if (finalTotalPages > 1) {
        // Backend đã trả về totalPages đúng, giữ nguyên
        finalTotalPages = totalPagesValue;
      } else {
        // Fallback: tính từ totalCount
        finalTotalPages = Math.ceil(finalTotalCount / pageSize);
        console.log('Fallback: tính totalPages từ totalCount:', finalTotalPages);
      }

      console.log('Final Total Pages:', finalTotalPages);
      console.log('Final Total Count:', finalTotalCount);

      setOrders(ordersData);
      setTotalPages(finalTotalPages);
      setTotalCount(finalTotalCount);

      if (ordersData.length === 0 && !response.success) {
        setError(response.message || 'Không có dữ liệu đơn hàng');
      }
    } catch (err: any) {
      console.error('Fetch Orders Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải danh sách đơn hàng';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (order: any) => {
    try {
      const orderId = order.orderId || order.id || order.OrderId || order.orderID || order.Id;
      if (orderId) {
        setSelectedOrderId(orderId);
        setShowDetailModal(true);
      } else {
        toast.error('Không tìm thấy mã đơn hàng');
      }
    } catch (err) {
      toast.error('Không thể mở chi tiết đơn hàng');
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOrderId(null);
  };

  const getStatusBadgeClass = (status: string) => {
    const statusUpper = (status || '').toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'status-badge status-badge--pending';
      case 'CONFIRMED':
        return 'status-badge status-badge--confirmed';
      case 'PROCESSING':
        return 'status-badge status-badge--in-progress';
      case 'SHIPPED':
        return 'status-badge status-badge--in-progress';
      case 'COMPLETED':
        return 'status-badge status-badge--completed';
      case 'PAID':
        return 'status-badge status-badge--paid';
      case 'CANCELLED':
      case 'CANCELED':
        return 'status-badge status-badge--cancelled';
      default:
        return 'status-badge status-badge--default';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusUpper = (status || '').toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'SHIPPED':
        return 'Đã giao hàng';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'PAID':
        return 'Đã thanh toán';
      case 'CANCELLED':
      case 'CANCELED':
        return 'Đã hủy';
      default:
        return status || 'N/A';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const statuses = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PROCESSING', label: 'Đang xử lý' },
    { value: 'SHIPPED', label: 'Đã giao hàng' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'PAID', label: 'Đã thanh toán' },
    { value: 'CANCELLED', label: 'Đã hủy' }
  ];

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.success('Chức năng xuất dữ liệu sẽ được triển khai sau');
    } catch (err) {
      console.error('Export orders failed:', err);
      toast.error('Không thể xuất danh sách đơn hàng. Vui lòng thử lại!');
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

  // Apply client-side search filtering (chỉ filter khi có searchTerm)
  // Nếu không có searchTerm, hiển thị orders từ API (đã được phân trang bởi backend)
  // Lưu ý: Backend đã phân trang, nên orders array đã chỉ chứa items của trang hiện tại
  const filteredOrders = searchTerm ? orders.filter(order => {
    const search = searchTerm.toLowerCase();
    const orderId = (order.orderId || order.id || order.OrderId || order.orderID || '').toString();
    const customerName = (order.customerName || order.customer?.fullName || order.CustomerName || order.customerName || '').toLowerCase();
    const customerEmail = (order.customerEmail || order.customer?.email || order.CustomerEmail || order.customerEmail || '').toLowerCase();
    const customerPhone = (order.customerPhone || order.customer?.phoneNumber || order.CustomerPhone || order.customerPhone || '').toString();

    return (
      orderId.includes(search) ||
      customerName.includes(search) ||
      customerEmail.includes(search) ||
      customerPhone.includes(search)
    );
  }) : orders;

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
                  placeholder="Tìm kiếm đơn hàng, khách hàng..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPageNumber(1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchOrders();
                    }
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
        </div>
      </div>

      {/* Orders List */}
      <div className="booking-table-container">
        {loading ? (
          <div className="booking-loading">
            <div className="booking-loading__spinner" />
            <p className="booking-loading__text">Đang tải...</p>
          </div>
        ) : (() => {
          // Tính toán số items sẽ hiển thị
          const displayOrders = searchTerm
            ? filteredOrders
            : filteredOrders.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

          if (displayOrders.length === 0) {
            return (
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
                {orders.length > 0 && (
                  <p className="booking-empty__text" style={{ fontSize: '12px', color: '#999' }}>
                    Debug: Có {orders.length} đơn hàng nhưng không khớp với bộ lọc
                  </p>
                )}
              </div>
            );
          }

          return (
            <>
              <div className="booking-total-count">
                Tổng số đơn hàng: <strong>{totalCount}</strong>
                {!searchTerm && ` - Trang ${pageNumber}/${totalPages} (Hiển thị ${displayOrders.length} đơn hàng)`}
                {searchTerm && filteredOrders.length !== orders.length && ` (Tìm thấy: ${filteredOrders.length})`}
              </div>
            <div className="booking-table-wrapper">
              <table className="booking-table users-table" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="table-header-yellow">
                    <th style={{ borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                      <span className="th-inner">
                        <ShoppingCart size={16} className="th-icon" /> ID
                      </span>
                    </th>
                    <th>
                      <span className="th-inner">
                        <User size={16} className="th-icon" /> Khách hàng
                      </span>
                    </th>
                    <th>
                      <span className="th-inner">
                        <DollarSign size={16} className="th-icon" /> Tổng tiền
                      </span>
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
                      <span className="th-inner"><Eye size={16} className="th-icon" /> Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Hiển thị tối đa pageSize items (10 dòng mỗi trang) */}
                  {/* Nếu backend trả về tất cả items, frontend sẽ slice để phân trang */}
                  {(() => {
                    // Nếu có searchTerm, hiển thị tất cả filteredOrders
                    // Nếu không có searchTerm, chỉ hiển thị items của trang hiện tại (pageSize items)
                    const displayOrders = searchTerm
                      ? filteredOrders
                      : filteredOrders.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

                    return displayOrders.map((order, i) => {
                    // Debug: Log order để kiểm tra cấu trúc
                    if (i === 0) {
                      console.log('Sample Order Object:', order);
                    }

                    const orderId = order.orderId || order.id || order.OrderId || order.orderID || order.Id || 'N/A';
                    const customerName = order.customerName || order.customer?.fullName || order.CustomerName || order.customerName || order.Customer?.FullName || 'N/A';
                    const customerEmail = order.customerEmail || order.customer?.email || order.CustomerEmail || order.customerEmail || order.Customer?.Email || '';
                    const customerPhone = order.customerPhone || order.customer?.phoneNumber || order.CustomerPhone || order.customerPhone || order.Customer?.PhoneNumber || '';
                    const totalAmount = order.totalAmount || order.total || order.TotalAmount || order.Total || order.totalPrice || order.TotalPrice || 0;
                    const status = order.status || order.Status || order.orderStatus || order.OrderStatus || 'PENDING';
                    const createdAt = order.createdAt || order.CreatedAt || order.createdDate || order.CreatedDate || order.orderDate || order.OrderDate || '';

                      return (
                        <tr
                          key={orderId}
                          onClick={() => handleViewOrder(order)}
                          style={{ animation: `slideInFromTop ${0.1 * (i + 1)}s ease-out forwards` }}
                        >
                          <td style={{ borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                            <span className="booking-id-cell__text">#{orderId}</span>
                          </td>
                          <td className="text-primary-bold">
                            <div>{customerName}</div>
                            {customerEmail && (
                              <div className="text-secondary" style={{ fontSize: '12px' }}>{customerEmail}</div>
                            )}
                            {customerPhone && (
                              <div className="text-secondary" style={{ fontSize: '12px' }}>{customerPhone}</div>
                            )}
                          </td>
                          <td className="text-primary-bold">
                            {formatPrice(totalAmount)}
                          </td>
                          <td>
                            <span className={getStatusBadgeClass(status)}>
                              <span className="dot" />
                              {getStatusLabel(status)}
                            </span>
                          </td>
                          <td className="text-secondary">
                            {formatDateTime(createdAt)}
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
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </>
          );
        })()}
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
                {[10, 20, 50, 100].map(size => (
                  <li
                    key={size}
                    className={`pill-item ${pageSize === size ? 'active' : ''}`}
                    onClick={() => {
                      setPageSize(size);
                      setPageNumber(1);
                      setOpenPageSizeMenu(false);
                      // Reload data với pageSize mới
                    }}
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
          <span className="pagination-range">
            {totalCount > 0 ? (
              <>
                Hiển thị <strong>{(pageNumber - 1) * pageSize + 1}</strong> - <strong>{Math.min(pageNumber * pageSize, totalCount)}</strong> của <strong>{totalCount}</strong> đơn hàng
              </>
            ) : (
              <span className="pagination-label">
                Trang <strong>{pageNumber}</strong> / <strong>{totalPages}</strong>
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          isOpen={showDetailModal}
          orderId={selectedOrderId}
          onClose={handleCloseDetailModal}
        />
      )}
    </div>
  );
}


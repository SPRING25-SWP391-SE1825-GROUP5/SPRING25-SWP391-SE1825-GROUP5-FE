import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Eye,
  Star,
  User,
  MessageSquare,
  Wrench,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { feedbackService, AdminFeedback, AdminFeedbackStats } from '@/services/feedbackService';
import './FeedbackManagement.scss';

export default function FeedbackManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterAnonymous, setFilterAnonymous] = useState<string>("all");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [stats, setStats] = useState<AdminFeedbackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Custom dropdown state
  const [openRatingMenu, setOpenRatingMenu] = useState(false);
  const [openAnonymousMenu, setOpenAnonymousMenu] = useState(false);
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false);
  const ratingRef = useRef<HTMLDivElement | null>(null);
  const anonymousRef = useRef<HTMLDivElement | null>(null);
  const pageSizeRef = useRef<HTMLDivElement | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) setOpenRatingMenu(false);
      if (anonymousRef.current && !anonymousRef.current.contains(e.target as Node)) setOpenAnonymousMenu(false);
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
    fetchFeedbacks();
  }, [pageNumber, pageSize, filterRating, filterAnonymous, filterFromDate, filterToDate, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await feedbackService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        console.warn('Stats response not successful:', response);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      // Don't show error toast for stats, just log it
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: pageNumber,
        pageSize: pageSize,
        from: filterFromDate || undefined,
        to: filterToDate || undefined,
        searchTerm: searchTerm || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder
      };

      if (filterRating !== 'all') {
        if (filterRating === '1') params.minRating = 1;
        else if (filterRating === '2') params.minRating = 2;
        else if (filterRating === '3') params.minRating = 3;
        else if (filterRating === '4') params.minRating = 4;
        else if (filterRating === '5') params.minRating = 5;
      }

      if (filterAnonymous !== 'all') {
        params.isAnonymous = filterAnonymous === 'yes';
      }

      const response = await feedbackService.listForAdmin(params);

      if (response.success) {
        setFeedbacks(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalCount(response.pagination?.totalItems || 0);
        setError(null);
      } else {
        const errorMsg = 'Có lỗi xảy ra khi tải danh sách phản hồi';
        setError(errorMsg);
        toast.error(errorMsg);
        setFeedbacks([]);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Có lỗi xảy ra khi tải danh sách phản hồi';
      setError(errorMessage);
      toast.error(errorMessage);
      setFeedbacks([]);
      console.error('Fetch feedbacks error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedbackId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) return;

    try {
      setDeleting(feedbackId);
      await feedbackService.delete(feedbackId);
      toast.success('Xóa phản hồi thành công');
      fetchFeedbacks();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa phản hồi');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        fill={i < rating ? '#FBBF24' : '#E5E7EB'}
        color={i < rating ? '#FBBF24' : '#E5E7EB'}
        style={{ display: 'inline-block', marginRight: 2 }}
      />
    ));
  };

  const getRatingLabel = (rating: string) => {
    const labels: { [key: string]: string } = {
      'all': 'Tất cả',
      '1': '1 sao',
      '2': '2 sao',
      '3': '3 sao',
      '4': '4 sao',
      '5': '5 sao'
    };
    return labels[rating] || rating;
  };

  const getAnonymousLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      'all': 'Tất cả',
      'yes': 'Ẩn danh',
      'no': 'Không ẩn danh'
    };
    return labels[value] || value;
  };

  return (
    <div className="admin-feedback admin-feedbacks">
      {/* Header */}
      <div className="feedback-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Quản lý phản hồi
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Quản lý và xem tất cả phản hồi từ khách hàng
          </p>
        </div>
        <button
          onClick={fetchFeedbacks}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#fff',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="feedback-stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
              <MessageSquare size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total.toLocaleString()}</div>
              <div className="stat-label">Tổng phản hồi</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
              <Star size={20} fill="#F59E0B" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.averageRating.toFixed(1)}</div>
              <div className="stat-label">Điểm trung bình</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FEE2E2', color: '#EF4444' }}>
              <User size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.anonymous.toLocaleString()}</div>
              <div className="stat-label">Ẩn danh</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#D1FAE5', color: '#10B981' }}>
              <Calendar size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.thisMonth.toLocaleString()}</div>
              <div className="stat-label">Tháng này</div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="users-toolbar">
        <div className="toolbar-search">
          <div className="search-wrap">
            <Search className="icon" size={14} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khách hàng, phụ tùng, kỹ thuật viên..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageNumber(1);
              }}
            />
          </div>
        </div>

        <div className="toolbar-filters" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Rating Filter */}
          <div ref={ratingRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenRatingMenu(!openRatingMenu)}
              className="pill-select"
              style={{ minWidth: '120px' }}
            >
              {getRatingLabel(filterRating)}
              <ChevronDownIcon width={14} height={14} />
            </button>
            {openRatingMenu && (
              <div className="dropdown-menu">
                {['all', '5', '4', '3', '2', '1'].map((rating) => (
                  <button
                    key={rating}
                    className={filterRating === rating ? 'active' : ''}
                    onClick={() => {
                      setFilterRating(rating);
                      setOpenRatingMenu(false);
                      setPageNumber(1);
                    }}
                  >
                    {getRatingLabel(rating)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Anonymous Filter */}
          <div ref={anonymousRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenAnonymousMenu(!openAnonymousMenu)}
              className="pill-select"
              style={{ minWidth: '140px' }}
            >
              {getAnonymousLabel(filterAnonymous)}
              <ChevronDownIcon width={14} height={14} />
            </button>
            {openAnonymousMenu && (
              <div className="dropdown-menu">
                {['all', 'yes', 'no'].map((value) => (
                  <button
                    key={value}
                    className={filterAnonymous === value ? 'active' : ''}
                    onClick={() => {
                      setFilterAnonymous(value);
                      setOpenAnonymousMenu(false);
                      setPageNumber(1);
                    }}
                  >
                    {getAnonymousLabel(value)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range */}
          <input
            type="date"
            value={filterFromDate}
            onChange={(e) => {
              setFilterFromDate(e.target.value);
              setPageNumber(1);
            }}
            placeholder="Từ ngày"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#fff'
            }}
          />
          <input
            type="date"
            value={filterToDate}
            onChange={(e) => {
              setFilterToDate(e.target.value);
              setPageNumber(1);
            }}
            placeholder="Đến ngày"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#fff'
            }}
          />

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by);
              setSortOrder(order as 'asc' | 'desc');
              setPageNumber(1);
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="createdAt-desc">Mới nhất</option>
            <option value="createdAt-asc">Cũ nhất</option>
            <option value="rating-desc">Điểm cao nhất</option>
            <option value="rating-asc">Điểm thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Feedbacks List Table */}
      <div className="feedback-table-container">
        {loading && (
          <div className="empty-state">
            <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            <p>Đang tải...</p>
          </div>
        )}

        {!loading && error && (
          <div className="empty-state">
            <AlertCircle size={32} style={{ color: '#EF4444' }} />
            <p>{error}</p>
            <button onClick={fetchFeedbacks} className="btn-primary" style={{ marginTop: '16px' }}>
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && feedbacks.length === 0 && (
          <div className="empty-state">
            <MessageSquare size={32} style={{ color: 'var(--text-tertiary)' }} />
            <p>Không có phản hồi nào</p>
          </div>
        )}

        {!loading && !error && feedbacks.length > 0 && (
          <>
            <div className="feedback-total-count">
              Tổng số phản hồi: <strong>{totalCount}</strong>
            </div>
            <div className="feedback-table-wrapper">
              <table className="feedback-table users-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>ID</th>
                    <th style={{ width: '200px' }}>Khách hàng</th>
                    <th style={{ width: '120px' }}>Đánh giá</th>
                    <th style={{ width: '120px' }}>Nguồn</th>
                    <th style={{ width: '150px' }}>Phụ tùng</th>
                    <th style={{ width: '150px' }}>Kỹ thuật viên</th>
                    <th>Bình luận</th>
                    <th style={{ width: '120px' }}>Ngày tạo</th>
                    <th style={{ width: '100px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((feedback) => (
                    <tr key={feedback.feedbackId}>
                      <td>{feedback.feedbackId}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 500 }}>
                            {feedback.isAnonymous ? 'Ẩn danh' : (feedback.customerName || 'N/A')}
                          </span>
                          {!feedback.isAnonymous && feedback.customerEmail && (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {feedback.customerEmail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {renderStars(feedback.rating)}
                          <span style={{ marginLeft: '4px', fontWeight: 500 }}>{feedback.rating}</span>
                        </div>
                      </td>
                      <td>
                        {feedback.bookingId ? (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            padding: '4px 8px',
                            background: '#EFF6FF',
                            color: '#3B82F6',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}>
                            <Calendar size={12} />
                            Booking #{feedback.bookingId}
                          </span>
                        ) : feedback.orderId ? (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            padding: '4px 8px',
                            background: '#F0FDF4',
                            color: '#10B981',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}>
                            Order #{feedback.orderId}
                          </span>
                        ) : (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            padding: '4px 8px',
                            background: '#F9FAFB',
                            color: '#6B7280',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}>
                            Công khai
                          </span>
                        )}
                      </td>
                      <td>
                        {feedback.partName ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Wrench size={14} style={{ color: 'var(--text-tertiary)' }} />
                            {feedback.partName}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                      <td>
                        {feedback.technicianName ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                            {feedback.technicianName}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {feedback.comment ? (
                            <span title={feedback.comment}>{feedback.comment}</span>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Không có bình luận</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {formatDate(feedback.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleDelete(feedback.feedbackId)}
                            disabled={deleting === feedback.feedbackId}
                            style={{
                              padding: '6px',
                              background: '#FEE2E2',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: deleting === feedback.feedbackId ? 'not-allowed' : 'pointer',
                              color: '#EF4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Xóa"
                          >
                            {deleting === feedback.feedbackId ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
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
      {!loading && !error && feedbacks.length > 0 && (
        <div className="feedback-pagination">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Hiển thị</span>
            <div ref={pageSizeRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenPageSizeMenu(!openPageSizeMenu)}
                className="pill-select"
                style={{ minWidth: '80px' }}
              >
                {pageSize}
                <ChevronDownIcon width={14} height={14} />
              </button>
              {openPageSizeMenu && (
                <div className="dropdown-menu">
                  {[10, 20, 50, 100].map((size) => (
                    <button
                      key={size}
                      className={pageSize === size ? 'active' : ''}
                      onClick={() => {
                        setPageSize(size);
                        setPageNumber(1);
                        setOpenPageSizeMenu(false);
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              / {totalCount} phản hồi
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPageNumber(1)}
              disabled={pageNumber === 1}
              className="pagination-btn"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setPageNumber(pageNumber - 1)}
              disabled={pageNumber === 1}
              className="pagination-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)', minWidth: '80px', textAlign: 'center' }}>
              Trang {pageNumber} / {totalPages}
            </span>
            <button
              onClick={() => setPageNumber(pageNumber + 1)}
              disabled={pageNumber >= totalPages}
              className="pagination-btn"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPageNumber(totalPages)}
              disabled={pageNumber >= totalPages}
              className="pagination-btn"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


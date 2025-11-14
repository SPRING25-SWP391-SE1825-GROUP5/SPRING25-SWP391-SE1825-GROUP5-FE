import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Eye,
  Gift,
  Calendar,
  DollarSign,
  Tag,
  ChevronUp,
  ChevronDown,
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
  Percent,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { PromotionService } from '@/services/promotionService';
import type { Promotion, CreatePromotionRequest, UpdatePromotionRequest } from '@/types/promotion';
import PromotionFormModal from './PromotionFormModal';
import './PromotionManagement.scss';

export default function PromotionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statsData, setStatsData] = useState({
    totalPromotions: 0,
    active: 0,
    inactive: 0,
    expired: 0,
  });
  const [selectedPromotionIds, setSelectedPromotionIds] = useState<number[]>([]);

  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const [openTypeMenu, setOpenTypeMenu] = useState(false);
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const typeRef = useRef<HTMLDivElement | null>(null);
  const pageSizeRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setOpenStatusMenu(false);
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setOpenTypeMenu(false);
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) setOpenPageSizeMenu(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const previousBg = document.body.style.background;
    document.body.style.background = '#fff';
    return () => { document.body.style.background = previousBg; };
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [pageNumber, pageSize, searchTerm, filterStatus, filterType, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const visibleIds = promotions.map(p => p.promotionId);
    setSelectedPromotionIds(prev => prev.filter(id => visibleIds.includes(id)));
  }, [promotions]);

  const allVisibleIds = promotions.map(p => p.promotionId);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedPromotionIds.includes(id));
  const handleToggleAll = (checked: boolean) => {
    setSelectedPromotionIds(checked ? allVisibleIds : []);
  };
  const handleToggleOne = (id: number, checked: boolean) => {
    setSelectedPromotionIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const status = filterStatus !== 'all' ? filterStatus : undefined;
      const promotionType = filterType !== 'all' ? filterType : undefined;

      const result = await PromotionService.getPromotions({
        pageNumber,
        pageSize,
        searchTerm: searchTerm.trim() || undefined,
        status: status as 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | undefined,
        promotionType,
      });

      let promotionsList = result.data || [];

      if (promotionsList.length > 0) {
        promotionsList = promotionsList.sort((a, b) => {
          let aValue: any, bValue: any;

          switch (sortBy) {
            case 'code':
              aValue = a.code?.toLowerCase() || '';
              bValue = b.code?.toLowerCase() || '';
              break;
            case 'discountValue':
              aValue = a.discountValue || 0;
              bValue = b.discountValue || 0;
              break;
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            case 'startDate':
              aValue = new Date(a.startDate).getTime();
              bValue = new Date(b.startDate).getTime();
              break;
            default:
              aValue = a.code?.toLowerCase() || '';
              bValue = b.code?.toLowerCase() || '';
          }

          if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });
      }

      setPromotions(promotionsList);
      setTotalCount(result.totalCount || promotionsList.length);
      setTotalPages(result.totalPages || Math.max(1, Math.ceil((result.totalCount || promotionsList.length) / pageSize)));
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách khuyến mãi");
      toast.error(err.message || "Không thể tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await PromotionService.getPromotions({ pageNumber: 1, pageSize: 1000 });
      const allPromotions = result.data || [];

      setStatsData({
        totalPromotions: allPromotions.length,
        active: allPromotions.filter((p) => p.status === 'ACTIVE' || p.isActive).length,
        inactive: allPromotions.filter((p) => p.status === 'INACTIVE' && !p.isActive).length,
        expired: allPromotions.filter((p) => p.status === 'EXPIRED' || p.isExpired).length,
      });
    } catch (err) {
    }
  };

  const statuses = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Không hoạt động" },
    { value: "EXPIRED", label: "Hết hạn" },
  ];

  const types = [
    { value: "all", label: "Tất cả loại" },
    { value: "PERCENT", label: "Phần trăm" },
    { value: "FIXED", label: "Số tiền cố định" },
  ];

  const getStatusLabel = (status: string, isActive: boolean, isExpired: boolean) => {
    if (isExpired || status === 'EXPIRED') return "Hết hạn";
    if (isActive || status === 'ACTIVE') return "Hoạt động";
    return "Không hoạt động";
  };

  const getStatusBadgeClass = (status: string, isActive: boolean, isExpired: boolean) => {
    if (isExpired || status === 'EXPIRED') {
      return 'status-badge status-badge--expired';
    }
    if (isActive || status === 'ACTIVE') {
      return 'status-badge status-badge--active';
    }
    return 'status-badge status-badge--inactive';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDiscount = (promotion: Promotion) => {
    if (promotion.discountType === 'PERCENT') {
      return `${promotion.discountValue}%${promotion.maxDiscount ? ` (tối đa ${formatCurrency(promotion.maxDiscount)})` : ''}`;
    }
    return formatCurrency(promotion.discountValue);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPageNumber(1);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ChevronUp size={14} style={{ opacity: 0.3 }} />;
    }
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleViewPromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setShowPromotionModal(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setOpenCreateModal(true);
  };

  const handleFormSuccess = async () => {
    await fetchPromotions();
    await fetchStats();
    setOpenCreateModal(false);
    setEditingPromotion(null);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await PromotionService.exportPromotions();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `promotions_${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Xuất danh sách khuyến mãi thành công!');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xuất danh sách khuyến mãi';
      toast.error(errorMessage);
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

  if (error) return (
    <div className="promotion-error">
      <div className="promotion-error__container">
        <div className="promotion-error__icon">⚠️</div>
        <p className="promotion-error__message">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="admin-promotions">
      <div className="promotion-header">
          <div>
          <h2 className="promotion-header__title">
            Quản lý Khuyến mãi
          </h2>
          <p className="promotion-header__subtitle">
            Quản lý và theo dõi tất cả mã khuyến mãi trong hệ thống
            </p>
          </div>
        </div>

      <div className="users-toolbar">
        <div className="toolbar-top">
          <div className="toolbar-left">
            <div className="toolbar-sep" />
            </div>
          <div className="toolbar-right">
            <div className="toolbar-search">
              <div className="search-wrap">
                <Search size={14} className="icon" />
              <input
                  placeholder="Tìm kiếm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
            </div>
            <div className="toolbar-actions">
              <button
                type="button"
                className="accent-button toolbar-adduser"
                onClick={() => {
                  setEditingPromotion(null);
                  setOpenCreateModal(true);
                }}
              >
                <Plus size={16} /> Thêm khuyến mãi
              </button>
            </div>
        </div>
      </div>

        <div className="toolbar-filters">
          <div className="pill-select" ref={statusRef} onClick={(e)=>{ e.stopPropagation(); setOpenTypeMenu(false); setOpenStatusMenu(v=>!v); }}>
            <CheckCircle size={14} className="icon" />
            <button type="button" className="pill-trigger">{statuses.find(s=>s.value===filterStatus)?.label}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openStatusMenu && (
              <ul className="pill-menu show">
                {statuses.map(s => (
                  <li key={s.value} className={`pill-item ${filterStatus===s.value ? 'active' : ''}`}
                      onClick={()=>{ setFilterStatus(s.value); setPageNumber(1); setOpenStatusMenu(false); }}>
                    {s.label}
                  </li>
                ))}
              </ul>
            )}
        </div>

          <div className="pill-select" ref={typeRef} onClick={(e)=>{ e.stopPropagation(); setOpenStatusMenu(false); setOpenTypeMenu(v=>!v); }}>
            <Percent size={14} className="icon" />
            <button type="button" className="pill-trigger">{types.find(t=>t.value===filterType)?.label}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openTypeMenu && (
              <ul className="pill-menu show">
                {types.map(t => (
                  <li key={t.value} className={`pill-item ${filterType===t.value ? 'active' : ''}`}
                      onClick={()=>{ setFilterType(t.value); setPageNumber(1); setOpenTypeMenu(false); }}>
                    {t.label}
                  </li>
                ))}
              </ul>
            )}
        </div>

          <button type="button" className="toolbar-chip"><Plus size={14} /> Thêm bộ lọc</button>
        </div>
        </div>

      <div className="promotion-table-container">
        {loading ? (
          <div className="promotion-loading">
            <div className="promotion-loading__spinner" />
            <p className="promotion-loading__text">Đang tải...</p>
      </div>
        ) : promotions.length === 0 ? (
          <div className="promotion-empty">
            <div className="promotion-empty__icon">
          <Gift size={32} />
        </div>
            <h4 className="promotion-empty__title">
              {searchTerm ? 'Không tìm thấy khuyến mãi nào' : 'Chưa có khuyến mãi nào'}
        </h4>
            <p className="promotion-empty__text">
              {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Thêm khuyến mãi mới để bắt đầu'}
        </p>
      </div>
        ) : (
          <>
            <div className="promotion-total-count">
              Tổng số khuyến mãi: <strong>{totalCount}</strong>
                </div>
            <div className="promotion-table-wrapper">
              <table className="promotion-table users-table" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="table-header-yellow">
                    <th>
                      <span className="th-inner">
                        <input type="checkbox" className="users-checkbox" aria-label="Chọn tất cả" checked={isAllSelected} onChange={(e)=>handleToggleAll(e.target.checked)} />
                        <Gift size={16} className="th-icon" /> Mã khuyến mãi
                      </span>
            </th>
                    <th>
                      <span className="th-inner"><Tag size={16} className="th-icon" /> Mô tả</span>
            </th>
                    <th className="sortable" onClick={() => handleSort('discountValue')}>
                      <span className="th-inner sortable">
                        <DollarSign size={16} className="th-icon" /> Giá trị giảm {getSortIcon('discountValue')}
                      </span>
            </th>
                    <th>
                      <span className="th-inner"><Percent size={16} className="th-icon" /> Loại</span>
            </th>
                    <th>
                      <span className="th-inner"><ShoppingCart size={16} className="th-icon" /> Đơn tối thiểu</span>
            </th>
                    <th>
                      <span className="th-inner"><Calendar size={16} className="th-icon" /> Thời hạn</span>
            </th>
                    <th>
                      <span className="th-inner"><Clock size={16} className="th-icon" /> Trạng thái</span>
                    </th>
                    <th>
                      <span className="th-inner"><CheckCircle size={16} className="th-icon" /> Số lượt sử dụng</span>
                    </th>
                    <th>
                      <span className="th-inner"><Settings size={16} className="th-icon" /> Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
                  {promotions.map((p, i) => (
                    <tr
                      key={p.promotionId}
                      onClick={() => handleViewPromotion(p)}
                      style={{ animation: `slideInFromTop ${0.1 * (i + 1)}s ease-out forwards` }}
                    >
                      <td>
                        <div className="promotion-code-cell">
                          <input type="checkbox" className="users-checkbox" aria-label={`Chọn ${p.code}`} checked={selectedPromotionIds.includes(p.promotionId)} onChange={(e)=>handleToggleOne(p.promotionId, e.target.checked)} onClick={(e)=>e.stopPropagation()} />
                          <span
                            className="promotion-code-cell__text"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (p.code) {
                                navigator.clipboard.writeText(p.code);
                                toast.success(`Đã copy mã khuyến mãi: ${p.code}`);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {p.code}
                          </span>
                </div>
              </td>
                      <td className="text-secondary text-ellipsis">
                        {p.description || 'Không có mô tả'}
              </td>
                      <td className="text-primary-bold">
                        {formatDiscount(p)}
              </td>
                      <td>
                        <span className={`promotion-discount-badge ${p.discountType === 'PERCENT' ? 'percent' : 'fixed-amount'}`}>
                          {p.discountType === 'PERCENT' ? 'Phần trăm' : 'Số tiền'}
                        </span>
              </td>
                      <td className="text-secondary">
                        {p.minOrderAmount ? formatCurrency(p.minOrderAmount) : 'Không có'}
              </td>
                      <td className="text-secondary">
                        <div className="promotion-date-range">
                          <span>Từ: {new Date(p.startDate).toLocaleDateString('vi-VN')}</span>
                          {p.endDate && <span>Đến: {new Date(p.endDate).toLocaleDateString('vi-VN')}</span>}
                </div>
              </td>
                      <td>
                        <span className={getStatusBadgeClass(p.status, p.isActive, p.isExpired)}>
                          <span className="dot" />
                          {getStatusLabel(p.status, p.isActive, p.isExpired)}
                        </span>
                      </td>
                      <td className="text-secondary">
                        {p.usageCount || 0}/{p.usageLimit || '∞'}
                      </td>
                      <td>
                        <div className="promotion-actions">
                  <button
                            type="button"
                            className="promotion-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleViewPromotion(p); }}
                          >
                            <Eye size={16} />
                  </button>
                  <button
                            type="button"
                            className="promotion-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleEditPromotion(p); }}
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

      <div className="promotion-pagination">
        <div className="pagination-info">
          <span className="pagination-label">Hàng mỗi trang</span>
          <div className="pill-select" ref={pageSizeRef} onClick={(e) => { e.stopPropagation(); setOpenPageSizeMenu(v => !v); }}>
            <button type="button" className="pill-trigger">{pageSize}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openPageSizeMenu && (
              <ul className="pill-menu show">
                {[10, 15, 20, 30, 50].map(sz => (
                  <li key={sz} className={`pill-item ${pageSize === sz ? 'active' : ''}`}
                      onClick={() => { setPageSize(sz); setPageNumber(1); setOpenPageSizeMenu(false); }}>
                    {sz}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <span className="pagination-range">
            {(() => {
              const start = (pageNumber - 1) * pageSize + 1;
              const end = start + promotions.length - 1;
              return totalCount > 0 ? `${start}–${end} của ${totalCount} hàng` : `${start}–${end}`;
            })()}
              </span>
          </div>

        <div className="pagination-controls">
          <button type="button"
            disabled={pageNumber === 1}
            onClick={() => setPageNumber(1)}
            className={`pager-btn ${pageNumber === 1 ? 'is-disabled' : ''}`}
            >
              <ChevronsLeft size={16} />
            </button>

          <button type="button"
            disabled={pageNumber === 1}
            onClick={() => setPageNumber((p) => p - 1)}
            className={`pager-btn ${pageNumber === 1 ? 'is-disabled' : ''}`}
            >
              <ChevronLeft size={16} />
            </button>

          <div className="pager-pages">
            {getPageNumbers().map((pageNum, index) => {
              if (pageNum === '...') {
                return <span key={`ellipsis-${index}`} className="pager-ellipsis">…</span>;
              }
              return (
                    <button
                  key={pageNum}
                  onClick={() => setPageNumber(pageNum as number)}
                  className={`pager-btn ${pageNumber === pageNum ? 'is-active' : ''}`}
                >
                  {pageNum}
                    </button>
                  );
            })}
            </div>

          <button type="button"
            disabled={pageNumber === totalPages}
            onClick={() => setPageNumber((p) => p + 1)}
            className={`pager-btn ${pageNumber === totalPages ? 'is-disabled' : ''}`}
          >
              <ChevronRight size={16} />
            </button>

          <button type="button"
            disabled={pageNumber === totalPages}
            onClick={() => setPageNumber(totalPages)}
            className={`pager-btn ${pageNumber === totalPages ? 'is-disabled' : ''}`}
          >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>

      {showPromotionModal && selectedPromotion && (
        <div className="promotion-modal">
          <div className="promotion-modal__content">
            <div className="promotion-modal__header">
              <h3 className="promotion-modal__title">Chi tiết khuyến mãi</h3>
                <button
                className="promotion-modal__close"
                onClick={() => setShowPromotionModal(false)}
              >
                ✕
                </button>
              </div>

            <div className="promotion-modal__body">
              <div className="promotion-detail__header">
                <div className="promotion-detail__avatar">
                  {selectedPromotion.code ? selectedPromotion.code.charAt(0).toUpperCase() : 'P'}
                      </div>
                <div className="promotion-detail__info">
                  <p className="promotion-detail__title">{selectedPromotion.code}</p>
                  <p className="promotion-detail__subtitle">{selectedPromotion.description || 'Không có mô tả'}</p>
                  </div>
                </div>

              <div className="promotion-detail__grid">
                <div className="promotion-detail__item">
                  <DollarSign size={16} color="var(--primary-600)" />
                    <div>
                    <p className="promotion-detail__item-label">Giá trị giảm</p>
                    <p className="promotion-detail__item-value bold">
                      {formatDiscount(selectedPromotion)}
                    </p>
                      </div>
                    </div>

                <div className="promotion-detail__item">
                  <Percent size={16} color="var(--info-600)" />
                    <div>
                    <p className="promotion-detail__item-label">Loại</p>
                    <p className="promotion-detail__item-value">
                      {selectedPromotion.discountType === 'PERCENT' ? 'Phần trăm' : 'Số tiền cố định'}
                    </p>
                      </div>
                    </div>
                        </div>

              <div className="promotion-detail__item full">
                <ShoppingCart size={16} color="var(--warning-600)" />
                      <div>
                  <p className="promotion-detail__item-label">Đơn tối thiểu</p>
                  <p className="promotion-detail__item-value">
                    {selectedPromotion.minOrderAmount ? formatCurrency(selectedPromotion.minOrderAmount) : 'Không có'}
                  </p>
                  </div>
                </div>

              <div className="promotion-detail__grid">
                <div className="promotion-detail__item">
                  <Calendar size={16} color="var(--info-600)" />
                    <div>
                    <p className="promotion-detail__item-label">Ngày bắt đầu</p>
                    <p className="promotion-detail__item-value">
                      {new Date(selectedPromotion.startDate).toLocaleDateString('vi-VN')}
                    </p>
                      </div>
                    </div>

                <div className="promotion-detail__item">
                  <Calendar size={16} color="var(--info-600)" />
                    <div>
                    <p className="promotion-detail__item-label">Ngày kết thúc</p>
                    <p className="promotion-detail__item-value">
                      {selectedPromotion.endDate ? new Date(selectedPromotion.endDate).toLocaleDateString('vi-VN') : 'Không có'}
                    </p>
                    </div>
                  </div>
                </div>

              <div className="promotion-detail__row">
                <div className="promotion-detail__item">
                  <Clock size={16} color="var(--primary-600)" />
                    <div>
                    <p className="promotion-detail__item-label">Trạng thái</p>
                    <p className="promotion-detail__item-value">
                      {getStatusLabel(selectedPromotion.status, selectedPromotion.isActive, selectedPromotion.isExpired)}
                    </p>
                      </div>
                    </div>

                <div className="promotion-detail__item">
                  <CheckCircle size={16} color="var(--success-600)" />
                    <div>
                    <p className="promotion-detail__item-label">Số lượt sử dụng</p>
                    <p className="promotion-detail__item-value">
                      {selectedPromotion.usageCount || 0}/{selectedPromotion.usageLimit || '∞'}
                    </p>
                      </div>
                    </div>
                        </div>
                      </div>
                  </div>
                </div>
      )}

      <PromotionFormModal
        open={openCreateModal}
        onClose={() => {
          setOpenCreateModal(false);
          setEditingPromotion(null);
        }}
        onSuccess={handleFormSuccess}
        editingPromotion={editingPromotion}
      />
                </div>
  );
}

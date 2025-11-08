import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Eye,
  Warehouse,
  Calendar,
  Package,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  EyeOff,
  SlidersHorizontal,
  Download,
  Settings,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { InventoryService, InventoryListItem, InventoryPart } from '@/services/inventoryService';
import { CenterService, Center } from '@/services/centerService';
import InventoryPartsModal from './Inventory/InventoryPartsModal';
import './InventoryManagement.scss';

export default function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCenter, setFilterCenter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("inventoryId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedInventory, setSelectedInventory] = useState<InventoryListItem | null>(null);
  const [showPartsModal, setShowPartsModal] = useState(false);

  const [inventories, setInventories] = useState<InventoryListItem[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection state
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<number[]>([]);
  // Custom dropdown state
  const [openCenterMenu, setOpenCenterMenu] = useState(false);
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const pageSizeRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (centerRef.current && !centerRef.current.contains(e.target as Node)) setOpenCenterMenu(false);
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
    fetchInventories();
  }, [pageNumber, pageSize, searchTerm, filterCenter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCenters();
  }, []);

  // Keep selections in sync
  useEffect(() => {
    const visibleIds = inventories.map(i => i.inventoryId);
    setSelectedInventoryIds(prev => prev.filter(id => visibleIds.includes(id)));
  }, [inventories]);

  const fetchCenters = async () => {
    try {
      setLoadingCenters(true);
      const response = await CenterService.getCenters({ pageSize: 100 });
      if (response.centers) {
        setCenters(response.centers);
      }
    } catch (err) {

    } finally {
      setLoadingCenters(false);
    }
  };

  const fetchInventories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await InventoryService.getInventories(
        pageNumber,
        pageSize,
        filterCenter || undefined,
        searchTerm || undefined
      );

      if (response.success) {
        setInventories(response.data.inventories || []);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.totalCount);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải danh sách kho');
        toast.error(response.message || 'Có lỗi xảy ra khi tải danh sách kho');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải danh sách kho';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const allVisibleIds = inventories.map(i => i.inventoryId);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedInventoryIds.includes(id));

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedInventoryIds([...allVisibleIds]);
    } else {
      setSelectedInventoryIds([]);
    }
  };

  const handleToggleOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedInventoryIds(prev => [...prev, id]);
    } else {
      setSelectedInventoryIds(prev => prev.filter(i => i !== id));
    }
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

  const handleViewInventory = (inventory: InventoryListItem) => {
    setSelectedInventory(inventory);
    setShowPartsModal(true);
  };

  const handleManageParts = async (inventory: InventoryListItem) => {
    try {
      // Fetch full inventory details with parts
      const response = await InventoryService.getInventoryById(inventory.inventoryId);
      if (response.success) {
        setSelectedInventory({
          ...inventory,
          inventoryParts: response.data.parts
        });
        setShowPartsModal(true);
      }
    } catch (err) {
      toast.error('Không thể tải chi tiết kho');
    }
  };

  const handlePartsModalClose = () => {
    setShowPartsModal(false);
    setSelectedInventory(null);
    fetchInventories();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.success('Chức năng xuất dữ liệu sẽ được triển khai sau');
    } catch (err) {

      toast.error('Không thể xuất danh sách kho. Vui lòng thử lại!');
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

  // Apply client-side sorting
  const sortedInventories = [...inventories].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'inventoryId':
        aValue = a.inventoryId;
        bValue = b.inventoryId;
        break;
      case 'centerName':
        aValue = a.centerName.toLowerCase();
        bValue = b.centerName.toLowerCase();
        break;
      case 'partsCount':
        aValue = a.partsCount;
        bValue = b.partsCount;
        break;
      case 'lastUpdated':
        aValue = new Date(a.lastUpdated).getTime();
        bValue = new Date(b.lastUpdated).getTime();
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  if (error && inventories.length === 0) return (
    <div className="inventory-error">
      <div className="inventory-error__container">
        <div className="inventory-error__icon">⚠️</div>
        <p className="inventory-error__message">{error}</p>
        <button className="inventory-error__retry" onClick={fetchInventories}>Thử lại</button>
      </div>
    </div>
  );

  return (
    <div className="admin-inventory">
      {/* Header */}
      <div className="inventory-header">
        <div>
          <h2 className="inventory-header__title">
            Quản lý Kho hàng
          </h2>
          <p className="inventory-header__subtitle">
            Quản lý và theo dõi tất cả kho hàng trong hệ thống
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
                  placeholder="Tìm kiếm kho, trung tâm..."
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
            <Warehouse size={14} className="icon" />
            <button type="button" className="pill-trigger">
              {filterCenter ? centers.find(c => c.centerId === filterCenter)?.centerName || 'Tất cả trung tâm' : 'Tất cả trung tâm'}
            </button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openCenterMenu && (
              <ul className="pill-menu show">
                <li
                  className={`pill-item ${filterCenter === null ? 'active' : ''}`}
                  onClick={() => { setFilterCenter(null); setPageNumber(1); setOpenCenterMenu(false); }}
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

          <button type="button" className="toolbar-chip"><Plus size={14} /> Thêm bộ lọc</button>
        </div>
      </div>

      {/* Inventory List */}
      <div className="inventory-table-container">
        {loading ? (
          <div className="inventory-loading">
            <div className="inventory-loading__spinner" />
            <p className="inventory-loading__text">Đang tải...</p>
          </div>
        ) : inventories.length === 0 ? (
          <div className="inventory-empty">
            <div className="inventory-empty__icon">
              <Warehouse size={32} />
            </div>
            <h4 className="inventory-empty__title">
              {searchTerm || filterCenter ? 'Không tìm thấy kho nào' : 'Chưa có kho nào'}
            </h4>
            <p className="inventory-empty__text">
              {searchTerm || filterCenter ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Kho hàng sẽ được hiển thị ở đây'}
            </p>
          </div>
        ) : (
          <>
            <div className="inventory-total-count">
              Tổng số kho: <strong>{totalCount}</strong>
            </div>
            <div className="inventory-table-wrapper">
              <table className="inventory-table users-table" style={{ borderCollapse: 'collapse' }}>
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
                        <Package size={16} className="th-icon" /> ID Kho
                      </span>
                    </th>
                    <th className="sortable" onClick={() => handleSort('centerName')}>
                      <span className="th-inner sortable">
                        <Warehouse size={16} className="th-icon" /> Trung tâm {getSortIcon('centerName')}
                      </span>
                    </th>
                    <th className="sortable" onClick={() => handleSort('partsCount')}>
                      <span className="th-inner sortable">
                        <Package size={16} className="th-icon" /> Số lượng phụ tùng {getSortIcon('partsCount')}
                      </span>
                    </th>
                    <th className="sortable" onClick={() => handleSort('lastUpdated')}>
                      <span className="th-inner sortable">
                        <Calendar size={16} className="th-icon" /> Cập nhật lần cuối {getSortIcon('lastUpdated')}
                      </span>
                    </th>
                    <th>
                      <span className="th-inner"><Settings size={16} className="th-icon" /> Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInventories.map((inventory, i) => (
                    <tr
                      key={inventory.inventoryId}
                      onClick={() => handleViewInventory(inventory)}
                      style={{ animation: `slideInFromTop ${0.1 * (i + 1)}s ease-out forwards` }}
                    >
                      <td style={{ borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                        <div className="inventory-id-cell">
                          <input
                            type="checkbox"
                            className="users-checkbox"
                            aria-label={`Chọn kho ${inventory.inventoryId}`}
                            checked={selectedInventoryIds.includes(inventory.inventoryId)}
                            onChange={(e) => handleToggleOne(inventory.inventoryId, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="inventory-id-cell__avatar users-avatar users-avatar--fallback">
                            {inventory.inventoryId}
                          </div>
                          <span className="inventory-id-cell__text">#{inventory.inventoryId}</span>
                        </div>
                      </td>
                      <td className="text-primary-bold">
                        {inventory.centerName}
                      </td>
                      <td className="text-secondary">
                        {inventory.partsCount}
                      </td>
                      <td className="text-secondary">
                        {formatDate(inventory.lastUpdated)}
                      </td>
                      <td>
                        <div className="inventory-actions">
                          <button
                            type="button"
                            className="inventory-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleViewInventory(inventory); }}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="inventory-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleManageParts(inventory); }}
                            title="Quản lý phụ tùng"
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
      <div className="inventory-pagination">
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

      {/* Parts Management Modal */}
      {selectedInventory && (
        <InventoryPartsModal
          isOpen={showPartsModal}
          inventory={selectedInventory}
          onClose={handlePartsModalClose}
        />
      )}
    </div>
  );
}


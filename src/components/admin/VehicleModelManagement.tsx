import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  Car,
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
  XCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { vehicleModelService, VehicleModelResponse, CreateVehicleModelRequest, UpdateVehicleModelRequest } from '@/services/vehicleModelManagement';
import VehicleModelDetailModal from './VehicleModel/VehicleModelDetailModal';
import VehicleModelFormModal from './VehicleModel/VehicleModelFormModal';
import './VehicleModelManagement.scss';

export default function VehicleModelManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [sortBy, setSortBy] = useState("modelName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedModel, setSelectedModel] = useState<VehicleModelResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModelResponse | null>(null);
  const [deleteConfirmModel, setDeleteConfirmModel] = useState<VehicleModelResponse | null>(null);

  const [models, setModels] = useState<VehicleModelResponse[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  // Custom dropdown state
  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const [openBrandMenu, setOpenBrandMenu] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setOpenStatusMenu(false);
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setOpenBrandMenu(false);
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
    fetchModels();
  }, []);

  // Keep selections in sync
  useEffect(() => {
    const visibleIds = models.map(m => m.modelId);
    setSelectedModelIds(prev => prev.filter(id => visibleIds.includes(id)));
  }, [models]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await vehicleModelService.getAll();
      setModels(data);

      // Extract unique brands
      const brands = Array.from(new Set(data.map(m => m.brand).filter(Boolean)));
      setAllBrands(brands.sort());
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải danh sách mẫu xe';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const allVisibleIds = models.map(m => m.modelId);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedModelIds.includes(id));

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedModelIds([...allVisibleIds]);
    } else {
      setSelectedModelIds([]);
    }
  };

  const handleToggleOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedModelIds(prev => [...prev, id]);
    } else {
      setSelectedModelIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ChevronUp size={14} style={{ opacity: 0.3 }} />;
    }
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleViewModel = (model: VehicleModelResponse) => {
    setSelectedModel(model);
    setShowDetailModal(true);
  };

  const handleCreateModel = () => {
    setEditingModel(null);
    setShowFormModal(true);
  };

  const handleEditModel = (model: VehicleModelResponse) => {
    setEditingModel(model);
    setShowFormModal(true);
  };

  const handleDeleteModel = async (model: VehicleModelResponse) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu xe "${model.modelName}"?`)) {
      return;
    }

    try {
      await vehicleModelService.delete(model.modelId);
      toast.success('Xóa mẫu xe thành công');
      fetchModels();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể xóa mẫu xe';
      toast.error(errorMessage);
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingModel(null);
    fetchModels();
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedModel(null);
  };

  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive
      ? 'status-badge status-badge--active'
      : 'status-badge status-badge--inactive';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Hoạt động' : 'Tạm dừng';
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
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Tạm dừng' }
  ];

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.success('Chức năng xuất dữ liệu sẽ được triển khai sau');
    } catch (err) {
      console.error('Export models failed:', err);
      toast.error('Không thể xuất danh sách mẫu xe. Vui lòng thử lại!');
    } finally {
      setExporting(false);
    }
  };

  // Apply client-side filtering and sorting
  let filteredModels = models.filter(model => {
    const matchesSearch = !searchTerm ||
      model.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.modelId.toString().includes(searchTerm);

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && model.isActive) ||
      (filterStatus === 'inactive' && !model.isActive);

    const matchesBrand = filterBrand === 'all' || model.brand === filterBrand;

    return matchesSearch && matchesStatus && matchesBrand;
  });

  // Sort filtered models
  filteredModels = [...filteredModels].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortBy) {
      case 'modelName':
        aVal = a.modelName.toLowerCase();
        bVal = b.modelName.toLowerCase();
        break;
      case 'brand':
        aVal = a.brand.toLowerCase();
        bVal = b.brand.toLowerCase();
        break;
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case 'modelId':
        aVal = a.modelId;
        bVal = b.modelId;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (error && models.length === 0 && !loading) return (
    <div className="vehicle-model-error">
      <div className="vehicle-model-error__container">
        <div className="vehicle-model-error__icon">⚠️</div>
        <p className="vehicle-model-error__message">{error}</p>
        <button className="vehicle-model-error__retry" onClick={fetchModels}>Thử lại</button>
      </div>
    </div>
  );

  return (
    <div className="admin-vehicle-model admin-vehicle-models">
      {/* Header */}
      <div className="vehicle-model-header">
        <div>
          <h2 className="vehicle-model-header__title">
            Quản lý Mẫu xe
          </h2>
          <p className="vehicle-model-header__subtitle">
            Quản lý và theo dõi tất cả mẫu xe trong hệ thống
          </p>
        </div>
      </div>

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
                  placeholder="Tìm kiếm mẫu xe, hãng xe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="toolbar-chip"><EyeOff size={14} /> Ẩn</button>
            <button type="button" className="toolbar-chip"><SlidersHorizontal size={14} /> Tùy chỉnh</button>
            <button type="button" className="toolbar-btn" onClick={handleCreateModel}>
              <Plus size={14} /> Thêm mẫu xe
            </button>
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
                    onClick={() => { setFilterStatus(s.value); setOpenStatusMenu(false); }}
                  >
                    {s.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pill-select" ref={brandRef} onClick={(e) => { e.stopPropagation(); setOpenBrandMenu(v => !v); }}>
            <Car size={14} className="icon" />
            <button type="button" className="pill-trigger">
              {filterBrand === 'all' ? 'Tất cả hãng' : filterBrand}
            </button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openBrandMenu && (
              <ul className="pill-menu show">
                <li
                  className={`pill-item ${filterBrand === 'all' ? 'active' : ''}`}
                  onClick={() => { setFilterBrand('all'); setOpenBrandMenu(false); }}
                >
                  Tất cả hãng
                </li>
                {allBrands.map(brand => (
                  <li
                    key={brand}
                    className={`pill-item ${filterBrand === brand ? 'active' : ''}`}
                    onClick={() => { setFilterBrand(brand); setOpenBrandMenu(false); }}
                  >
                    {brand}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Models List */}
      <div className="vehicle-model-table-container">
        {loading ? (
          <div className="vehicle-model-loading">
            <div className="vehicle-model-loading__spinner" />
            <p className="vehicle-model-loading__text">Đang tải...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="vehicle-model-empty">
            <div className="vehicle-model-empty__icon">
              <Car size={32} />
            </div>
            <h4 className="vehicle-model-empty__title">
              {searchTerm || filterStatus !== 'all' || filterBrand !== 'all' ? 'Không tìm thấy mẫu xe nào' : 'Chưa có mẫu xe nào'}
            </h4>
            <p className="vehicle-model-empty__text">
              {searchTerm || filterStatus !== 'all' || filterBrand !== 'all' ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Thêm mẫu xe mới để bắt đầu'}
            </p>
          </div>
        ) : (
          <>
            <div className="vehicle-model-total-count">
              Tổng số mẫu xe: <strong>{filteredModels.length}</strong>
            </div>
            <div className="vehicle-model-table-wrapper">
              <table className="vehicle-model-table users-table" style={{ borderCollapse: 'collapse' }}>
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
                        <Car size={16} className="th-icon" /> ID
                      </span>
                    </th>
                    <th className="sortable" onClick={() => handleSort('modelName')}>
                      <span className="th-inner sortable">
                        <Car size={16} className="th-icon" /> Tên mẫu {getSortIcon('modelName')}
                      </span>
                    </th>
                    <th className="sortable" onClick={() => handleSort('brand')}>
                      <span className="th-inner sortable">
                        <Car size={16} className="th-icon" /> Hãng xe {getSortIcon('brand')}
                      </span>
                    </th>
                    <th className="sortable" onClick={() => handleSort('createdAt')}>
                      <span className="th-inner sortable">
                        <CheckCircle size={16} className="th-icon" /> Trạng thái {getSortIcon('createdAt')}
                      </span>
                    </th>
                    <th>
                      <span className="th-inner"><Settings size={16} className="th-icon" /> Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((model, i) => (
                    <tr
                      key={model.modelId}
                      onClick={() => handleViewModel(model)}
                      style={{ animation: `slideInFromTop ${0.1 * (i + 1)}s ease-out forwards` }}
                    >
                      <td style={{ borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                        <div className="vehicle-model-id-cell">
                          <input
                            type="checkbox"
                            className="users-checkbox"
                            aria-label={`Chọn mẫu xe ${model.modelId}`}
                            checked={selectedModelIds.includes(model.modelId)}
                            onChange={(e) => handleToggleOne(model.modelId, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="vehicle-model-id-cell__avatar users-avatar users-avatar--fallback">
                            {model.modelId}
                          </div>
                          <span className="vehicle-model-id-cell__text">#{model.modelId}</span>
                        </div>
                      </td>
                      <td className="text-primary-bold">
                        {model.modelName}
                      </td>
                      <td className="text-secondary">
                        {model.brand}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(model.isActive)}>
                          <span className="dot" />
                          {getStatusLabel(model.isActive)}
                        </span>
                      </td>
                      <td>
                        <div className="vehicle-model-actions">
                          <button
                            type="button"
                            className="vehicle-model-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleViewModel(model); }}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="vehicle-model-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleEditModel(model); }}
                            title="Sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            className="vehicle-model-action-btn vehicle-model-action-btn--danger"
                            onClick={(e) => { e.stopPropagation(); handleDeleteModel(model); }}
                            title="Xóa"
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

      {/* Detail Modal */}
      {selectedModel && (
        <VehicleModelDetailModal
          isOpen={showDetailModal}
          model={selectedModel}
          onClose={handleDetailModalClose}
          onEdit={() => {
            setShowDetailModal(false);
            handleEditModel(selectedModel);
          }}
          onDelete={handleDeleteModel}
        />
      )}

      {/* Form Modal */}
      <VehicleModelFormModal
        isOpen={showFormModal}
        model={editingModel}
        onClose={() => {
          setShowFormModal(false);
          setEditingModel(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

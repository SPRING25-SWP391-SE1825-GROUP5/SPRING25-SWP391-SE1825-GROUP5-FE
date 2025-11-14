import React, { useEffect, useState, useRef } from 'react';
import {
  getAllTimeSlots,
  getTimeSlotById,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot
} from '../../services/timeSlotService';
import { TimeSlot, CreateTimeSlotRequest } from '../../types/timeslot';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Edit, Trash2, Eye, List, LayoutDashboard, Menu, Download, PlusSquare, Search, Circle } from 'lucide-react';
import './TimeSlotManagement.scss';

const STATUS_OPTIONS = [
  { value: 'all', label: (<><Circle size={14} color="#FFD875" style={{marginRight:4}}/>Tất cả</>) },
  { value: 'active', label: (<><Circle size={14} color="#10B981" style={{marginRight:4}}/>Đang dùng</>) },
  { value: 'inactive', label: (<><Circle size={14} color="#EF4444" style={{marginRight:4}}/>Ngừng</>) },
];

const INIT_FORM = { slotLabel: '', slotTimeStart: '', slotTimeEnd: '', isActive: true };
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const TimeSlotManagement = () => {
  const [data, setData] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [modalError, setModalError] = useState('');
  const [showDelete, setShowDelete] = useState<{ id: number, label: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);

  const pagedData = (data || []).slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    function handleClick(e: any) {
      if (openPageSizeMenu && pageSizeRef.current && !pageSizeRef.current.contains(e.target)) setOpenPageSizeMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openPageSizeMenu]);

  const fetchList = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllTimeSlots(filters.status);
      let list = Array.isArray(res.data) ? res.data as TimeSlot[] : [];
      if (filters.search) list = list.filter(x => x.slotLabel.toLowerCase().includes(filters.search.toLowerCase()));
      setData(list);
    } catch {
      setError('Không thể tải danh sách khung giờ, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchList(); setPage(1); }, [filters, pageSize]);

  const openCreate = () => { setEditId(null); setForm(INIT_FORM); setModalError(''); setShowModal(true); };
  const openEdit = async (id: number) => {
    setLoading(true);
    try {
      const res = await getTimeSlotById(id);
      setForm({
        slotLabel: res.data.slotLabel || '',
        slotTimeStart: res.data.slotTimeStart?.slice(0, 5) || '',
        slotTimeEnd: res.data.slotTimeEnd?.slice(0, 5) || '',
        isActive: res.data.isActive,
      });
      setEditId(id);
      setModalError('');
      setShowModal(true);
    } catch {
      setToast('Không thể tải chi tiết khung giờ');
    } finally { setLoading(false); }
  };
  const handleSave = async () => {
    setModalError('');
    if (!form.slotLabel.trim()) return setModalError('Vui lòng nhập nhãn khung giờ');
    if (!form.slotTimeStart || !form.slotTimeEnd) return setModalError('Vui lòng nhập giờ bắt đầu và kết thúc');
    if (form.slotTimeEnd <= form.slotTimeStart) return setModalError('Giờ kết thúc phải lớn hơn giờ bắt đầu');
    try {
      if (!editId) {
        await createTimeSlot(form as CreateTimeSlotRequest);
        setToast('Tạo khung giờ thành công');
      } else {
        await updateTimeSlot(editId, form);
        setToast('Cập nhật khung giờ thành công');
      }
      setShowModal(false);
      fetchList();
    } catch (e: any) {
      setModalError(e?.response?.data?.message || 'Lỗi không xác định');
    }
  };
  const handleDelete = async (id: number) => {
    try {
      await deleteTimeSlot(id);
      setToast('Đã xóa khung giờ');
      setShowDelete(null);
      fetchList();
    } catch (e: any) {
      setToast(e?.response?.data?.message || 'Không thể xóa (có thể đang được sử dụng)');
    }
  };

  // Pagination
  const totalItems = data ? data.length : 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  return (
    <div className="admin-page timeslot-management" style={{paddingLeft:24,paddingRight:24,paddingTop:64}}>
      <div className="users-toolbar">
        <div className="toolbar-top">
          <div className="toolbar-left">
            {/* removed dashboard chip */}
            <div className="toolbar-sep"></div>
          </div>
          <div className="toolbar-search">
            <span className="icon"><Search size={16}/></span>
          <input
              placeholder="Tìm nhãn khung giờ..."
            value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              onFocus={e => e.target.classList.add('search-input-focus')}
              onBlur={e => e.target.classList.remove('search-input-focus')}
            />
            <span className="search-underline"></span>
          </div>
          <div className="toolbar-actions">
            <button className="accent-button" onClick={openCreate}><PlusSquare size={18} style={{marginRight:6}}/>Thêm khung giờ</button>
          </div>
        </div>
        <div className="toolbar-bottom">
          <div className="toolbar-filters">
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value} className={`toolbar-chip ${filters.status === opt.value ? 'is-active' : ''}`} onClick={() => setFilters(f => ({ ...f, status: opt.value }))}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
              <th style={{ width: 48 }}><input type="checkbox" className="table-checkbox" disabled /></th>
                <th>Nhãn khung giờ</th>
                <th>Từ giờ</th>
                <th>Đến giờ</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>Đang tải...</td></tr>
            ) : error ? (
              <tr><td colSpan={7} style={{ color: 'red', textAlign: 'center' }}>{error}</td></tr>
            ) : pagedData.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>Không có dữ liệu</td></tr>
            ) : (
              pagedData.map((slot, idx) => {
                const anySlot: any = slot as any;
                const startDisplay = (slot as any).slotTimeStart || (anySlot.slotTime ? String(anySlot.slotTime).slice(0,5) : '') || (slot as any).slotLabel?.split('-')[0] || '';
                const endDisplay = (slot as any).slotTimeEnd || ((slot as any).slotLabel && (slot as any).slotLabel.includes('-') ? (slot as any).slotLabel.split('-')[1] : '') || '';
                return (
                <tr key={slot.id}>
                  <td><input type="checkbox" className="table-checkbox" /></td>
                  <td>{slot.slotLabel || ''}</td>
                  <td>{startDisplay}</td>
                  <td>{endDisplay}</td>
                  <td>{slot.isActive ? 'Đang dùng' : 'Ngừng'}</td>
                  <td>{slot.createdAt?.slice(0, 10) || ''}</td>
                  <td>
                    <button className="table-action-btn" onClick={() => openEdit(slot.id)}><Edit size={16} /></button>
                    <button className="table-action-btn" onClick={() => setShowDelete({ id: slot.id, label: slot.slotLabel })}><Trash2 size={16} /></button>
                  </td>
                </tr>
              )})
            )}
            </tbody>
          </table>
        <div className="pagination-controls-bottom">
          <div className="pagination-info">
            <span className="pagination-label">Hàng mỗi trang</span>
            <div className={`pill-select custom-dropdown${openPageSizeMenu ? ' open' : ''}`} ref={pageSizeRef} tabIndex={0}
              onClick={() => setOpenPageSizeMenu(open => !open)}
              onBlur={() => setOpenPageSizeMenu(false)}
              style={{ cursor: 'pointer', userSelect: 'none' }}>
              <span className="pill-trigger" style={{ minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 26 }}>{pageSize}</span>
              <svg className="caret" style={{ marginLeft: 6 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              {openPageSizeMenu && (
                <ul className="dropdown-menu" style={{ position: 'absolute', zIndex: 100, left: 0, top: '100%', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: '64px', listStyle: 'none', padding: 0, margin: '6px 0 0 0', border: '1px solid #ccc', borderRadius: 8 }}>
                  {PAGE_SIZE_OPTIONS.map(option => (
                    <li
                      key={option}
                      className={option === pageSize ? 'selected-dropdown-option' : ''}
                      style={{ padding: '8px 12px', color: option === pageSize ? '#FFA726' : '#222', background: option === pageSize ? '#FFF7D0' : 'transparent', cursor: 'pointer', borderRadius: 8, textAlign: 'center' }}
                      onMouseDown={e => { e.preventDefault(); setPageSize(option); setPage(1); setOpenPageSizeMenu(false) }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <span className="pagination-range">
              {rangeStart}–{rangeEnd} của {totalItems} hàng
            </span>
          </div>
          <div className="pagination-right-controls">
            <button className={`pager-btn ${page === 1 ? 'is-disabled' : ''}`} disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft size={16} /></button>
            <button className={`pager-btn ${page === 1 ? 'is-disabled' : ''}`} disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
            <div className="pager-pages">
              {page > 2 && <button className="pager-btn" onClick={() => setPage(1)}>1</button>}
              {page > 3 && <span className="pager-ellipsis">…</span>}
              {page > 1 && <button className="pager-btn" onClick={() => setPage(page - 1)}>{page - 1}</button>}
              <button className="pager-btn is-active">{page}</button>
              {page < totalPages && <button className="pager-btn" onClick={() => setPage(Math.min(totalPages, page + 1))}>{Math.min(totalPages, page + 1)}</button>}
              {page < totalPages - 2 && <span className="pager-ellipsis">…</span>}
              {page < totalPages - 1 && <button className="pager-btn" onClick={() => setPage(totalPages)}>{totalPages}</button>}
            </div>
            <button className={`pager-btn ${page === totalPages ? 'is-disabled' : ''}`} disabled={page === totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))}><ChevronRight size={16} /></button>
            <button className={`pager-btn ${page === totalPages ? 'is-disabled' : ''}`} disabled={page === totalPages} onClick={() => setPage(totalPages)}><ChevronsRight size={16} /></button>
          </div>
        </div>
      </div>
      {/* Modal nhập/xoá giống cũ, chỉ sửa class hoặc style nhỏ nếu cần */}
      {showModal && (
        <div className="admin-modal-backdrop">
        <div className="admin-modal">
            <div className="modal-header">{editId ? 'Sửa khung giờ' : 'Thêm khung giờ'}</div>
          <div className="modal-body">
            <label>Nhãn khung giờ</label>
              <input value={form.slotLabel} onChange={e => setForm(f => ({ ...f, slotLabel: e.target.value }))} />
            <label>Từ giờ</label>
              <input type="time" value={form.slotTimeStart} onChange={e => setForm(f => ({ ...f, slotTimeStart: e.target.value }))} />
            <label>Đến giờ</label>
              <input type="time" value={form.slotTimeEnd} onChange={e => setForm(f => ({ ...f, slotTimeEnd: e.target.value }))} />
              <label style={{ marginTop: 12 }}><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Đang dùng</label>
              {modalError && <div style={{ marginTop: 8, color: 'red' }}>{modalError}</div>}
          </div>
          <div className="modal-footer">
              <button onClick={() => setShowModal(false)}>Đóng</button>
              <button onClick={handleSave} style={{ marginLeft: 8 }}>Lưu</button>
            </div>
          </div>
        </div>
      )}
      {showDelete && (
        <div className="admin-modal-backdrop">
        <div className="admin-modal">
          <div className="modal-header">Xác nhận xoá</div>
          <div className="modal-body">
              Bạn có chắc chắn muốn xoá <b>{showDelete.label}</b>?<br />Thao tác này không thể hoàn tác!
          </div>
          <div className="modal-footer">
              <button onClick={() => setShowDelete(null)}>Huỷ</button>
              <button style={{ marginLeft: 8, background: '#DC2626', color: '#fff' }} onClick={() => handleDelete(showDelete.id)}>Xoá</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
};

export default TimeSlotManagement;

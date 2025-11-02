import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Clock,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Circle,
  AlertCircle,
  X,
  User as UserIcon,
  Lock,
  Calendar as CalendarIcon,
  MapPin as MapPinIcon,
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
  AtSign,
  Settings,
} from "lucide-react";
import { ChevronDownIcon, ShieldCheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { UserCreateModal } from '@/components/forms'
import toast from 'react-hot-toast';

// Định nghĩa kiểu người dùng dành riêng cho trang Admin (khác store auth)
type AdminUser = {
  userId: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  address?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
  emailVerified?: boolean;
};
import { UserService } from "@/services";
// import type { CreateUserByAdminRequest } from "@/services/userService";
import './Users.scss'

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all"); // all, email, phone
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("fullName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  // Đã loại bỏ modal tạo người dùng và state liên quan

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    active: 0,
    inactive: 0,
    admins: 0,
  });
  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  // Custom dropdown state for role & status pills (headless)
  const [openRoleMenu, setOpenRoleMenu] = useState(false);
  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false);
  const [openAddFilterMenu, setOpenAddFilterMenu] = useState(false);
  type AddedFilter = { id: number; type: 'status' | 'role' | 'verified' | 'sort'; value: any; label: string };
  const [addedFilters, setAddedFilters] = useState<AddedFilter[]>([]);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const roleRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const pageSizeRef = useRef<HTMLDivElement | null>(null);
  const addFilterRef = useRef<HTMLDivElement | null>(null);
  const nextFilterId = useRef(1);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setOpenRoleMenu(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setOpenStatusMenu(false);
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) setOpenPageSizeMenu(false);
      if (addFilterRef.current && !addFilterRef.current.contains(e.target as Node)) setOpenAddFilterMenu(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);
  const addFilterPill = (type: AddedFilter['type'], value: any, label: string) => {
    setAddedFilters(prev => {
      // không thêm trùng cùng type+value
      if (prev.some(f => f.type === type && String(f.value) === String(value))) return prev;
      let next = [...prev];
      // Loại trừ trường hợp verified true/false cùng lúc: giữ cái mới, bỏ cái cũ
      if (type === 'verified') {
        next = next.filter(f => f.type !== 'verified');
      }
      return [...next, { id: nextFilterId.current++, type, value, label }];
    });
    setOpenAddFilterMenu(false);
  };
  const removeFilterPill = (id: number) => setAddedFilters(prev => prev.filter(f => f.id !== id));

  // Force page background to white while on Admin Users
  useEffect(() => {
    const previousBg = document.body.style.background;
    document.body.style.background = '#fff';
    return () => { document.body.style.background = previousBg; };
  }, []);


  useEffect(() => {
    fetchUsers();
  }, [pageNumber, pageSize, searchTerm, searchType, filterRole, filterStatus, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, []); 

  // Keep selections in sync with current list
  useEffect(() => {
    const visibleIds = users.map(u => u.userId);
    setSelectedUserIds(prev => prev.filter(id => visibleIds.includes(id)));
  }, [users]);

  const allVisibleIds = users.map(u => u.userId);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedUserIds.includes(id));
  const handleToggleAll = (checked: boolean) => {
    setSelectedUserIds(checked ? allVisibleIds : []);
  };
  const handleToggleOne = (id: number, checked: boolean) => {
    setSelectedUserIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        pageNumber,
        pageSize,
        // Ưu tiên các filter pill; nếu không có, dùng state mặc định
        role: (addedFilters.find(f=>f.type==='role')?.value || (filterRole !== 'all' ? filterRole : undefined)) as any,
        isActive: ((): any => {
          const st = addedFilters.find(f=>f.type==='status')?.value as string | undefined;
          if (st) return st === 'active';
          return filterStatus !== 'all' ? filterStatus === 'active' : undefined;
        })(),
        emailVerified: addedFilters.find(f=>f.type==='verified')?.value as boolean | undefined,
        sortBy: (addedFilters.find(f=>f.type==='sort')?.value as string | undefined) || sortBy,
        sortOrder,
      };

      // Thêm searchTerm dựa trên searchType
      if (searchTerm.trim()) {
        if (searchType === "email") {
          params.email = searchTerm.trim();
        } else if (searchType === "phone") {
          params.phoneNumber = searchTerm.trim();
        } else {
          // Tìm kiếm tất cả (tên, email, số điện thoại)
          params.searchTerm = searchTerm.trim();
        }
      }

      const res = await UserService.getUsers(params);
      let users = res.data?.users || [];

      // Lọc client-side dựa trên trạng thái nếu cần
      if (filterStatus === 'active') {
        users = users.filter(u => u.isActive === true);
      } else if (filterStatus === 'inactive') {
        users = users.filter(u => u.isActive === false);
      }

      if (users.length > 0) {
        users = users.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (sortBy) {
            case 'fullName':
              aValue = a.fullName?.toLowerCase() || '';
              bValue = b.fullName?.toLowerCase() || '';
              break;
            case 'email':
              aValue = a.email?.toLowerCase() || '';
              bValue = b.email?.toLowerCase() || '';
              break;
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            case 'role':
              aValue = a.role?.toLowerCase() || '';
              bValue = b.role?.toLowerCase() || '';
              break;
            default:
              aValue = a.fullName?.toLowerCase() || '';
              bValue = b.fullName?.toLowerCase() || '';
          }

          if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });
      }

      setUsers(users as unknown as AdminUser[]);
      const count = (res.data?.total ?? users.length) as number;
      setTotalCount(count);
      setTotalPages(res.data?.totalPages || Math.max(1, Math.ceil(count / pageSize)));
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await UserService.getUsers({ pageNumber: 1, pageSize: 100 });
      const allUsers = res.data?.users || [];
      

      setStatsData({
        totalUsers: allUsers.length,
        active: allUsers.filter((u) => u.isActive).length,
        inactive: allUsers.filter((u) => !u.isActive).length,
        admins: allUsers.filter((u) => u.role === "ADMIN").length,
      });
    } catch (err) {
      console.error("Không thể tải thống kê:", err);
    }
  };

  const roles = [
    { value: "all", label: "Tất cả vai trò" },
    { value: "ADMIN", label: "Quản trị viên" },
    { value: "STAFF", label: "Nhân viên" },
    { value: "CUSTOMER", label: "Khách hàng" },
    { value: "MANAGER", label: "Quản lí" },
    { value: "TECHNICIAN", label: "Kỹ thuật viên" },
  ];

  const statuses = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Không hoạt động" },
  ];

  const searchTypes = [
    { value: "all", label: "Tất cả" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Số điện thoại" },
  ];

  const sortOptions = [
    { value: "fullName", label: "Tên" },
    { value: "email", label: "Email" },
    { value: "createdAt", label: "Ngày tạo" },
    { value: "role", label: "Vai trò" },
  ];

  const getRoleLabel = (role: string) => {
    const normalizedRole = role.toUpperCase();
    const map: Record<string, string> = {
      ADMIN: "Quản trị viên",
      STAFF: "Nhân viên",
      CUSTOMER: "Khách hàng",
      MANAGER: "Quản lí",
      TECHNICIAN: "Kỹ thuật viên",
    };
    return map[normalizedRole] || role;
  };

  const getStatusLabel = (isActive: boolean) =>
    isActive ? "Hoạt động" : "Không hoạt động";

  const getRoleColor = (role: string) => {
    const normalizedRole = role.toUpperCase();
    const colors: Record<string, string> = {
      ADMIN: "var(--error-500)",
      STAFF: "var(--primary-500)",
      CUSTOMER: "var(--primary-500)",
      MANAGER: "var(--warning-500)",
      TECHNICIAN: "var(--purple-500)",
    };
    return colors[normalizedRole] || "var(--text-secondary)";
  };

  const getRoleBadgeStyle = (role: string) => {
    const normalizedRole = role.toUpperCase();
    const styles: Record<string, any> = {
      ADMIN: {
        background: "var(--error-50)",
        color: "var(--error-700)",
        border: "1px solid var(--error-500)"
      },
      STAFF: {
        background: "#d4e4ff",
        color: "#2558b0",
        border: "1px solid #2558b0"
      },
      CUSTOMER: {
        background: "var(--primary-50)",
        color: "var(--primary-700)",
        border: "1px solid var(--primary-200)"
      },
      MANAGER: {
        background: "var(--warning-50)",
        color: "var(--warning-700)",
        border: "1px solid var(--warning-700)"
      },
      TECHNICIAN: {
        background: "#f3e8ff",
        color: "#7c3aed",
        border: "1px solid #c4b5fd"
      }
    };
    return styles[normalizedRole] || {
      background: "var(--bg-secondary)",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-primary)"
    };
  };

  const stats = [
    {
      label: "Tổng người dùng",
      value: statsData.totalUsers,
      color: "var(--primary-500)",
      icon: UserCheck,
    },
    {
      label: "Hoạt động",
      value: statsData.active,
      color: "var(--success-500)",
      icon: Circle,
    },
    {
      label: "Không hoạt động",
      value: statsData.inactive,
      color: "var(--error-500)",
      icon: AlertCircle,
    },
    {
      label: "Admin",
      value: statsData.admins,
      color: "var(--warning-500)",
      icon: Shield,
    },
  ];

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: AdminUser) => {
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      const newStatus = !user.isActive;
      await UserService.updateUserStatus(user.userId.toString(), newStatus);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.userId === user.userId 
            ? { ...u, isActive: newStatus }
            : u
        )
      );
      
      toast.success(`Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} người dùng "${user.fullName}"`);
      
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      
      // Extract error message from response
      let errorMessage = 'Không thể cập nhật trạng thái người dùng';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(`Lỗi: ${errorMessage}`);
    }
  };

  // Đã xóa handleCreateUser và handleCreateUserFormChange

  const handleSearchTypeChange = (newSearchType: string) => {
    setSearchType(newSearchType);
    setSearchTerm(""); // Clear search term when changing search type
    setPageNumber(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageNumber(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Don't reset page number here to avoid losing focus
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const { blob, filename } = await UserService.exportUsers({
        pageNumber,
        pageSize,
        searchTerm,
        sortBy,
        sortOrder,
        role: filterRole === 'all' ? undefined : filterRole,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'users.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export users failed:', err);
      alert('Không thể xuất danh sách người dùng. Vui lòng thử lại!');
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // If clicking the same field, toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a different field, set it as sort field with ascending order
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

  
  if (error) return (
    <div style={{ 
      padding: "32px", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      minHeight: "200px",
      background: "var(--bg-secondary)"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "24px",
        background: "var(--error-50)",
        borderRadius: "12px",
        border: "1px solid var(--error-200)",
        color: "var(--error-700)"
      }}>
        <div style={{ fontSize: "24px" }}>⚠️</div>
        <p style={{ margin: 0, textAlign: "center" }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="admin-users" style={{ 
      padding: '0px 16px 16px 16px', 
      background: '#fff', 
      minHeight: '100vh',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(-20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideInFromTop {
          from { 
            opacity: 0; 
            transform: translateY(-30px) translateX(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) translateX(0); 
          }
        }
      `}</style>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Quản lý Người dùng
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý và theo dõi tất cả người dùng trong hệ thống
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} />
        </div>
      {/* Toolbar thay thế cards + filters */}
      <div className="users-toolbar">
        <div className="toolbar-top">
          <div className="toolbar-left">
          <button type="button" className="toolbar-chip"><LayoutGrid size={14} /> Bảng</button>
          <button type="button" className="toolbar-chip"><LayoutGrid size={14} /> Bảng điều khiển</button>
          <button type="button" className="toolbar-chip"><ListIcon size={14} /> Danh sách</button>
          <div className="toolbar-sep" />
      </div>
        <div className="toolbar-right" style={{ flex: 1 }}>
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
            <button type="button" className="toolbar-chip"><EyeOff size={14} /> Ẩn</button>
            <button type="button" className="toolbar-chip"><SlidersHorizontal size={14} /> Tùy chỉnh</button>
            <button type="button" className="toolbar-btn" onClick={handleExport} disabled={exporting}>
              <Download size={14} /> {exporting ? 'Đang xuất...' : 'Xuất'}
            </button>
            <button 
              type="button" 
              className="accent-button toolbar-adduser" 
              onClick={() => setOpenCreateModal(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 216, 117, 0.6), 0 0 40px rgba(255, 216, 117, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={16} /> Thêm người dùng
            </button>
                </div>
              </div>
            </div>
          <div className="toolbar-filters" style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="pill-select" ref={roleRef} onClick={(e)=>{ e.stopPropagation(); setOpenStatusMenu(false); setOpenRoleMenu(v=>!v); }}>
            <Shield size={14} className="icon" />
            <button type="button" className="pill-trigger">{roles.find(r=>r.value===filterRole)?.label}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openRoleMenu && (
              <ul className="pill-menu show">
                {roles.map(r => (
                  <li key={r.value} className={`pill-item ${filterRole===r.value ? 'active' : ''}`}
                      onClick={()=>{ setFilterRole(r.value); setPageNumber(1); setOpenRoleMenu(false); }}>
                  {r.label}
                  </li>
              ))}
              </ul>
            )}
          </div>
          <div className="pill-select status-filter" ref={statusRef} onClick={(e)=>{ e.stopPropagation(); setOpenRoleMenu(false); setOpenStatusMenu(v=>!v); }}>
            <Lock size={14} className="icon" />
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
            {/* Các pill filter được thêm động: đặt giữa filter mặc định và nút thêm */}
            {addedFilters.map(f => (
              <span key={f.id} className="toolbar-chip" style={{ display:'inline-flex', alignItems:'center' }}>
                {f.label}
                <button type="button" style={{ marginLeft:6, border:'none', background:'transparent', cursor:'pointer', color:'var(--text-tertiary)' }} onClick={()=>removeFilterPill(f.id)}>×</button>
              </span>
            ))}
          <div ref={addFilterRef} style={{ position:'relative' }}>
            <button type="button" className="toolbar-chip" onClick={() => setOpenAddFilterMenu(v=>!v)}><Plus size={14} /> Thêm bộ lọc</button>
            {openAddFilterMenu && (
              <div style={{ position:'absolute', top:'36px', left:0, width:320, background:'#fff', border:'1px solid rgba(226,232,240,.9)', borderRadius:12, boxShadow:'0 8px 16px rgba(0,0,0,.10)', zIndex:50 }}>
                <ul style={{ listStyle:'none', margin:0, padding:'6px 0 10px' }}>
                  <li style={{ padding:'10px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontSize:14, color:'var(--text-primary)' }} onClick={()=>addFilterPill('verified',true,'Xác thực email: Đã xác thực')}>
                    <ShieldCheckIcon width={16} height={16} /> Xác thực email: Đã xác thực
                  </li>
                  <li style={{ padding:'10px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontSize:14, color:'var(--text-primary)' }} onClick={()=>addFilterPill('verified',false,'Xác thực email: Chưa xác thực')}>
                    <Clock width={16} height={16} /> Xác thực email: Chưa xác thực
                  </li>
                  <li style={{ padding:'10px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontSize:14, color:'var(--text-primary)' }} onClick={()=>addFilterPill('sort','createdAt','Sắp xếp: Ngày tạo')}>
                    <Calendar width={16} height={16} /> Sắp xếp: Ngày tạo
                  </li>
                </ul>
              </div>
            )}
          </div>
          </div>
      </div>

      {/* Users List */}
      <div style={{
        background: 'var(--bg-card)',
        padding: 0,
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none'
      }}>
        {error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: 'var(--error-500)' 
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'var(--error-50)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              ⚠️
            </div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: 'var(--text-secondary)' 
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--bg-secondary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--text-tertiary)'
            }}>
              <UserCheck size={32} />
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
              {searchTerm ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Thêm người dùng mới để bắt đầu'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'flex-end', margin: '8px 0 6px', color:'var(--text-secondary)', fontSize: 13 }}>
              Tổng số người dùng: <strong style={{ marginLeft: 6, color:'var(--text-primary)' }}>{totalCount}</strong>
            </div>
          <div style={{ overflow: 'auto' }}>
            <table className="users-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
              border: 'none'
            }}>
              <thead>
                <tr className="table-header-yellow" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                  <th 
                    style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500'
                    }}
                  >
                    <span className="th-inner"><input type="checkbox" className="users-checkbox" aria-label="Chọn tất cả" checked={isAllSelected} onChange={(e)=>handleToggleAll(e.target.checked)} /> <UserIcon size={16} className="th-icon" /> Họ tên</span>
                  </th>
                  <th 
                    style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500'
                    }}
                  >
                    <span className="th-inner"><AtSign size={16} className="th-icon" /> Email</span>
                  </th>
                  <th className="col-phone" style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <span className="th-inner"><Phone size={16} className="th-icon" /> Số điện thoại</span>
                  </th>
                  <th className="col-role"
                    style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500',
                      userSelect: 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                      <Shield size={16} className="th-icon" /> Vai trò
                    </div>
                  </th>
                  {/* Email verified column */}
                  <th
                    style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500'
                    }}
                  >
                    <span className="th-inner"><ShieldCheckIcon width={16} height={16} className="th-icon" /> Xác thực email</span>
                  </th>
                  <th className="col-status" style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <span className="th-inner" style={{ justifyContent:'flex-start' }}><Clock size={16} className="th-icon" /> Trạng thái</span>
                  </th>
                  <th 
                    style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                      <Calendar size={16} className="th-icon" /> Ngày tạo
                    </div>
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <span className="th-inner" style={{ justifyContent:'flex-start' }}><Settings size={16} className="th-icon" /> Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr 
                    key={u.userId}
                    onClick={() => handleViewUser(u)}
                    style={{
                      borderBottom: i < users.length - 1 ? '1px solid var(--border-primary)' : 'none',
                      transition: 'all 0.3s ease',
                      background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                      transform: 'translateY(0)',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      animation: `slideInFromTop ${0.1 * (i + 1)}s ease-out forwards`,
                      opacity: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 216, 117, 0.15)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <td style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      fontWeight: 400
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" className="users-checkbox" aria-label={`Chọn ${u.fullName || 'người dùng'}`} checked={selectedUserIds.includes(u.userId)} onChange={(e)=>handleToggleOne(u.userId, e.target.checked)} onClick={(e)=>e.stopPropagation()} />
                        {((u as any).avatarUrl || u.avatar) ? (
                          <img src={(u as any).avatarUrl || u.avatar || ''} alt={u.fullName || 'user'} className="users-avatar" />
                        ) : (
                          <div className="users-avatar users-avatar--fallback">
                          {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        )}
                        {u.fullName || 'Chưa có tên'}
                      </div>
                    </td>
                    <td style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)'
                    }}>
                      {u.email || 'Chưa có email'}
                    </td>
                    <td style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)'
                    }}>
                      {u.phoneNumber || 'Chưa có SĐT'}
                    </td>
                    <td className="col-role" style={{
                      padding: '8px 12px',
                      textAlign: 'left'
                    }}>
                      <div className="role-badge">{getRoleLabel(u.role)}</div>
                    </td>
                    {/* Email verified cell */}
                    <td style={{
                      padding: '8px 12px',
                      textAlign: 'left'
                    }}>
                      {u.emailVerified ? (
                        <span className="badge badge--enabled"><ShieldCheckIcon width={14} height={14} /> Đã xác thực</span>
                      ) : (
                        <span className="badge badge--disabled"><ShieldExclamationIcon width={14} height={14} /> Chưa xác thực</span>
                      )}
                    </td>
                    <td className="col-status" style={{
                      padding: '8px 12px',
                      textAlign: 'left'
                    }}>
                      <div className={`status-badge ${u.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                        <span className="dot" /> {u.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </div>
                    </td>
                    <td style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      textAlign: 'left'
                    }}>
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{
                      padding: '8px 12px',
                      textAlign: 'left'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        justifyContent: 'flex-start',
                        alignItems: 'center'
                      }}>
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); handleViewUser(u); }}
                          style={{
                            padding: '8px',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            width: '36px',
                            height: '36px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary-500)'
                            e.currentTarget.style.background = 'var(--primary-50)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-primary)'
                            e.currentTarget.style.background = 'var(--bg-card)'
                          }}
                          title="Xem chi tiết người dùng"
                        >
                          <Eye size={16} />
                        </button>
                        
                        
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleUserStatus(u); }}
                          style={{
                            padding: '8px',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            width: '36px',
                            height: '36px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = u.isActive ? 'var(--error-500)' : 'var(--success-500)'
                            e.currentTarget.style.background = u.isActive ? 'var(--error-50)' : 'var(--success-50)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-primary)'
                            e.currentTarget.style.background = 'var(--bg-card)'
                          }}
                          title={u.isActive ? 'Vô hiệu hóa người dùng' : 'Kích hoạt người dùng'}
                        >
                          {u.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
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

  {/* Pagination bar giống hình: trái thông tin, phải điều hướng */}
      <div style={{
    marginTop: '16px',
        display: 'flex',
    justifyContent: 'space-between',
        alignItems: 'center',
    background: 'transparent',
    padding: '8px 0'
  }}>
    {/* Left: Rows per page + range */}
    <div className="pagination-info">
      <span className="pagination-label">Hàng mỗi trang</span>
      <div className="pill-select" ref={pageSizeRef} onClick={(e) => { e.stopPropagation(); setOpenPageSizeMenu(v => !v); }}>
        <button type="button" className="pill-trigger">{pageSize}</button>
        <ChevronDownIcon width={20} height={20} className="caret caret-lg" />
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
          const end = start + users.length - 1;
          return totalCount > 0 ? `${start}–${end} của ${totalCount} hàng` : `${start}–${end}`;
        })()}
      </span>
    </div>

    {/* Right: Pagination Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* First Page */}
        <button type="button"
          disabled={pageNumber === 1}
            onClick={() => setPageNumber(1)}
          className={`pager-btn ${pageNumber === 1 ? 'is-disabled' : ''}`}
        >
            <ChevronsLeft size={16} />
        </button>

          {/* Previous Page */}
          <button type="button"
            disabled={pageNumber === 1}
            onClick={() => setPageNumber((p) => p - 1)}
            className={`pager-btn ${pageNumber === 1 ? 'is-disabled' : ''}`}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page Numbers */}
          <div className="pager-pages">
            {(() => {
              const items: React.ReactElement[] = [];
              const btn = (n: number, active = false) => (
                  <button
                  key={n}
                  onClick={() => setPageNumber(n)}
                  className={`pager-btn ${active ? 'is-active' : ''}`}
                >
                  {n}
                  </button>
                );

              // Hiển thị theo pattern: 1, 2, ..., 5
              items.push(btn(1, pageNumber === 1));
              items.push(btn(2, pageNumber === 2));
              items.push(<span key="ellipsis" className="pager-ellipsis">…</span>);
              items.push(btn(5, pageNumber === 5));
              
              return items;
            })()}
          </div>

          {/* Next Page */}
          <button type="button"
          disabled={pageNumber === totalPages}
          onClick={() => setPageNumber((p) => p + 1)}
            className={`pager-btn ${pageNumber === totalPages ? 'is-disabled' : ''}`}
          >
            <ChevronRight size={16} />
          </button>

          {/* Last Page */}
          <button type="button"
            disabled={pageNumber === totalPages}
            onClick={() => setPageNumber(totalPages)}
            className={`pager-btn ${pageNumber === totalPages ? 'is-disabled' : ''}`}
          >
            <ChevronsRight size={16} />
        </button>
        </div>
      </div>

    {/* Modal tạo người dùng */}
    <UserCreateModal
      open={openCreateModal}
      onClose={() => setOpenCreateModal(false)}
      onCreate={() => { toast.success('Đã chuẩn bị form, sẽ hoàn thiện ở bước tiếp theo'); setOpenCreateModal(false); }}
    />

      {showUserModal && selectedUser && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.6)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            color: 'var(--text-primary)', 
            borderRadius: '20px',
            border: '1px solid var(--border-primary)', 
            width: '600px', 
            maxWidth: '90vw', 
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border-primary)"
            }}>
              <h3 style={{ 
                margin: 0,
                fontSize: "20px",
                fontWeight: "600",
                color: "var(--text-primary)"
              }}>
                Thông tin chi tiết
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--bg-secondary)",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--error-50)"
                  e.currentTarget.style.color = "var(--error-600)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-secondary)"
                  e.currentTarget.style.color = "var(--text-secondary)"
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                background: "var(--bg-secondary)",
                borderRadius: "8px"
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  background: "var(--primary-500)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "600"
                }}>
                  {selectedUser.fullName ? selectedUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p style={{ 
                    margin: "0 0 4px 0",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "var(--text-primary)"
                  }}>
                    {selectedUser.fullName}
                  </p>
                  <p style={{ 
                    margin: 0,
                    fontSize: "14px",
                    color: "var(--text-secondary)"
                  }}>
                    {getRoleLabel(selectedUser.role)}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px"
                }}>
                  <Mail size={16} color="var(--info-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)" }}>Email</p>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)" }}>{selectedUser.email}</p>
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px"
                }}>
                  <Phone size={16} color="var(--success-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)" }}>Số điện thoại</p>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)" }}>{selectedUser.phoneNumber}</p>
                  </div>
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                background: "var(--bg-secondary)",
                borderRadius: "8px"
              }}>
                <MapPin size={16} color="var(--warning-600)" />
                <div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)" }}>Địa chỉ</p>
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)" }}>
                    {selectedUser.address || "Chưa cập nhật"}
                  </p>
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                background: "var(--bg-secondary)",
                borderRadius: "8px"
              }}>
                <Calendar size={16} color="var(--info-600)" />
                <div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)" }}>Ngày sinh</p>
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)" }}>
              {selectedUser.dateOfBirth || "Chưa cập nhật"}
            </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px",
                  flex: 1
                }}>
                  <Shield size={16} color="var(--primary-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)" }}>Vai trò</p>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)" }}>
                      {getRoleLabel(selectedUser.role)}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px",
                  flex: 1
                }}>
              {selectedUser.isActive ? (
                    <UserCheck size={16} color="var(--success-600)" />
                  ) : (
                    <UserX size={16} color="var(--error-600)" />
                  )}
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)" }}>Trạng thái</p>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)" }}>
              {getStatusLabel(selectedUser.isActive)}
            </p>
                  </div>
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                background: "var(--bg-secondary)",
                borderRadius: "8px"
              }}>
                <Clock size={16} color="var(--text-tertiary)" />
                <div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)" }}>Ngày tạo</p>
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)" }}>
                    {new Date(selectedUser.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: "24px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-primary)"
            }}>
            <button
              onClick={() => setShowUserModal(false)}
              style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                background: "var(--primary-500)",
                color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--primary-600)"
                  e.currentTarget.style.transform = "translateY(-1px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--primary-500)"
                  e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              Đóng
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Đã xoá Create User Modal */}
    </div>
  );
}

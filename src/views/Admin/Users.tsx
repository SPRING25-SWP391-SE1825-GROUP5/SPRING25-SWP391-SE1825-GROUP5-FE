import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit,
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
} from "lucide-react";

import type { User } from "@/store/authSlice";
import { UserService } from "@/services";
import type { CreateUserByAdminRequest } from "@/services/userService";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all"); // all, email, phone
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("fullName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState<CreateUserByAdminRequest>({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: false
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    active: 0,
    inactive: 0,
    admins: 0,
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [pageNumber, pageSize, debouncedSearchTerm, searchType, filterRole, filterStatus, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, []); 

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        pageNumber,
        pageSize,
        role: filterRole !== "all" ? filterRole : undefined,
        sortBy,
        sortOrder,
      };

      // Thêm searchTerm dựa trên searchType
      if (debouncedSearchTerm.trim()) {
        if (searchType === "email") {
          params.email = debouncedSearchTerm.trim();
        } else if (searchType === "phone") {
          params.phoneNumber = debouncedSearchTerm.trim();
        } else {
          // Tìm kiếm tất cả (tên, email, số điện thoại)
          params.searchTerm = debouncedSearchTerm.trim();
        }
      }

      const res = await UserService.getUsers(params);
      let users = res.data?.users || [];

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

      setUsers(users);
      setTotalPages(res.data?.totalPages || 1);
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

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const newStatus = !user.isActive;
      if (newStatus) {
        await UserService.activateUser(user.userId.toString());
        
      } else {
         await UserService.deactivateUser(user.userId.toString());
        
      }
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.userId === user.userId 
            ? { ...u, isActive: newStatus }
            : u
        )
      );
      
      alert(`Trạng thái người dùng "${user.fullName}" đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} thành công!`);
      
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
      
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  const handleCreateUser = async () => {
    setCreateUserLoading(true);
    setCreateUserError(null);
    
    try {
      // Validate required fields
      if (!createUserForm.fullName.trim()) {
        setCreateUserError('Vui lòng nhập họ tên');
        return;
      }
      if (!createUserForm.email.trim()) {
        setCreateUserError('Vui lòng nhập email');
        return;
      }
      if (!createUserForm.password.trim()) {
        setCreateUserError('Vui lòng nhập mật khẩu');
        return;
      }
      if (!createUserForm.phoneNumber.trim()) {
        setCreateUserError('Vui lòng nhập số điện thoại');
        return;
      }
      if (!createUserForm.dateOfBirth) {
        setCreateUserError('Vui lòng chọn ngày sinh');
        return;
      }
      if (!createUserForm.address.trim()) {
        setCreateUserError('Vui lòng nhập địa chỉ');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createUserForm.email)) {
        setCreateUserError('Email không hợp lệ');
        return;
      }

      // Phone validation (basic)
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(createUserForm.phoneNumber)) {
        setCreateUserError('Số điện thoại không hợp lệ');
        return;
      }

      // Password validation
      if (createUserForm.password.length < 6) {
        setCreateUserError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }

      const response = await UserService.createUserByAdmin(createUserForm);
      console.log('API Response:', {response});
      
      // Extract user data from response
      const newUser = response.data || response;
      console.log('Extracted User:', {newUser});
      
      // Add new user to the list
      setUsers(prevUsers => [newUser, ...prevUsers]);
      
      // Reset form and close modal
      setCreateUserForm({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: 'MALE',
        address: '',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: false
      });
      setShowCreateUserModal(false);
      
      // Show success message
      const userName = newUser?.fullName || newUser?.email || 'người dùng mới';
      alert(`Tạo người dùng ${userName} thành công!`);
      
      // Refresh stats
      fetchStats();
      
    } catch (err: any) {
      console.error('Error creating user:', err);
      
      let errorMessage = 'Không thể tạo người dùng';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setCreateUserError(errorMessage);
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleCreateUserFormChange = (field: keyof CreateUserByAdminRequest, value: any) => {
    setCreateUserForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (createUserError) {
      setCreateUserError(null);
    }
  };

  const handleSearchTypeChange = (newSearchType: string) => {
    setSearchType(newSearchType);
    setSearchTerm(""); // Clear search term when changing search type
    setDebouncedSearchTerm(""); // Also clear debounced term
    setPageNumber(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearchTerm(searchTerm); // Immediately set debounced term
    setPageNumber(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Don't reset page number here to avoid losing focus
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

  if (loading) return (
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
        background: "var(--bg-card)",
        borderRadius: "12px",
        border: "1px solid var(--border-primary)"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid var(--primary-200)",
          borderTop: "3px solid var(--primary-500)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>Đang tải dữ liệu...</p>
      </div>
    </div>
  );
  
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
    <div style={{ 
      padding: '24px', 
      background: 'var(--bg-secondary)', 
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
            fontWeight: '700', 
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
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={() => {
            fetchUsers();
            fetchStats();
          }} style={{
            padding: '12px 20px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '2px solid var(--border-primary)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.borderColor = 'var(--primary-500)'
            e.currentTarget.style.background = 'var(--primary-50)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
            e.currentTarget.style.borderColor = 'var(--border-primary)'
            e.currentTarget.style.background = 'var(--bg-card)'
          }}>
            <RefreshCw size={18} />
            Làm mới
          </button>
          
          <button onClick={() => {
            setShowCreateUserModal(true);
            setCreateUserError(null);
        }} style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s ease',
          transform: 'translateY(0)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <Plus size={18} />
          Thêm người dùng
        </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <s.icon size={20} />
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}>
                  {s.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '8px',
            }}>
              Tìm kiếm
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-tertiary)' 
              }} />
              <input
                type="text"
                placeholder={
                  searchType === "email" 
                    ? "Tìm kiếm theo email..." 
                    : searchType === "phone"
                    ? "Tìm kiếm theo số điện thoại..."
                    : "Tìm kiếm theo tên, email, SĐT..."
                }
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '2px solid var(--border-primary)',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-500)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-primary)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '8px' 
            }}>
              Vai trò
            </label>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPageNumber(1);
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-primary)',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '8px' 
            }}>
              Trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPageNumber(1);
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-primary)',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button 
              onClick={() => {
                setPageNumber(1)
                setSearchTerm('')
                setDebouncedSearchTerm('')
                setFilterRole('all')
                setFilterStatus('all')
                setSortBy('fullName')
                setSortOrder('asc')
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: '2px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-500)'
                e.currentTarget.style.background = 'var(--primary-50)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)'
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
            >
              <RefreshCw size={16} />
              Đặt lại bộ lọc
            </button>
          </div>
          
        </form>
      </div>

      {/* Users List */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '32px',
        borderRadius: '20px',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: '0'
          }}>
            Danh sách Người dùng
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              disabled={pageNumber === 1}
              onClick={() => setPageNumber((p) => p - 1)}
              style={{ 
                padding: "6px 10px", 
                borderRadius: "6px",
                border: "1px solid var(--border-primary)",
                background: pageNumber === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
                color: pageNumber === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: pageNumber === 1 ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (pageNumber !== 1) {
                  e.currentTarget.style.background = "var(--primary-50)"
                  e.currentTarget.style.borderColor = "var(--primary-500)"
                }
              }}
              onMouseLeave={(e) => {
                if (pageNumber !== 1) {
                  e.currentTarget.style.background = "var(--bg-card)"
                  e.currentTarget.style.borderColor = "var(--border-primary)"
                }
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{
              padding: "6px 10px",
              background: "var(--primary-50)",
              borderRadius: "6px",
              color: "var(--primary-700)",
              fontSize: "12px",
              fontWeight: "600",
              minWidth: "60px",
              textAlign: "center"
            }}>
              {pageNumber} / {totalPages}
            </span>
            <button
              disabled={pageNumber === totalPages}
              onClick={() => setPageNumber((p) => p + 1)}
              style={{ 
                padding: "6px 10px", 
                borderRadius: "6px",
                border: "1px solid var(--border-primary)",
                background: pageNumber === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
                color: pageNumber === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: pageNumber === totalPages ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (pageNumber !== totalPages) {
                  e.currentTarget.style.background = "var(--primary-50)"
                  e.currentTarget.style.borderColor = "var(--primary-500)"
                }
              }}
              onMouseLeave={(e) => {
                if (pageNumber !== totalPages) {
                  e.currentTarget.style.background = "var(--bg-card)"
                  e.currentTarget.style.borderColor = "var(--border-primary)"
                }
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: 'var(--text-secondary)' 
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border-primary)',
              borderTop: '3px solid var(--primary-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ margin: 0, fontSize: '16px' }}>Đang tải người dùng...</p>
          </div>
        ) : error ? (
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
              {debouncedSearchTerm ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {debouncedSearchTerm ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Thêm người dùng mới để bắt đầu'}
            </p>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--border-primary)'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <th 
                    onClick={() => handleSort('fullName')}
                    style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Tên
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        opacity: sortBy === 'fullName' ? 1 : 0.4,
                        transition: 'opacity 0.2s ease'
                      }}>
                        {getSortIcon('fullName')}
                      </div>
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('email')}
                    style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Email
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        opacity: sortBy === 'email' ? 1 : 0.4,
                        transition: 'opacity 0.2s ease'
                      }}>
                        {getSortIcon('email')}
                      </div>
                    </div>
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    Số điện thoại
                  </th>
                  <th 
                    style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                      border: 'none',
                      userSelect: 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Vai trò
                     
                    </div>
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    Trạng thái
                  </th>
                  <th 
                    onClick={() => handleSort('createdAt')}
                    style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Ngày tạo
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        opacity: sortBy === 'createdAt' ? 1 : 0.4,
                        transition: 'opacity 0.2s ease'
                      }}>
                        {getSortIcon('createdAt')}
                      </div>
                    </div>
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr 
                    key={u.userId}
                    style={{
                      borderBottom: i < users.length - 1 ? '1px solid var(--border-primary)' : 'none',
                      transition: 'all 0.3s ease',
                      background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                      transform: 'translateY(0)',
                      boxShadow: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary-50)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      fontWeight: '600'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0,
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        {u.fullName || 'Chưa có tên'}
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)'
                    }}>
                      {u.email || 'Chưa có email'}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)'
                    }}>
                      {u.phoneNumber || 'Chưa có SĐT'}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      textAlign: 'center'
                    }}>
                      {(() => {
                        const badgeStyle = getRoleBadgeStyle(u.role);
                        return (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: '20px',
                            background: badgeStyle.background,
                            color: badgeStyle.color,
                        fontSize: '12px',
                        fontWeight: '600',
                            border: badgeStyle.border,
                        whiteSpace: 'nowrap'
                      }}>
                        {getRoleLabel(u.role)}
                      </div>
                        );
                      })()}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: u.isActive ? 'var(--success-50)' : 'var(--error-50)',
                        color: u.isActive ? 'var(--success-700)' : 'var(--error-700)',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: `1px solid ${u.isActive ? 'var(--success-200)' : 'var(--error-200)'}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {u.isActive ? (
                          <>
                            <UserCheck size={12} fill="currentColor" />
                            Hoạt động
                          </>
                        ) : (
                          <>
                            <UserX size={12} fill="currentColor" />
                            Không hoạt động
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center'
                    }}>
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <button
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
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditUser(u); }}
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
                          title="Sửa người dùng"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
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
        )}
      </div>

      {/* Enhanced Pagination */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-card)',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Pagination Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* First Page */}
        <button
          disabled={pageNumber === 1}
            onClick={() => setPageNumber(1)}
          style={{ 
              padding: "8px 12px", 
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            background: pageNumber === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
            color: pageNumber === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
            cursor: pageNumber === 1 ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
          }}
          onMouseEnter={(e) => {
            if (pageNumber !== 1) {
              e.currentTarget.style.background = "var(--primary-50)"
              e.currentTarget.style.borderColor = "var(--primary-500)"
            }
          }}
          onMouseLeave={(e) => {
            if (pageNumber !== 1) {
              e.currentTarget.style.background = "var(--bg-card)"
              e.currentTarget.style.borderColor = "var(--border-primary)"
            }
          }}
        >
            <ChevronsLeft size={16} />
            <span style={{ marginLeft: '4px' }}>Đầu</span>
        </button>

          {/* Previous Page */}
          <button
            disabled={pageNumber === 1}
            onClick={() => setPageNumber((p) => p - 1)}
            style={{ 
              padding: "8px 12px", 
          borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: pageNumber === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
              color: pageNumber === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: pageNumber === 1 ? "not-allowed" : "pointer",
          fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (pageNumber !== 1) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (pageNumber !== 1) {
                e.currentTarget.style.background = "var(--bg-card)"
                e.currentTarget.style.borderColor = "var(--border-primary)"
              }
            }}
          >
            <ChevronLeft size={16} />
            <span style={{ marginLeft: '4px' }}>Trước</span>
          </button>

          {/* Page Numbers */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            margin: '0 8px'
          }}>
            {(() => {
              const pages = [];
              const maxVisible = 5;
              let startPage = Math.max(1, pageNumber - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);
              
              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              // First page + ellipsis
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => setPageNumber(1)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary-50)"
                      e.currentTarget.style.borderColor = "var(--primary-500)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-card)"
                      e.currentTarget.style.borderColor = "var(--border-primary)"
                    }}
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(
                    <span key="ellipsis1" style={{ padding: "8px 4px", color: "var(--text-tertiary)" }}>
                      ...
        </span>
                  );
                }
              }

              // Visible pages
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setPageNumber(i)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: i === pageNumber ? "1px solid var(--primary-500)" : "1px solid var(--border-primary)",
                      background: i === pageNumber ? "var(--primary-50)" : "var(--bg-card)",
                      color: i === pageNumber ? "var(--primary-700)" : "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: i === pageNumber ? "600" : "500",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (i !== pageNumber) {
                        e.currentTarget.style.background = "var(--primary-50)"
                        e.currentTarget.style.borderColor = "var(--primary-500)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (i !== pageNumber) {
                        e.currentTarget.style.background = "var(--bg-card)"
                        e.currentTarget.style.borderColor = "var(--border-primary)"
                      }
                    }}
                  >
                    {i}
                  </button>
                );
              }

              // Last page + ellipsis
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="ellipsis2" style={{ padding: "8px 4px", color: "var(--text-tertiary)" }}>
                      ...
                    </span>
                  );
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => setPageNumber(totalPages)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary-50)"
                      e.currentTarget.style.borderColor = "var(--primary-500)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-card)"
                      e.currentTarget.style.borderColor = "var(--border-primary)"
                    }}
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}
          </div>

          {/* Next Page */}
        <button
          disabled={pageNumber === totalPages}
          onClick={() => setPageNumber((p) => p + 1)}
          style={{ 
              padding: "8px 12px", 
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            background: pageNumber === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
            color: pageNumber === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
            cursor: pageNumber === totalPages ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
          }}
          onMouseEnter={(e) => {
            if (pageNumber !== totalPages) {
              e.currentTarget.style.background = "var(--primary-50)"
              e.currentTarget.style.borderColor = "var(--primary-500)"
            }
          }}
          onMouseLeave={(e) => {
            if (pageNumber !== totalPages) {
              e.currentTarget.style.background = "var(--bg-card)"
              e.currentTarget.style.borderColor = "var(--border-primary)"
            }
          }}
        >
            <span style={{ marginRight: '4px' }}>Sau</span>
            <ChevronRight size={16} />
          </button>

          {/* Last Page */}
          <button
            disabled={pageNumber === totalPages}
            onClick={() => setPageNumber(totalPages)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: pageNumber === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
              color: pageNumber === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: pageNumber === totalPages ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (pageNumber !== totalPages) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (pageNumber !== totalPages) {
                e.currentTarget.style.background = "var(--bg-card)"
                e.currentTarget.style.borderColor = "var(--border-primary)"
              }
            }}
          >
            <span style={{ marginRight: '4px' }}>Cuối</span>
            <ChevronsRight size={16} />
        </button>
        </div>
      </div>

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

      {/* Create User Modal */}
      {showCreateUserModal && (
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
            width: '800px', 
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
                Tạo người dùng mới
              </h3>
              <button
                onClick={() => {
                  setShowCreateUserModal(false);
                  setCreateUserError(null);
                }}
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
                <X size={16} />
              </button>
            </div>

            {/* Error Alert */}
            {createUserError && (
              <div style={{
                background: 'var(--error-50)',
                border: '1px solid var(--error-200)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: 'var(--error-700)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                {createUserError}
              </div>
            )}

            <div style={{ display: "grid", gap: "20px" }}>
              {/* Basic Information */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Họ và tên *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-tertiary)' 
                    }} />
                    <input
                      type="text"
                      placeholder="Nhập họ và tên"
                      value={createUserForm.fullName}
                      onChange={(e) => handleCreateUserFormChange('fullName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        border: '2px solid var(--border-primary)',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Email *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-tertiary)' 
                    }} />
                    <input
                      type="email"
                      placeholder="Nhập email"
                      value={createUserForm.email}
                      onChange={(e) => handleCreateUserFormChange('email', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        border: '2px solid var(--border-primary)',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Mật khẩu *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-tertiary)' 
                    }} />
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={createUserForm.password}
                      onChange={(e) => handleCreateUserFormChange('password', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        border: '2px solid var(--border-primary)',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Số điện thoại *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-tertiary)' 
                    }} />
                    <input
                      type="tel"
                      placeholder="Nhập số điện thoại"
                      value={createUserForm.phoneNumber}
                      onChange={(e) => handleCreateUserFormChange('phoneNumber', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        border: '2px solid var(--border-primary)',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Ngày sinh *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <CalendarIcon size={16} style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-tertiary)' 
                    }} />
                    <input
                      type="date"
                      value={createUserForm.dateOfBirth}
                      onChange={(e) => handleCreateUserFormChange('dateOfBirth', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        border: '2px solid var(--border-primary)',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Giới tính
                  </label>
                  <select
                    value={createUserForm.gender}
                    onChange={(e) => handleCreateUserFormChange('gender', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '10px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)', 
                  marginBottom: '8px' 
                }}>
                  Địa chỉ *
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPinIcon size={16} style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '12px', 
                    color: 'var(--text-tertiary)' 
                  }} />
                  <textarea
                    placeholder="Nhập địa chỉ"
                    value={createUserForm.address}
                    onChange={(e) => handleCreateUserFormChange('address', e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '10px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Vai trò
                  </label>
                  <select
                    value={createUserForm.role}
                    onChange={(e) => handleCreateUserFormChange('role', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '10px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="CUSTOMER">Khách hàng</option>
                    <option value="STAFF">Nhân viên</option>
                    <option value="MANAGER">Quản lí</option>
                    <option value="TECHNICIAN">Kỹ thuật viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Trạng thái
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: 'var(--text-primary)'
                    }}>
                      <input
                        type="checkbox"
                        checked={createUserForm.isActive}
                        onChange={(e) => handleCreateUserFormChange('isActive', e.target.checked)}
                        style={{ margin: 0 }}
                      />
                      Hoạt động
                    </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: 'var(--text-primary)'
                    }}>
                      <input
                        type="checkbox"
                        checked={createUserForm.emailVerified}
                        onChange={(e) => handleCreateUserFormChange('emailVerified', e.target.checked)}
                        style={{ margin: 0 }}
                      />
                      Email đã xác thực
                    </label>
                  </div>
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
                onClick={() => {
                  setShowCreateUserModal(false);
                  setCreateUserError(null);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--error-50)"
                  e.currentTarget.style.borderColor = "var(--error-200)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-secondary)"
                  e.currentTarget.style.borderColor = "var(--border-primary)"
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateUser}
                disabled={createUserLoading}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: createUserLoading ? "var(--bg-secondary)" : "var(--primary-500)",
                  color: createUserLoading ? "var(--text-tertiary)" : "#fff",
                  border: "none",
                  cursor: createUserLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  if (!createUserLoading) {
                    e.currentTarget.style.background = "var(--primary-600)"
                    e.currentTarget.style.transform = "translateY(-1px)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!createUserLoading) {
                    e.currentTarget.style.background = "var(--primary-500)"
                    e.currentTarget.style.transform = "translateY(0)"
                  }
                }}
              >
                {createUserLoading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid var(--border-primary)',
                      borderTop: '2px solid var(--primary-500)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Tạo người dùng
                  </>
                )}
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";

import type { User } from "@/store/authSlice";
import { UserService } from "@/services";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all"); // all, email, phone
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

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
  }, [pageNumber, pageSize, debouncedSearchTerm, searchType, filterRole, filterStatus]);

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

      setUsers(res.data?.users || []);
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

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: "Quản trị viên",
      STAFF: "Nhân viên",
      CUSTOMER: "Khách hàng",
      MANAGER: "Quản lí",
      TECHNICIAN: "Kỹ thuật viên",
    };
    return map[role] || role;
  };

  const getStatusLabel = (isActive: boolean) =>
    isActive ? "Hoạt động" : "Không hoạt động";

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "var(--error-500)",
      TEACHER: "var(--primary-500)",
      CUSTOMER: "var(--info-500)",
      TECHNICIAN: "var(--warning-500)",
    };
    return colors[role] || "var(--text-secondary)";
  };

  const stats = [
    {
      label: "Tổng người dùng",
      value: statsData.totalUsers,
      color: "var(--primary-500)",
    },
    {
      label: "Hoạt động",
      value: statsData.active,
      color: "var(--success-500)",
    },
    {
      label: "Không hoạt động",
      value: statsData.inactive,
      color: "var(--error-500)",
    },
    {
      label: "Admin",
      value: statsData.admins,
      color: "var(--warning-500)",
    },
  ];

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
  };

  const handleDeleteUser = (user: User) => {
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
    <div
      style={{
        padding: "32px",
        background: "var(--bg-secondary)",
        minHeight: "100vh",
        fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1 style={{ 
            fontSize: "32px", 
            fontWeight: "700", 
            color: "var(--text-primary)",
            margin: "0 0 8px 0"
          }}>
            Quản lý người dùng
          </h1>
          <p style={{ 
            fontSize: "16px", 
            color: "var(--text-secondary)",
            margin: "0"
          }}>
            Quản lý và theo dõi tất cả người dùng trong hệ thống
          </p>
        </div>
        <button
          style={{
            background: "var(--primary-500)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            boxShadow: "var(--shadow-sm)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--primary-600)"
            e.currentTarget.style.transform = "translateY(-1px)"
            e.currentTarget.style.boxShadow = "var(--shadow-md)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--primary-500)"
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "var(--shadow-sm)"
          }}
          onClick={() => {
            // Feature under development - no action
            alert("Chức năng thêm người dùng đang được phát triển!")
          }}
        >
          <Plus size={18} /> Thêm người dùng
        </button>
      </div>

      {/* Stats cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-card)",
              padding: "24px",
              borderRadius: "16px",
              border: "1px solid var(--border-primary)",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s ease",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "var(--shadow-md)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "var(--shadow-sm)"
            }}
          >
            <div style={{ 
              fontSize: "14px", 
              color: "var(--text-secondary)",
              marginBottom: "8px",
              fontWeight: "500"
            }}>
              {s.label}
            </div>
            <div style={{ 
              fontSize: "32px", 
              fontWeight: "700", 
              color: s.color,
              lineHeight: "1"
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Bộ lọc */}
      <form onSubmit={handleSearchSubmit} style={{ 
        display: "flex", 
        gap: "16px", 
        marginBottom: "24px",
        background: "var(--bg-card)",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid var(--border-primary)",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              top: "50%",
              left: "12px",
              transform: "translateY(-50%)",
              color: "var(--text-tertiary)",
            }}
          />
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
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 16px 12px 44px",
              border: "1px solid var(--border-primary)",
              borderRadius: "8px",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--primary-500)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-primary)"
            }}
          />
        </div>
        <select
          value={searchType}
          onChange={(e) => handleSearchTypeChange(e.target.value)}
          style={{ 
            padding: "12px 16px", 
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontSize: "14px",
            outline: "none",
            minWidth: "140px"
          }}
        >
          {searchTypes.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value);
            setPageNumber(1);
          }}
          style={{ 
            padding: "12px 16px", 
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontSize: "14px",
            outline: "none",
            minWidth: "160px"
          }}
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPageNumber(1);
          }}
          style={{ 
            padding: "12px 16px", 
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontSize: "14px",
            outline: "none",
            minWidth: "160px"
          }}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            background: "var(--primary-500)",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px"
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
          <Search size={16} />
          Tìm kiếm
        </button>
      </form>

      {/* Bảng user */}
      <div
        style={{
          overflowX: "auto",
          background: "var(--bg-card)",
          borderRadius: "16px",
          border: "1px solid var(--border-primary)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}
        >
          <thead>
            <tr style={{ 
              background: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border-primary)"
            }}>
              <th style={{ 
                padding: "20px 16px", 
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>Tên</th>
              <th style={{ 
                padding: "20px 16px", 
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>Email</th>
              <th style={{ 
                padding: "20px 16px", 
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Số điện thoại
              </th>
              <th style={{ 
                padding: "20px 16px", 
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Vai trò
              </th>
              <th style={{ 
                padding: "20px 16px", 
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Trạng thái
              </th>
              <th style={{ 
                padding: "20px 16px", 
                textAlign: "left",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Ngày tạo
              </th>
              <th style={{ 
                padding: "20px 16px", 
                textAlign: "center",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ 
                  padding: "40px", 
                  textAlign: "center",
                  color: "var(--text-secondary)"
                }}>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px"
                  }}>
                    <div style={{ fontSize: "48px" }}>🔍</div>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: "500" }}>
                      {debouncedSearchTerm ? "Không tìm thấy người dùng nào" : "Chưa có người dùng nào"}
                    </p>
                    {debouncedSearchTerm && (
                      <p style={{ margin: 0, fontSize: "14px" }}>
                        Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u, i) => (
              <tr
                key={u.userId}
                style={{
                  borderBottom: i < users.length - 1 ? "1px solid var(--border-primary)" : "none",
                  background: "var(--bg-card)",
                  transition: "background-color 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-secondary)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-card)"
                }}
              >
                <td style={{ 
                  padding: "16px",
                  fontWeight: "600",
                  color: "var(--text-primary)"
                }}>{u.fullName}</td>
                <td style={{ 
                  padding: "16px",
                  color: "var(--text-secondary)"
                }}>{u.email}</td>
                <td style={{ 
                  padding: "16px",
                  color: "var(--text-secondary)"
                }}>{u.phoneNumber}</td>
                <td style={{ padding: "16px" }}>
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: `${getRoleColor(u.role)}15`,
                      color: getRoleColor(u.role),
                      border: `1px solid ${getRoleColor(u.role)}30`
                    }}
                  >
                    {getRoleLabel(u.role)}
                  </span>
                </td>
                <td style={{ padding: "16px" }}>
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: u.isActive
                        ? "var(--success-50)"
                        : "var(--error-50)",
                      color: u.isActive 
                        ? "var(--success-700)" 
                        : "var(--error-700)",
                      border: u.isActive
                        ? "1px solid var(--success-200)"
                        : "1px solid var(--error-200)"
                    }}
                  >
                    {getStatusLabel(u.isActive)}
                  </span>
                </td>
                <td style={{ 
                  padding: "16px",
                  color: "var(--text-secondary)",
                  fontSize: "13px"
                }}>
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <button
                    onClick={() => handleViewUser(u)}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      border: "none",
                      background: "var(--info-50)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--info-100)"
                      e.currentTarget.style.transform = "scale(1.05)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--info-50)"
                      e.currentTarget.style.transform = "scale(1)"
                    }}
                  >
                    <Eye size={16} color="var(--info-600)" />
                  </button>
                  <button
                    onClick={() => handleEditUser(u)}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      border: "none",
                      background: "var(--warning-50)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--warning-100)"
                      e.currentTarget.style.transform = "scale(1.05)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--warning-50)"
                      e.currentTarget.style.transform = "scale(1)"
                    }}
                  >
                    <Edit size={16} color="var(--warning-600)" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u)}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      border: "none",
                      background: "var(--error-50)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--error-100)"
                      e.currentTarget.style.transform = "scale(1.05)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--error-50)"
                      e.currentTarget.style.transform = "scale(1)"
                    }}
                  >
                    <Trash2 size={16} color="var(--error-600)" />
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          marginTop: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          background: "var(--bg-card)",
          padding: "16px 24px",
          borderRadius: "12px",
          border: "1px solid var(--border-primary)",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <button
          disabled={pageNumber === 1}
          onClick={() => setPageNumber((p) => p - 1)}
          style={{ 
            padding: "10px 16px", 
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            background: pageNumber === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
            color: pageNumber === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
            cursor: pageNumber === 1 ? "not-allowed" : "pointer",
            fontSize: "14px",
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
          Trang trước
        </button>
        <span style={{
          padding: "10px 16px",
          background: "var(--primary-50)",
          borderRadius: "8px",
          color: "var(--primary-700)",
          fontSize: "14px",
          fontWeight: "600",
          minWidth: "120px",
          textAlign: "center"
        }}>
          Trang {pageNumber} / {totalPages}
        </span>
        <button
          disabled={pageNumber === totalPages}
          onClick={() => setPageNumber((p) => p + 1)}
          style={{ 
            padding: "10px 16px", 
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            background: pageNumber === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
            color: pageNumber === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
            cursor: pageNumber === totalPages ? "not-allowed" : "pointer",
            fontSize: "14px",
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
          Trang sau
        </button>
      </div>

      {showUserModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              padding: "32px",
              borderRadius: "16px",
              width: "500px",
              maxWidth: "90vw",
              border: "1px solid var(--border-primary)",
              boxShadow: "var(--shadow-lg)",
              animation: "modalSlideIn 0.3s ease-out"
            }}
          >
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
                  {selectedUser.fullName.charAt(0).toUpperCase()}
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
    </div>
  );
}

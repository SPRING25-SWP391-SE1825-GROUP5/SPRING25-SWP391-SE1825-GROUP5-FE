import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchUsers();
  }, [pageNumber, pageSize, searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    fetchStats();
  }, []); 

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await UserService.getUsers({
        pageNumber,
        pageSize,
        searchTerm: searchTerm || undefined,
        role: filterRole !== "all" ? filterRole : undefined,
      });

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
    { value: "TECHNICIAN", label: "Kỹ thuật viên" },
  ];

  const statuses = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Không hoạt động" },
  ];

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: "Quản trị viên",
      STAFF: "Nhân viên",
      CUSTOMER: "Khách hàng",
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

  if (loading) return <div style={{ padding: 24 }}>Đang tải dữ liệu...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;

  return (
    <div
      style={{
        padding: 24,
        background: "var(--bg-secondary)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 600 }}>Quản lý người dùng</h2>
        <button
          style={{
            background: "var(--primary-500)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={18} /> Thêm người dùng
        </button>
      </div>

      {/* Stats cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 12,
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {s.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Bộ lọc */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              top: "50%",
              left: 10,
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, SĐT..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPageNumber(1);
            }}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
            }}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value);
            setPageNumber(1);
          }}
          style={{ padding: "8px 12px", borderRadius: 8 }}
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
          style={{ padding: "8px 12px", borderRadius: 8 }}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bảng user */}
      <div
        style={{
          overflowX: "auto",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        >
          <thead>
            <tr style={{ background: "var(--bg-tertiary)" }}>
              <th style={{ padding: "14px 12px", textAlign: "left" }}>Tên</th>
              <th style={{ padding: "14px 12px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "14px 12px", textAlign: "left" }}>
                Số điện thoại
              </th>
              <th style={{ padding: "14px 12px", textAlign: "left" }}>
                Vai trò
              </th>
              <th style={{ padding: "14px 12px", textAlign: "left" }}>
                Trạng thái
              </th>
              <th style={{ padding: "14px 12px", textAlign: "left" }}>
                Ngày tạo
              </th>
              <th style={{ padding: "14px 12px", textAlign: "center" }}>
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr
                key={u.userId}
                style={{
                  borderTop: "1px solid var(--border-color)",
                  background: i % 2 === 0 ? "#fafafa" : "#fff",
                }}
              >
                <td style={{ padding: "12px" }}>{u.fullName}</td>
                <td style={{ padding: "12px" }}>{u.email}</td>
                <td style={{ padding: "12px" }}>{u.phoneNumber}</td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      background: `${getRoleColor(u.role)}22`,
                      color: getRoleColor(u.role),
                    }}
                  >
                    {getRoleLabel(u.role)}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      background: u.isActive
                        ? "rgba(0,200,100,0.1)"
                        : "rgba(200,0,0,0.1)",
                      color: u.isActive ? "green" : "red",
                    }}
                  >
                    {getStatusLabel(u.isActive)}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => handleViewUser(u)}
                    style={{
                      padding: 6,
                      borderRadius: 6,
                      border: "none",
                      background: "#e3f2fd",
                      cursor: "pointer",
                    }}
                  >
                    <Eye size={16} color="#1976d2" />
                  </button>
                  <button
                    onClick={() => handleEditUser(u)}
                    style={{
                      padding: 6,
                      borderRadius: 6,
                      border: "none",
                      background: "#fff3e0",
                      cursor: "pointer",
                    }}
                  >
                    <Edit size={16} color="#fb8c00" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u)}
                    style={{
                      padding: 6,
                      borderRadius: 6,
                      border: "none",
                      background: "#ffebee",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={16} color="#e53935" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <button
          disabled={pageNumber === 1}
          onClick={() => setPageNumber((p) => p - 1)}
          style={{ padding: "6px 12px", borderRadius: 8 }}
        >
          Trang trước
        </button>
        <span>
          Trang {pageNumber} / {totalPages}
        </span>
        <button
          disabled={pageNumber === totalPages}
          onClick={() => setPageNumber((p) => p + 1)}
          style={{ padding: "6px 12px", borderRadius: 8 }}
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
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              width: 500,
            }}
          >
            <h3 style={{ marginBottom: 12 }}>Thông tin chi tiết</h3>
            <p>
              <Mail size={16} /> {selectedUser.fullName}
            </p>
            <p>
              <Mail size={16} /> {selectedUser.email}
            </p>
            <p>
              <Phone size={16} /> {selectedUser.phoneNumber}
            </p>
            <p>
              <MapPin size={16} /> {selectedUser.address || "Chưa cập nhật"}
            </p>
            <p>
              <Calendar size={16} />{" "}
              {selectedUser.dateOfBirth || "Chưa cập nhật"}
            </p>
            <p>
              <Shield size={16} /> {getRoleLabel(selectedUser.role)}
            </p>
            <p>
              {selectedUser.isActive ? (
                <UserCheck size={16} />
              ) : (
                <UserX size={16} />
              )}{" "}
              {getStatusLabel(selectedUser.isActive)}
            </p>
            <p>
              <Clock size={16} /> Ngày tạo:{" "}
              {new Date(selectedUser.createdAt).toLocaleString()}
            </p>
            <button
              onClick={() => setShowUserModal(false)}
              style={{
                marginTop: 16,
                padding: "6px 12px",
                borderRadius: 8,
                background: "var(--primary-500)",
                color: "#fff",
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

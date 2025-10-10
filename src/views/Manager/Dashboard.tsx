import { useState } from 'react'
import { 
  Building2, 
  Users, 
  Calendar, 
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Bell,
  Search,
  Menu,
  LogOut,
  Settings,
  BarChart3,
  MessageSquare,
  FileText,
  Target,
  PieChart,
  Activity,
  Wrench,
  Package,
  ClipboardList,
  Phone,
  Mail,
  Edit,
  Trash2,
  Plus,
  Download,
  Filter,
  MoreVertical,
  Star,
  Eye,
  ShoppingCart,
  Truck,
  AlertTriangle
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import './manager.scss'

export default function ManagerDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Page components
  const renderPageContent = () => {
    switch (activePage) {
      case 'branches':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Branch Management
              </h2>
              <button style={{
                padding: '10px 20px',
                background: 'var(--primary-500)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Plus size={16} />
                Add Branch
              </button>
            </div>

            {/* Branch Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              {branchStats.map((stat, index) => (
                <div 
                  key={index}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: stat.color,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <h3 style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-secondary)',
                        margin: '0 0 4px 0',
                        fontWeight: '500'
                      }}>
                        {stat.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '24px', 
                          fontWeight: '700', 
                          color: 'var(--text-primary)'
                        }}>
                          {stat.value}
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)'
                        }}>
                          {stat.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Branches Table */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)',
              overflow: 'hidden',
              marginBottom: '32px'
            }}>
              <div style={{ 
                padding: '20px 24px', 
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Branches
                </h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <Filter size={16} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Filter</span>
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <Download size={16} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Export</span>
                  </div>
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Branch</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Address</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Staff</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Revenue</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchesData.map((branch, index) => (
                      <tr key={branch.id} style={{ borderBottom: index < branchesData.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              background: 'var(--primary-50)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--primary-500)'
                            }}>
                              <Building2 size={20} />
                            </div>
                            <div>
                              <p style={{ 
                                fontSize: '14px', 
                                fontWeight: '600', 
                                color: 'var(--text-primary)',
                                margin: '0 0 4px 0'
                              }}>
                                {branch.name}
                              </p>
                              <p style={{ 
                                fontSize: '12px', 
                                color: 'var(--text-secondary)',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Phone size={12} />
                                {branch.phone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-primary)',
                            margin: '0 0 4px 0'
                          }}>
                            {branch.address}
                          </p>
                          <p style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)',
                            margin: 0
                          }}>
                            {branch.district}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: 'var(--text-primary)',
                            margin: '0 0 4px 0'
                          }}>
                            {branch.staffCount} staff
                          </p>
                          <p style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)',
                            margin: 0
                          }}>
                            {branch.manager}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: 'var(--text-primary)',
                            margin: '0 0 4px 0'
                          }}>
                            {branch.revenue.toLocaleString()} VND
                          </p>
                          <p style={{ 
                            fontSize: '12px', 
                            color: branch.revenueChange >= 0 ? 'var(--success-600)' : 'var(--error-600)',
                            margin: 0
                          }}>
                            {branch.revenueChange >= 0 ? '+' : ''}{branch.revenueChange}%
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: 
                              branch.status === 'active' ? 'var(--success-50)' :
                              branch.status === 'maintenance' ? 'var(--warning-50)' :
                              'var(--error-50)',
                            color: 
                              branch.status === 'active' ? 'var(--success-700)' :
                              branch.status === 'maintenance' ? 'var(--warning-700)' :
                              'var(--error-700)'
                          }}>
                            {branch.status === 'active' ? 'Active' :
                             branch.status === 'maintenance' ? 'Maintenance' : 'Closed'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button style={{
                              padding: '6px',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '6px',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)'
                            }}>
                              <Eye size={16} />
                            </button>
                            <button style={{
                              padding: '6px',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '6px',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)'
                            }}>
                              <Edit size={16} />
                            </button>
                            <button style={{
                              padding: '6px',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '6px',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--error-500)'
                            }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Branch Performance */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 20px 0'
                }}>
                  Branch Performance
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={branchPerformanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      tickFormatter={(value) => `${value}M`}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value) => [`${value}M VND`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="var(--primary-500)" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 20px 0'
                }}>
                  Branch Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={branchDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {branchDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value, name) => [`${value} branches`, name]}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      case 'staff':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Staff Management
              </h2>
              <button style={{
                padding: '10px 20px',
                background: 'var(--primary-500)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Plus size={16} />
                Add Staff
              </button>
            </div>

            {/* Staff Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              {staffStats.map((stat, index) => (
                <div 
                  key={index}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: stat.color,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <h3 style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-secondary)',
                        margin: '0 0 4px 0',
                        fontWeight: '500'
                      }}>
                        {stat.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '24px', 
                          fontWeight: '700', 
                          color: 'var(--text-primary)'
                        }}>
                          {stat.value}
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)'
                        }}>
                          {stat.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Staff Table */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)',
              overflow: 'hidden',
              marginBottom: '32px'
            }}>
              <div style={{ 
                padding: '20px 24px', 
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Staff List
                </h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <Filter size={16} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Filter</span>
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <Download size={16} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Export</span>
                  </div>
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Staff</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Position</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Branch</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Performance</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.map((staff, index) => (
                      <tr key={staff.id} style={{ borderBottom: index < staffData.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              background: 'var(--primary-50)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--primary-500)',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}>
                              {staff.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p style={{ 
                                fontSize: '14px', 
                                fontWeight: '600', 
                                color: 'var(--text-primary)',
                                margin: '0 0 4px 0'
                              }}>
                                {staff.name}
                              </p>
                              <p style={{ 
                                fontSize: '12px', 
                                color: 'var(--text-secondary)',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Mail size={12} />
                                {staff.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-primary)',
                            margin: '0 0 4px 0'
                          }}>
                            {staff.position}
                          </p>
                          <p style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)',
                            margin: 0
                          }}>
                            Experience: {staff.experience}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-primary)',
                            margin: '0 0 4px 0'
                          }}>
                            {staff.branch}
                          </p>
                          <p style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)',
                            margin: 0
                          }}>
                            {staff.shift}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '60px',
                              height: '6px',
                              background: 'var(--border-primary)',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${staff.performance}%`,
                                height: '100%',
                                background: staff.performance >= 80 ? 'var(--success-500)' : 
                                          staff.performance >= 60 ? 'var(--warning-500)' : 'var(--error-500)'
                              }} />
                            </div>
                            <span style={{ 
                              fontSize: '14px', 
                              fontWeight: '600',
                              color: staff.performance >= 80 ? 'var(--success-600)' : 
                                    staff.performance >= 60 ? 'var(--warning-600)' : 'var(--error-600)'
                            }}>
                              {staff.performance}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: staff.status === 'active' ? 'var(--success-50)' : 'var(--error-50)',
                            color: staff.status === 'active' ? 'var(--success-700)' : 'var(--error-700)'
                          }}>
                            {staff.status === 'active' ? 'Working' : 'On Leave'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button style={{
                              padding: '6px',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '6px',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)'
                            }}>
                              <Eye size={16} />
                            </button>
                            <button style={{
                              padding: '6px',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '6px',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)'
                            }}>
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff Performance Charts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 20px 0'
                }}>
                  Performance by Position
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={staffPerformanceByPosition}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis 
                      dataKey="position" 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value) => [`${value}%`, 'Performance']}
                    />
                    <Bar dataKey="performance" fill="var(--primary-500)" name="Performance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 20px 0'
                }}>
                  Staff Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={staffDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {staffDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value, name) => [`${value} staff`, name]}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      case 'reports':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Branch Reports
              </h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <select style={{
                  padding: '10px 16px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  <option>This Month</option>
                  <option>This Quarter</option>
                  <option>This Year</option>
                </select>
                <button style={{
                  padding: '10px 20px',
                  background: 'var(--primary-500)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Download size={16} />
                  Export Report
                </button>
              </div>
            </div>

            {/* Report Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              {reportStats.map((stat, index) => (
                <div 
                  key={index}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: stat.color,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <h3 style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-secondary)',
                        margin: '0 0 4px 0',
                        fontWeight: '500'
                      }}>
                        {stat.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '24px', 
                          fontWeight: '700', 
                          color: 'var(--text-primary)'
                        }}>
                          {stat.value}
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)'
                        }}>
                          {stat.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: stat.changeType === 'positive' ? 'var(--success-50)' : 'var(--error-50)',
                    color: stat.changeType === 'positive' ? 'var(--success-700)' : 'var(--error-700)',
                    fontSize: '12px',
                    fontWeight: '600',
                    width: 'fit-content'
                  }}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 20px 0'
                }}>
                  Monthly Revenue
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueReportData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      tickFormatter={(value) => `${value}M`}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value) => [`${value}M VND`, 'Revenue']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="var(--primary-500)" 
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="var(--success-500)" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 20px 0'
                }}>
                  Service Categories
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={serviceCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {serviceCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value, name) => [`${value}%`, name]}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Reports */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '20px 24px', 
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Recent Reports
                </h3>
                <button style={{
                  padding: '8px 16px',
                  background: 'var(--primary-500)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Create New Report
                </button>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Report ID</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Report Type</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Branch</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Time</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsData.map((report, index) => (
                      <tr key={report.id} style={{ borderBottom: index < reportsData.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: 'var(--text-primary)',
                            margin: 0
                          }}>
                            {report.id}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-primary)',
                            margin: '0 0 4px 0'
                          }}>
                            {report.type}
                          </p>
                          <p style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)',
                            margin: 0
                          }}>
                            {report.period}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-primary)',
                            margin: 0
                          }}>
                            {report.branch}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-primary)',
                            margin: '0 0 4px 0'
                          }}>
                            {report.date}
                          </p>
                          <p style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)',
                            margin: 0
                          }}>
                            {report.time}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: report.status === 'completed' ? 'var(--success-50)' : 'var(--warning-50)',
                            color: report.status === 'completed' ? 'var(--success-700)' : 'var(--warning-700)'
                          }}>
                            {report.status === 'completed' ? 'Completed' : 'Processing'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button style={{
                              padding: '6px 12px',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '6px',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Eye size={14} />
                              View
                            </button>
                            <button style={{
                              padding: '6px 12px',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '6px',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Download size={14} />
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      case 'inventory':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Inventory Management
              </h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{
                  padding: '10px 20px',
                  border: '1px solid var(--border-primary)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Truck size={16} />
                  Import
                </button>
                <button style={{
                  padding: '10px 20px',
                  background: 'var(--primary-500)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Plus size={16} />
                  Add Product
                </button>
              </div>
            </div>

            {/* Inventory Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              {inventoryStats.map((stat, index) => (
                <div 
                  key={index}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: stat.color,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <h3 style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-secondary)',
                        margin: '0 0 4px 0',
                        fontWeight: '500'
                      }}>
                        {stat.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '24px', 
                          fontWeight: '700', 
                          color: 'var(--text-primary)'
                        }}>
                          {stat.value}
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)'
                        }}>
                          {stat.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Low Stock Alert */}
            <div style={{
              background: 'var(--warning-50)',
              border: '1px solid var(--warning-200)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertTriangle size={20} color="var(--warning-600)" />
              <div>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--warning-700)',
                  margin: '0 0 4px 0'
                }}>
                  Low Stock Alert
                </p>
                <p style={{ 
                  fontSize: '13px', 
                  color: 'var(--warning-600)',
                  margin: 0
                }}>
                  {lowStockItems.length} products are running low and need to be restocked
                </p>
              </div>
            </div>

            {/* Inventory Table */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)',
              overflow: 'hidden',
              marginBottom: '32px'
            }}>
              <div style={{ 
                padding: '20px 24px', 
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Product List
                </h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <Filter size={16} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Filter</span>
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <Download size={16} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Export</span>
                  </div>
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Product</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>SKU</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Stock</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Cost</th>
                      <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryData.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: index < inventoryData.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              background: 'var(--primary-50)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--primary-500)'
                            }}>
                              <Package size={20} />
                            </div>
                            <div>
                              <p style={{ 
                                fontSize: '14px', 
                                fontWeight: '600', 
                                color: 'var(--text-primary)',
                                margin: '0 0 4px 0'
                              }}>
                                {item.name}
                              </p>
                              <p style={{ 
                                fontSize: '12px', 
                                color: 'var(--text-secondary)',
                                margin: 0
                              }}>
                                {item.supplier}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-primary)',
                            margin: 0
                          }}>
                            {item.sku}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-primary)',
                            margin: 0
                          }}>
                            {item.category}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div>
                            <p style={{ 
                              fontSize: '14px', 
                              fontWeight: '600', 
                              color: 'var(--text-primary)',
                              margin: '0 0 4px 0'
                            }}>
                              {item.stock} {item.unit}
                            </p>
                            <div style={{
                              width: '80px',
                              height: '6px',
                              background: 'var(--border-primary)',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${(item.stock / item.maxStock) * 100}%`,
                                height: '100%',
                                background: item.stock < item.minStock ? 'var(--error-500)' : 
                                          item.stock < item.maxStock * 0.3 ? 'var(--warning-500)' : 'var(--success-500)'
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: 'var(--text-primary)',
                            margin: 0
                          }}>
                            {item.cost.toLocaleString()} VND
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: item.stock === 0 ? 'var(--error-50)' :
                                      item.stock < item.minStock ? 'var(--warning-50)' : 'var(--success-50)',
                            color: item.stock === 0 ? 'var(--error-700)' :
                                  item.stock < item.minStock ? 'var(--warning-700)' : 'var(--success-700)'
                          }}>
                            {item.stock === 0 ? 'Out of Stock' :
                             item.stock < item.minStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button style={{
                              padding: '6px',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '6px',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)'
                            }}>
                              <Edit size={16} />
                            </button>
                            <button style={{
                              padding: '6px',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '6px',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--error-500)'
                            }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Charts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 20px 0'
                }}>
                  Stock by Category
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis 
                      dataKey="category" 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <Bar dataKey="value" fill="var(--primary-500)" name="Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 20px 0'
                }}>
                  Inventory Value
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={inventoryValueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {inventoryValueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value, name) => [`${value.toLocaleString()} VND`, name]}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      case 'services':
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Service Management
            </h2>
            
            {/* Service Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              {serviceStats.map((stat, index) => (
                <div 
                  key={index}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: stat.color,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <stat.icon size={24} />
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '20px',
                      background: stat.changeType === 'positive' ? 'var(--success-50)' : 'var(--error-50)',
                      color: stat.changeType === 'positive' ? 'var(--success-700)' : 'var(--error-700)',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {stat.change}
                    </div>
                  </div>
                  <h3 style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-secondary)',
                    margin: '0 0 8px 0',
                    fontWeight: '500'
                  }}>
                    {stat.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: 'var(--text-primary)'
                    }}>
                      {stat.value}
                    </span>
                    <span style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-secondary)'
                    }}>
                      {stat.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Service Management Content */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '32px'
            }}>
              {/* Service List */}
              <div style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 20px 0'
                }}>
                  Service List
                </h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {services.map((service, index) => (
                    <div 
                      key={service.id}
                      style={{
                        padding: '16px',
                        borderBottom: index < services.length - 1 ? '1px solid var(--border-primary)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary-50)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: service.color,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        <Wrench size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          margin: '0 0 4px 0'
                        }}>
                          {service.name}
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          margin: '0 0 4px 0'
                        }}>
                          {service.description}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            color: 'var(--text-tertiary)',
                            background: 'var(--bg-secondary)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {service.duration} minutes
                          </span>
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: '600',
                            color: 'var(--success-600)'
                          }}>
                            {service.price.toLocaleString()} VND
                          </span>
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: service.status === 'active' ? 'var(--success-50)' : 'var(--error-50)',
                        color: service.status === 'active' ? 'var(--success-700)' : 'var(--error-700)',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {service.status === 'active' ? 'Active' : 'Paused'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Performance */}
              <div style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 20px 0'
                }}>
                  Service Performance
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={servicePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis 
                      dataKey="service" 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? `${value}M VND` : value,
                        name === 'revenue' ? 'Revenue' : 'Bookings'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="bookings" fill="var(--primary-500)" name="Bookings" />
                    <Bar dataKey="revenue" fill="var(--success-500)" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Service Bookings */}
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Recent Service Bookings
                </h3>
                <button style={{
                  padding: '8px 16px',
                  background: 'var(--primary-500)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  View All
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Order ID</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Service</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Customer</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Branch</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking, index) => (
                      <tr key={booking.id} style={{ borderBottom: index < recentBookings.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                        <td style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>#{booking.id}</td>
                        <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-primary)' }}>{booking.service}</td>
                        <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-primary)' }}>{booking.customer}</td>
                        <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-primary)' }}>{booking.branch}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: 
                              booking.status === 'completed' ? 'var(--success-50)' :
                              booking.status === 'in_progress' ? 'var(--warning-50)' :
                              'var(--primary-50)',
                            color: 
                              booking.status === 'completed' ? 'var(--success-700)' :
                              booking.status === 'in_progress' ? 'var(--warning-700)' :
                              'var(--primary-700)'
                          }}>
                            {booking.status === 'completed' ? 'Completed' :
                             booking.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'right' }}>
                          {booking.price.toLocaleString()} VND
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Branch Settings
            </h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Branch and system settings will be displayed here...</p>
            </div>
          </div>
        )
      default:
        return renderDashboardContent()
    }
  }

  const renderDashboardContent = () => (
    <>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          margin: '0 0 8px 0'
        }}>
          Manager Dashboard
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: 'var(--text-secondary)',
          margin: '0'
        }}>
          Manage branches and business performance
        </p>
      </div>

      {/* Stats Grid */}
      <div 
        className="manager-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
          width: '100%'
        }}
      >
        {stats.map((stat, index) => (
          <div 
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: stat.color,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <stat.icon size={24} />
              </div>
              <div style={{
                padding: '4px 8px',
                borderRadius: '20px',
                background: stat.changeType === 'positive' ? 'var(--success-50)' : 'var(--error-50)',
                color: stat.changeType === 'positive' ? 'var(--success-700)' : 'var(--error-700)',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {stat.change}
              </div>
            </div>
            <h3 style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              margin: '0 0 8px 0',
              fontWeight: '500'
            }}>
              {stat.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: 'var(--text-primary)'
              }}>
                {stat.value}
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: 'var(--text-secondary)'
              }}>
                {stat.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ marginBottom: '32px', width: '100%' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: '0 0 24px 0'
        }}>
          Branch Statistics Charts
        </h2>
        
        {/* Revenue Chart */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Monthly Revenue
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                fontSize={12}
                tickFormatter={(value) => `${value}M`}
              />
              <Tooltip 
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                formatter={(value, name) => [
                  `${value}M VND`,
                  name === 'revenue' ? 'Revenue' : 'Profit'
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary-500)"
                fill="var(--primary-50)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="var(--success-500)"
                fill="var(--success-50)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Branch Performance Pie Chart */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: '0 0 20px 0'
            }}>
              Branch Performance
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={branchPerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {branchPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value) => [`${value}%`, 'Rate']}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Staff Performance Chart */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: '0 0 20px 0'
            }}>
              Staff Performance
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={staffPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis 
                  dataKey="staff" 
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend />
                <Bar dataKey="tasks" fill="var(--primary-500)" name="Tasks" />
                <Bar dataKey="completed" fill="var(--success-500)" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', width: '100%' }}>
        {/* Quick Actions */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Management Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={() => setActivePage(action.page)}
                style={{
                  background: 'var(--bg-card)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: action.color,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0
                }}>
                  <action.icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    margin: '0 0 4px 0'
                  }}>
                    {action.title}
                  </h3>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    margin: '0'
                  }}>
                    {action.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Status */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Branch Status
          </h2>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            overflow: 'hidden'
          }}>
            {branchStatus.map((branch, index) => (
              <div 
                key={branch.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < branchStatus.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: branch.status === 'active' ? 'var(--success-500)' : 
                             branch.status === 'maintenance' ? 'var(--warning-500)' : 'var(--error-500)',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: 'var(--text-primary)',
                    margin: '0 0 2px 0'
                  }}>
                    {branch.name}
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    margin: '0'
                  }}>
                    {branch.location} • {branch.staff} staff
                  </p>
                </div>
                <span style={{ 
                  fontSize: '11px', 
                  color: branch.status === 'active' ? 'var(--success-700)' : 
                         branch.status === 'maintenance' ? 'var(--warning-700)' : 'var(--error-700)',
                  whiteSpace: 'nowrap',
                  fontWeight: '500'
                }}>
                  {branch.status === 'active' ? 'Active' : 
                   branch.status === 'maintenance' ? 'Maintenance' : 'Closed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  // Data for branches page
  const branchStats = [
    {
      title: 'Total Branches',
      value: '8',
      unit: 'branches',
      icon: Building2,
      color: 'var(--primary-500)'
    },
    {
      title: 'Active',
      value: '7',
      unit: 'branches',
      icon: CheckCircle,
      color: 'var(--success-500)'
    },
    {
      title: 'Avg Revenue',
      value: '45.2',
      unit: 'M VND',
      icon: DollarSign,
      color: 'var(--info-500)'
    },
    {
      title: 'Staff',
      value: '64',
      unit: 'people',
      icon: Users,
      color: 'var(--warning-500)'
    }
  ]

  const branchesData = [
    {
      id: 1,
      name: 'District 1 Branch',
      address: '123 Nguyen Hue',
      district: 'District 1, HCMC',
      phone: '028 3823 4567',
      staffCount: 12,
      manager: 'Nguyen Van A',
      revenue: 125000000,
      revenueChange: 15,
      status: 'active'
    },
    {
      id: 2,
      name: 'District 3 Branch',
      address: '456 Le Van Sy',
      district: 'District 3, HCMC',
      phone: '028 3823 4568',
      staffCount: 10,
      manager: 'Tran Thi B',
      revenue: 98000000,
      revenueChange: 8,
      status: 'active'
    },
    {
      id: 3,
      name: 'District 7 Branch',
      address: '789 Nguyen Thi Thap',
      district: 'District 7, HCMC',
      phone: '028 3823 4569',
      staffCount: 8,
      manager: 'Le Van C',
      revenue: 75000000,
      revenueChange: -5,
      status: 'maintenance'
    },
    {
      id: 4,
      name: 'District 10 Branch',
      address: '321 Cach Mang Thang 8',
      district: 'District 10, HCMC',
      phone: '028 3823 4570',
      staffCount: 9,
      manager: 'Pham Thi D',
      revenue: 89000000,
      revenueChange: 12,
      status: 'active'
    }
  ]

  const branchPerformanceChartData = [
    { name: 'D1', revenue: 45 },
    { name: 'D3', revenue: 38 },
    { name: 'D7', revenue: 28 },
    { name: 'D10', revenue: 42 },
    { name: 'Tan Binh', revenue: 35 },
    { name: 'Go Vap', revenue: 39 }
  ]

  const branchDistributionData = [
    { name: 'District 1', value: 2, color: 'var(--primary-500)' },
    { name: 'District 3', value: 1, color: 'var(--success-500)' },
    { name: 'District 7', value: 1, color: 'var(--warning-500)' },
    { name: 'District 10', value: 1, color: 'var(--info-500)' },
    { name: 'Tan Binh', value: 1, color: 'var(--error-500)' },
    { name: 'Go Vap', value: 1, color: 'var(--purple-500)' }
  ]

  // Data for staff page
  const staffStats = [
    {
      title: 'Total Staff',
      value: '64',
      unit: 'people',
      icon: Users,
      color: 'var(--primary-500)'
    },
    {
      title: 'Working',
      value: '58',
      unit: 'people',
      icon: CheckCircle,
      color: 'var(--success-500)'
    },
    {
      title: 'Technicians',
      value: '32',
      unit: 'people',
      icon: Wrench,
      color: 'var(--info-500)'
    },
    {
      title: 'Avg Performance',
      value: '87.5',
      unit: '%',
      icon: TrendingUp,
      color: 'var(--warning-500)'
    }
  ]

  const staffData = [
    {
      id: 1,
      name: 'Nguyen Van A',
      email: 'nguyenvana@company.com',
      position: 'Technician',
      experience: '3 years',
      branch: 'District 1',
      shift: 'Morning Shift (8AM-5PM)',
      performance: 92,
      status: 'active'
    },
    {
      id: 2,
      name: 'Tran Thi B',
      email: 'tranthib@company.com',
      position: 'Consultant',
      experience: '2 years',
      branch: 'District 3',
      shift: 'Morning Shift (8AM-5PM)',
      performance: 88,
      status: 'active'
    },
    {
      id: 3,
      name: 'Le Van C',
      email: 'levanc@company.com',
      position: 'Manager',
      experience: '5 years',
      branch: 'District 7',
      shift: 'Office Hours',
      performance: 95,
      status: 'active'
    },
    {
      id: 4,
      name: 'Pham Thi D',
      email: 'phamthid@company.com',
      position: 'Technician',
      experience: '4 years',
      branch: 'District 10',
      shift: 'Afternoon Shift (12PM-9PM)',
      performance: 85,
      status: 'leave'
    }
  ]

  const staffPerformanceByPosition = [
    { position: 'Technician', performance: 89 },
    { position: 'Consultant', performance: 85 },
    { position: 'Manager', performance: 92 },
    { position: 'Receptionist', performance: 82 },
    { position: 'Security', performance: 88 }
  ]

  const staffDistributionData = [
    { name: 'Technicians', value: 32, color: 'var(--primary-500)' },
    { name: 'Consultants', value: 16, color: 'var(--success-500)' },
    { name: 'Managers', value: 8, color: 'var(--warning-500)' },
    { name: 'Receptionists', value: 4, color: 'var(--info-500)' },
    { name: 'Security', value: 4, color: 'var(--error-500)' }
  ]

  // Data for reports page
  const reportStats = [
    {
      title: 'Monthly Revenue',
      value: '245.6',
      unit: 'M VND',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'var(--primary-500)'
    },
    {
      title: 'Orders',
      value: '1,245',
      unit: 'orders',
      change: '+8.2%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'var(--success-500)'
    },
    {
      title: 'New Customers',
      value: '156',
      unit: 'people',
      change: '+15.3%',
      changeType: 'positive',
      icon: Users,
      color: 'var(--info-500)'
    },
    {
      title: 'Completion Rate',
      value: '94.8',
      unit: '%',
      change: '+2.1%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'var(--warning-500)'
    }
  ]

  const revenueReportData = [
    { month: 'Jan', revenue: 45, target: 40 },
    { month: 'Feb', revenue: 52, target: 45 },
    { month: 'Mar', revenue: 48, target: 50 },
    { month: 'Apr', revenue: 61, target: 55 },
    { month: 'May', revenue: 55, target: 60 },
    { month: 'Jun', revenue: 67, target: 65 }
  ]

  const serviceCategoryData = [
    { name: 'Maintenance', value: 35, color: 'var(--primary-500)' },
    { name: 'Repair', value: 28, color: 'var(--success-500)' },
    { name: 'Replacement', value: 22, color: 'var(--warning-500)' },
    { name: 'Inspection', value: 15, color: 'var(--info-500)' }
  ]

  const reportsData = [
    {
      id: 'RPT-2024-001',
      type: 'Revenue Report',
      period: 'June 2024',
      branch: 'All Branches',
      date: '07/01/2024',
      time: '08:30',
      status: 'completed'
    },
    {
      id: 'RPT-2024-002',
      type: 'Staff Report',
      period: 'Q2 2024',
      branch: 'All Branches',
      date: '07/05/2024',
      time: '10:15',
      status: 'completed'
    },
    {
      id: 'RPT-2024-003',
      type: 'Inventory Report',
      period: 'June 2024',
      branch: 'Central Warehouse',
      date: '07/03/2024',
      time: '14:20',
      status: 'processing'
    }
  ]

  // Data for inventory page
  const inventoryStats = [
    {
      title: 'Total Products',
      value: '156',
      unit: 'products',
      icon: Package,
      color: 'var(--primary-500)'
    },
    {
      title: 'Inventory Value',
      value: '245.8',
      unit: 'M VND',
      icon: DollarSign,
      color: 'var(--success-500)'
    },
    {
      title: 'Low Stock',
      value: '12',
      unit: 'products',
      icon: AlertTriangle,
      color: 'var(--warning-500)'
    },
    {
      title: 'Out of Stock',
      value: '3',
      unit: 'products',
      icon: AlertCircle,
      color: 'var(--error-500)'
    }
  ]

  const lowStockItems = [
    { id: 1, name: 'Oil Filter OE 123', current: 2, min: 5 },
    { id: 2, name: 'Spark Plug', current: 3, min: 10 },
    { id: 3, name: 'Brake Fluid DOT4', current: 1, min: 5 }
  ]

  const inventoryData = [
    {
      id: 1,
      name: 'Oil Filter OE 123',
      sku: 'OF-OE123',
      category: 'Oil Filters',
      supplier: 'Company A',
      stock: 45,
      minStock: 10,
      maxStock: 100,
      unit: 'pcs',
      cost: 85000
    },
    {
      id: 2,
      name: 'Engine Oil 5W-30',
      sku: 'EO-5W30',
      category: 'Engine Oil',
      supplier: 'Company B',
      stock: 28,
      minStock: 20,
      maxStock: 200,
      unit: 'liters',
      cost: 120000
    },
    {
      id: 3,
      name: 'Spark Plug',
      sku: 'SP-001',
      category: 'Spark Plugs',
      supplier: 'Company C',
      stock: 3,
      minStock: 10,
      maxStock: 50,
      unit: 'pcs',
      cost: 45000
    },
    {
      id: 4,
      name: 'Brake Fluid DOT4',
      sku: 'BF-DOT4',
      category: 'Brake Fluid',
      supplier: 'Company D',
      stock: 1,
      minStock: 5,
      maxStock: 30,
      unit: 'bottles',
      cost: 95000
    },
    {
      id: 5,
      name: 'Tire 185/65R15',
      sku: 'TR-18565R15',
      category: 'Tires',
      supplier: 'Company E',
      stock: 15,
      minStock: 8,
      maxStock: 40,
      unit: 'pcs',
      cost: 1200000
    }
  ]

  const inventoryByCategory = [
    { category: 'Oil Filters', value: 45 },
    { category: 'Engine Oil', value: 28 },
    { category: 'Spark Plugs', value: 3 },
    { category: 'Brake Fluid', value: 1 },
    { category: 'Tires', value: 15 },
    { category: 'Spare Parts', value: 64 }
  ]

  const inventoryValueData = [
    { name: 'Tires', value: 18000000, color: 'var(--primary-500)' },
    { name: 'Engine Oil', value: 3360000, color: 'var(--success-500)' },
    { name: 'Oil Filters', value: 3825000, color: 'var(--warning-500)' },
    { name: 'Spare Parts', value: 7680000, color: 'var(--info-500)' },
    { name: 'Spark Plugs & Brake Fluid', value: 180000, color: 'var(--error-500)' }
  ]

  // Chart data
  const revenueData = [
    { month: 'Jan', revenue: 45, profit: 12 },
    { month: 'Feb', revenue: 52, profit: 15 },
    { month: 'Mar', revenue: 48, profit: 13 },
    { month: 'Apr', revenue: 61, profit: 18 },
    { month: 'May', revenue: 55, profit: 16 },
    { month: 'Jun', revenue: 67, profit: 22 }
  ]

  const branchPerformanceData = [
    { name: 'Branch 1', value: 35, color: 'var(--primary-500)' },
    { name: 'Branch 2', value: 28, color: 'var(--success-500)' },
    { name: 'Branch 3', value: 22, color: 'var(--warning-500)' },
    { name: 'Branch 4', value: 15, color: 'var(--info-500)' }
  ]

  const staffPerformanceData = [
    { staff: 'Nguyen A', tasks: 25, completed: 23 },
    { staff: 'Tran B', tasks: 30, completed: 28 },
    { staff: 'Le C', tasks: 22, completed: 20 },
    { staff: 'Pham D', tasks: 28, completed: 26 }
  ]

  // Service data
  const servicePerformanceData = [
    { service: 'Maintenance', bookings: 45, revenue: 12 },
    { service: 'Repair', bookings: 38, revenue: 18 },
    { service: 'Tires', bookings: 28, revenue: 8 },
    { service: 'Electrical', bookings: 22, revenue: 6 },
    { service: 'Brakes', bookings: 35, revenue: 10 }
  ]

  // Mock data for dashboard stats
  const stats = [
    {
      title: 'This Month Revenue',
      value: '67.2',
      unit: 'M VND',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'var(--success-500)'
    },
    {
      title: 'Active Branches',
      value: '4',
      unit: 'branches',
      change: '+1',
      changeType: 'positive',
      icon: Building2,
      color: 'var(--primary-500)'
    },
    {
      title: 'Staff',
      value: '28',
      unit: 'people',
      change: '+3',
      changeType: 'positive',
      icon: Users,
      color: 'var(--info-500)'
    },
    {
      title: 'Average Performance',
      value: '94.2',
      unit: '%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'var(--warning-500)'
    }
  ]

  const serviceStats = [
    {
      title: 'Total Services',
      value: '15',
      unit: 'services',
      change: '+2',
      changeType: 'positive',
      icon: Wrench,
      color: 'var(--primary-500)'
    },
    {
      title: 'Service Bookings',
      value: '168',
      unit: 'bookings',
      change: '+24',
      changeType: 'positive',
      icon: ClipboardList,
      color: 'var(--success-500)'
    },
    {
      title: 'Service Revenue',
      value: '42.5',
      unit: 'M VND',
      change: '+8.2%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'var(--info-500)'
    },
    {
      title: 'Completion Rate',
      value: '96.8',
      unit: '%',
      change: '+1.5%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'var(--warning-500)'
    }
  ]

  const services = [
    {
      id: 1,
      name: 'Regular Maintenance',
      description: 'Comprehensive periodic maintenance',
      duration: 60,
      price: 500000,
      status: 'active',
      color: 'var(--primary-500)'
    },
    {
      id: 2,
      name: 'Engine Oil Change',
      description: 'Oil and filter change',
      duration: 30,
      price: 350000,
      status: 'active',
      color: 'var(--success-500)'
    },
    {
      id: 3,
      name: 'Tire Replacement',
      description: 'New tire installation and balancing',
      duration: 45,
      price: 1200000,
      status: 'active',
      color: 'var(--info-500)'
    },
    {
      id: 4,
      name: 'Brake Repair',
      description: 'Brake inspection and pad replacement',
      duration: 90,
      price: 800000,
      status: 'active',
      color: 'var(--warning-500)'
    },
    {
      id: 5,
      name: 'Electrical System Repair',
      description: 'Electrical and battery repair',
      duration: 120,
      price: 1500000,
      status: 'inactive',
      color: 'var(--error-500)'
    }
  ]

  const recentBookings = [
    {
      id: 'SV001',
      service: 'Regular Maintenance',
      customer: 'Nguyen Van A',
      branch: 'District 1',
      status: 'completed',
      price: 500000
    },
    {
      id: 'SV002',
      service: 'Engine Oil Change',
      customer: 'Tran Thi B',
      branch: 'District 3',
      status: 'in_progress',
      price: 350000
    },
    {
      id: 'SV003',
      service: 'Tire Replacement',
      customer: 'Le Van C',
      branch: 'District 7',
      status: 'scheduled',
      price: 1200000
    },
    {
      id: 'SV004',
      service: 'Brake Repair',
      customer: 'Pham Thi D',
      branch: 'District 10',
      status: 'completed',
      price: 800000
    },
    {
      id: 'SV005',
      service: 'Regular Maintenance',
      customer: 'Hoang Van E',
      branch: 'District 1',
      status: 'scheduled',
      price: 500000
    }
  ]

  const quickActions = [
    {
      title: 'Branch Management',
      description: 'View and manage branches',
      icon: Building2,
      page: 'branches',
      color: 'var(--primary-500)'
    },
    {
      title: 'Staff Management',
      description: 'Assign and manage staff',
      icon: Users,
      page: 'staff',
      color: 'var(--success-500)'
    },
    {
      title: 'Service Management',
      description: 'Manage service categories',
      icon: Wrench,
      page: 'services',
      color: 'var(--info-500)'
    },
    {
      title: 'Branch Reports',
      description: 'View revenue and performance reports',
      icon: FileText,
      page: 'reports',
      color: 'var(--warning-500)'
    },
    {
      title: 'Inventory Management',
      description: 'Track inventory and spare parts',
      icon: Target,
      page: 'inventory',
      color: 'var(--error-500)'
    },
    {
      title: 'Settings',
      description: 'Branch and system settings',
      icon: Settings,
      page: 'settings',
      color: 'var(--text-secondary)'
    }
  ]

  const branchStatus = [
    {
      id: 1,
      name: 'District 1 Branch',
      location: '123 Nguyen Hue, D1',
      staff: 8,
      status: 'active'
    },
    {
      id: 2,
      name: 'District 3 Branch',
      location: '456 Le Van Sy, D3',
      staff: 6,
      status: 'active'
    },
    {
      id: 3,
      name: 'District 7 Branch',
      location: '789 Nguyen Thi Thap, D7',
      staff: 7,
      status: 'maintenance'
    },
    {
      id: 4,
      name: 'District 10 Branch',
      location: '321 Cach Mang Thang 8, D10',
      staff: 5,
      status: 'active'
    }
  ]

  return (
    <div className="manager-dashboard" style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Manager Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: sidebarCollapsed ? '80px' : '280px',
        right: 0,
        height: '64px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 1003,
        transition: 'left 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              color: 'var(--text-primary)'
            }}
            className="mobile-menu-btn"
          >
            <Menu size={20} />
          </button>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Manager Panel
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Bell size={20} style={{ color: 'var(--text-tertiary)' }} />
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '8px',
              height: '8px',
              background: 'var(--error-500)',
              borderRadius: '50%'
            }} />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--primary-50)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--primary-500)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              M
            </div>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text-primary)'
            }}>
              Manager User
            </span>
            <LogOut size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div 
        className={`manager-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{
          width: sidebarCollapsed ? '80px' : '280px',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-primary)',
          transition: 'width 0.3s ease',
          position: 'fixed',
          height: '100vh',
          zIndex: 1004,
          top: 0
        }}
      >
        <div style={{ padding: '24px' }}>
          {/* Logo */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '32px',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'var(--primary-500)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              marginRight: sidebarCollapsed ? '0' : '12px'
            }}>
              M
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Manager Panel
                </h1>
                <p style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  margin: '0'
                }}>
                  Branch and business management
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 12px 0',
                display: sidebarCollapsed ? 'none' : 'block'
              }}>
                Overview
              </h3>
              <div 
                onClick={() => setActivePage('dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: activePage === 'dashboard' ? 'var(--primary-500)' : 'var(--text-secondary)',
                  background: activePage === 'dashboard' ? 'var(--primary-50)' : 'transparent',
                  fontWeight: '500',
                  marginBottom: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activePage !== 'dashboard') {
                    e.currentTarget.style.background = 'var(--primary-50)'
                    e.currentTarget.style.color = 'var(--primary-500)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activePage !== 'dashboard') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <BarChart3 size={20} style={{ marginRight: sidebarCollapsed ? '0' : '12px' }} />
                {!sidebarCollapsed && 'Dashboard'}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 12px 0',
                display: sidebarCollapsed ? 'none' : 'block'
              }}>
                Management
              </h3>
              {[
                { icon: Building2, label: 'Branches', page: 'branches' },
                { icon: Users, label: 'Staff', page: 'staff' },
                { icon: Wrench, label: 'Services', page: 'services' },
                { icon: FileText, label: 'Reports', page: 'reports' },
                { icon: Target, label: 'Inventory', page: 'inventory' },
                { icon: Settings, label: 'Settings', page: 'settings' }
              ].map((item, index) => (
                <div 
                  key={index}
                  onClick={() => setActivePage(item.page)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: activePage === item.page ? 'var(--primary-500)' : 'var(--text-secondary)',
                    background: activePage === item.page ? 'var(--primary-50)' : 'transparent',
                    transition: 'all 0.2s ease',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (activePage !== item.page) {
                      e.currentTarget.style.background = 'var(--primary-50)'
                      e.currentTarget.style.color = 'var(--primary-500)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activePage !== item.page) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <item.icon size={20} style={{ marginRight: sidebarCollapsed ? '0' : '12px' }} />
                  {!sidebarCollapsed && item.label}
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: 'absolute',
            top: '24px',
            right: '-12px',
            width: '24px',
            height: '24px',
            background: 'var(--primary-500)',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Main Content */}
      <div 
        className="manager-main-content"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          padding: '32px',
          paddingTop: '96px', // Add space for header
          background: 'var(--bg-secondary)',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)',
          maxWidth: 'none'
        }}
      >
        {renderPageContent()}
      </div>
    </div>
  )
}
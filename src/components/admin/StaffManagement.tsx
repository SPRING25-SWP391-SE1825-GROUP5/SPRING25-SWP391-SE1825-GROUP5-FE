import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Users,
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    UserCheck,
    Wrench,
    Building2,
    ChevronDown,
    X,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Activity,
    Mail,
    Smartphone,
    Clock,
    MoreVertical,
    TrendingUp,
    UserPlus,
    Settings,
    BarChart3
} from 'lucide-react'
import { StaffService } from '@/services/staffService'
import { CenterService } from '@/services/centerService'
import { UserService } from '@/services/userService'
import type {
    Staff,
    Technician,
    StaffFilters,
    TechnicianFilters,
    StaffFormData,
    TechnicianFormData
} from '@/types/staff'
import type { Center } from '@/services/centerService'

interface StaffManagementProps {
    className?: string
}

export default function StaffManagement({ className = '' }: StaffManagementProps) {
    const [activeTab, setActiveTab] = useState<'staff' | 'technician'>('staff')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [isValidating, setIsValidating] = useState(false)

    const [staff, setStaff] = useState<Staff[]>([])
    const [technicians, setTechnicians] = useState<Technician[]>([])
    const [centers, setCenters] = useState<Center[]>([])
    const [users, setUsers] = useState<any[]>([])

    const [staffPagination, setStaffPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0
    })
    const [technicianPagination, setTechnicianPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0
    })

    const [staffFilters, setStaffFilters] = useState<StaffFilters>({
        searchTerm: '',
        centerId: null,
        isActive: null,
        position: null
    })
    const [technicianFilters, setTechnicianFilters] = useState<TechnicianFilters>({
        searchTerm: '',
        centerId: null,
        isActive: null,
        specialization: null
    })

    const [showStaffModal, setShowStaffModal] = useState(false)
    const [showTechnicianModal, setShowTechnicianModal] = useState(false)

    // Sửa: Dùng string thay vì number để tránh conflict với giá trị 0
    const [staffForm, setStaffForm] = useState({
        userId: '',
        centerId: ''
    })
    const [technicianForm, setTechnicianForm] = useState({
        userId: '',
        centerId: '',
        position: 'GENERAL'
    })

    const [stats, setStats] = useState({
        totalStaff: 0,
        activeStaff: 0,
        inactiveStaff: 0,
        totalTechnicians: 0,
        activeTechnicians: 0,
        inactiveTechnicians: 0
    })

    useEffect(() => {
        loadInitialData()
    }, [])

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (activeTab === 'staff') {
                loadStaffData()
            } else {
                loadTechnicianData()
            }
        }, 300) // 300ms debounce

        return () => clearTimeout(timeoutId)
    }, [activeTab, staffFilters.searchTerm, technicianFilters.searchTerm, staffFilters.centerId, technicianFilters.centerId, staffFilters.isActive, technicianFilters.isActive, staffPagination.pageNumber, technicianPagination.pageNumber])

    const loadInitialData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [centersData, usersData, statsData] = await Promise.all([
                CenterService.getCenters({ pageSize: 1000 }),
                UserService.getUsers({ pageSize: 1000 }),
                StaffService.getStaffStats()
            ])

            setCenters(centersData.centers)
            setUsers(usersData.data.users)
            setStats(statsData)

            console.log('Users data:', usersData.data.users)
            console.log('Centers data:', centersData.centers)

        } catch (err: any) {
            setError('Không thể tải dữ liệu: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const loadStaffData = async () => {
        try {
            setLoading(true)
            const response = await StaffService.getStaffList({
                ...staffFilters,
                pageNumber: staffPagination.pageNumber,
                pageSize: staffPagination.pageSize
            })

            setStaff(response.data.staff)
            setStaffPagination(prev => ({
                ...prev,
                totalCount: response.data.totalCount,
                totalPages: response.data.totalPages
            }))

        } catch (err: any) {
            setError('Không thể tải danh sách nhân viên: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const loadTechnicianData = async () => {
        try {
            setLoading(true)

            const response = await StaffService.getTechnicianList({
                ...technicianFilters,
                pageNumber: technicianPagination.pageNumber,
                pageSize: technicianPagination.pageSize
            })

            setTechnicians(response.data.technicians)
            setTechnicianPagination(prev => ({
                ...prev,
                totalCount: response.data.totalCount,
                totalPages: response.data.totalPages
            }))

        } catch (err: any) {
            setError('Không thể tải danh sách kỹ thuật viên: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const handleCreateStaff = async () => {
        try {
            setLoading(true)
            setError(null)
            setSuccessMessage(null)
            setIsValidating(true)

            // Validate form data - sửa điều kiện kiểm tra
            if (!staffForm.userId || !staffForm.centerId) {
                throw new Error('Vui lòng chọn người dùng và trung tâm')
            }

            // Convert string values to numbers
            const formData = {
                userId: Number(staffForm.userId),
                centerId: Number(staffForm.centerId)
            }

            console.log('Creating staff with data:', formData)
            console.log('Available users:', users)
            console.log('Available centers:', centers)

            // Create staff
            const result = await StaffService.createStaffFromUser(formData)

            // Show success message
            setSuccessMessage('Tạo nhân viên thành công!')

            // Close modal and reset form
            setShowStaffModal(false)
            setStaffForm({ userId: '', centerId: '' })

            // Reload data
            await Promise.all([loadStaffData(), loadInitialData()])

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000)

        } catch (err: any) {
            setError(err.message || 'Không thể tạo nhân viên')
        } finally {
            setLoading(false)
            setIsValidating(false)
        }
    }

    const handleCreateTechnician = async () => {
        try {
            setLoading(true)
            setError(null)
            setSuccessMessage(null)
            setIsValidating(true)

            if (!technicianForm.userId || !technicianForm.centerId) {
                throw new Error('Vui lòng chọn người dùng và trung tâm')
            }

            const formData = {
                userId: Number(technicianForm.userId),
                centerId: Number(technicianForm.centerId),
                position: technicianForm.position as 'GENERAL' | 'SENIOR' | 'LEAD'
            }

            console.log('Creating technician with data:', formData)


            const result = await StaffService.createTechnicianFromUser(formData)

            setSuccessMessage('Tạo kỹ thuật viên thành công!')


            setShowTechnicianModal(false)
            setTechnicianForm({ userId: '', centerId: '', position: 'GENERAL' })


            await Promise.all([loadTechnicianData(), loadInitialData()])


            setTimeout(() => setSuccessMessage(null), 3000)

        } catch (err: any) {
            setError(err.message || 'Không thể tạo kỹ thuật viên')
        } finally {
            setLoading(false)
            setIsValidating(false)
        }
    }

    const handleUpdateStaffStatus = async (staffId: number, isActive: boolean) => {
        try {
            setLoading(true)
            await StaffService.updateStaff(staffId, { isActive })
            await loadStaffData()
            await loadInitialData()
        } catch (err: any) {
            setError('Không thể cập nhật nhân viên: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateTechnicianStatus = async (technicianId: number, isActive: boolean) => {
        try {
            setLoading(true)
            await StaffService.updateTechnician(technicianId, { isActive })
            await loadTechnicianData()
            await loadInitialData()
        } catch (err: any) {
            setError('Không thể cập nhật kỹ thuật viên: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const StatusBadge = ({ isActive }: { isActive: boolean }) => (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            background: isActive ? 'var(--success-50)' : 'var(--error-50)',
            color: isActive ? 'var(--success-700)' : 'var(--error-700)',
            fontSize: '12px',
            fontWeight: '600',
            border: `1px solid ${isActive ? 'var(--success-200)' : 'var(--error-200)'}`
        }}>
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isActive ? 'var(--success-500)' : 'var(--error-500)',
                animation: isActive ? 'pulse 2s infinite' : 'none'
            }} />
            {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </div>
    )

    const StatsCard = ({
        title,
        value,
        icon: Icon,
        color = 'blue',
        secondaryValue,
        secondaryLabel
    }: {
        title: string
        value: number
        icon: any
         color?: 'blue' | 'green' | 'purple' | 'orange' | 'white'
        secondaryValue?: number
        secondaryLabel?: string
    }) => {
         const colorStyles = {
             blue: {
                 background: 'var(--primary-50)',
                 border: 'var(--primary-200)',
                 iconBg: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                 text: 'var(--primary-700)'
             },
             green: {
                 background: 'var(--success-50)',
                 border: 'var(--success-200)',
                 iconBg: 'linear-gradient(135deg, var(--success-500), var(--success-600))',
                 text: 'var(--success-700)'
             },
             purple: {
                 background: 'var(--purple-50)',
                 border: 'var(--purple-200)',
                 iconBg: 'linear-gradient(135deg, var(--purple-500), var(--purple-600))',
                 text: 'var(--purple-700)'
             },
             orange: {
                 background: 'var(--orange-50)',
                 border: 'var(--orange-200)',
                 iconBg: 'linear-gradient(135deg, var(--orange-500), var(--orange-600))',
                 text: 'var(--orange-700)'
             },
             white: {
                 background: 'white',
                 border: 'var(--border-primary)',
                 iconBg: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                 text: 'var(--text-primary)'
             }
         }

        const colors = colorStyles[color]

        return (
            <div style={{
                background: colors.background,
                border: `2px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '24px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: colors.text,
                            margin: '0 0 8px 0'
                        }}>
                            {title}
                        </p>
                        <p style={{
                            fontSize: '32px',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            margin: '0 0 4px 0'
                        }}>
                            {value}
                        </p>
                        {secondaryValue !== undefined && (
                            <p style={{
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                margin: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <TrendingUp size={12} />
                                {secondaryLabel}: {secondaryValue}
                            </p>
                        )}
                    </div>
                    <div style={{
                        padding: '16px',
                        borderRadius: '16px',
                        background: colors.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}>
                        <Icon size={24} style={{ color: 'white' }} />
                    </div>
                </div>
            </div>
        )
    }

    const ActionButton = ({
        onClick,
        icon: Icon,
        variant = 'default',
        disabled = false
    }: {
        onClick: () => void
        icon: any
        variant?: 'default' | 'success' | 'error' | 'warning'
        disabled?: boolean
    }) => {
        const variantStyles = {
            default: {
                color: 'var(--text-primary)',
                hoverBg: 'var(--bg-secondary)',
                hoverColor: 'var(--text-primary)'
            },
            success: {
                color: 'var(--success-600)',
                hoverBg: 'var(--success-50)',
                hoverColor: 'var(--success-700)'
            },
            error: {
                color: 'var(--error-500)',
                hoverBg: 'var(--error-50)',
                hoverColor: 'var(--error-600)'
            },
            warning: {
                color: 'var(--warning-600)',
                hoverBg: 'var(--warning-50)',
                hoverColor: 'var(--warning-700)'
            }
        }

        const styles = variantStyles[variant]

        return (
            <button
                onClick={onClick}
                disabled={disabled}
                style={{
                    padding: '8px 12px',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    color: styles.color,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.borderColor = styles.color
                        e.currentTarget.style.background = styles.hoverBg
                        e.currentTarget.style.color = styles.hoverColor
                    }
                }}
                onMouseLeave={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.borderColor = 'var(--border-primary)'
                        e.currentTarget.style.background = 'var(--bg-card)'
                        e.currentTarget.style.color = styles.color
                    }
                }}
            >
                <Icon size={14} />
                {variant === 'error' ? 'Tắt' : 'Bật'}
            </button>
        )
    }

    const getPositionText = (position: string) => {
        const positionMap: Record<string, string> = {
            'GENERAL': 'Kỹ thuật viên',
            'SENIOR': 'Kỹ thuật viên cao cấp',
            'LEAD': 'Trưởng nhóm kỹ thuật'
        }
        return positionMap[position] || position
    }

    const SkeletonCard = () => (
        <div style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-primary)',
            borderRadius: '16px',
            padding: '24px',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div style={{
                        height: '16px',
                        background: 'var(--border-primary)',
                        borderRadius: '8px',
                        width: '96px',
                        marginBottom: '8px',
                        animation: 'pulse 2s infinite'
                    }}></div>
                    <div style={{
                        height: '32px',
                        background: 'var(--border-primary)',
                        borderRadius: '8px',
                        width: '64px',
                        marginBottom: '4px',
                        animation: 'pulse 2s infinite'
                    }}></div>
                    <div style={{
                        height: '12px',
                        background: 'var(--border-primary)',
                        borderRadius: '8px',
                        width: '80px',
                        animation: 'pulse 2s infinite'
                    }}></div>
                </div>
                <div style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'var(--border-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 2s infinite'
                }}>
                    <div style={{
                        height: '24px',
                        width: '24px',
                        background: 'var(--text-tertiary)',
                        borderRadius: '4px'
                    }}></div>
                </div>
            </div>
        </div>
    )

    const SkeletonRow = () => (
        <tr style={{ animation: 'pulse 2s infinite' }}>
            <td style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        height: '40px',
                        width: '40px',
                        background: 'var(--border-primary)',
                        borderRadius: '12px'
                    }}></div>
                    <div>
                        <div style={{
                            height: '16px',
                            background: 'var(--border-primary)',
                            borderRadius: '4px',
                            width: '128px',
                            marginBottom: '4px'
                        }}></div>
                        <div style={{
                            height: '12px',
                            background: 'var(--border-primary)',
                            borderRadius: '4px',
                            width: '160px',
                            marginBottom: '2px'
                        }}></div>
                        <div style={{
                            height: '12px',
                            background: 'var(--border-primary)',
                            borderRadius: '4px',
                            width: '112px'
                        }}></div>
                    </div>
                </div>
            </td>
            <td style={{ padding: '16px 20px' }}>
                <div style={{
                    height: '24px',
                    background: 'var(--border-primary)',
                    borderRadius: '8px',
                    width: '96px'
                }}></div>
            </td>
            {activeTab === 'technician' && (
                <td style={{ padding: '16px 20px' }}>
                    <div style={{
                        height: '24px',
                        background: 'var(--border-primary)',
                        borderRadius: '8px',
                        width: '80px'
                    }}></div>
                </td>
            )}
            <td style={{ padding: '16px 20px' }}>
                <div style={{
                    height: '24px',
                    background: 'var(--border-primary)',
                    borderRadius: '12px',
                    width: '80px'
                }}></div>
            </td>
            <td style={{ padding: '16px 20px' }}>
                <div style={{
                    height: '16px',
                    background: 'var(--border-primary)',
                    borderRadius: '4px',
                    width: '64px'
                }}></div>
            </td>
            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                <div style={{
                    height: '32px',
                    width: '32px',
                    background: 'var(--border-primary)',
                    borderRadius: '8px',
                    margin: '0 auto'
                }}></div>
            </td>
        </tr>
    )

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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
                        Quản lý Nhân sự
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: 'var(--text-secondary)',
                        margin: '0'
                    }}>
                        Quản lý thông tin nhân viên và kỹ thuật viên
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        padding: '8px 16px',
                        background: 'var(--primary-50)',
                        color: 'var(--primary-700)',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <BarChart3 size={16} />
                        Thống kê
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    background: 'var(--error-50)',
                    border: '2px solid var(--error-200)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        background: 'var(--error-100)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <AlertCircle size={16} style={{ color: 'var(--error-600)' }} />
                    </div>
                    <div style={{
                        color: 'var(--error-700)',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        {error}
                    </div>
                    <button
                        onClick={() => setError(null)}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            color: 'var(--error-600)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--error-100)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Success Alert */}
            {successMessage && (
                <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    background: 'var(--success-50)',
                    border: '2px solid var(--success-200)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        background: 'var(--success-100)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <CheckCircle size={16} style={{ color: 'var(--success-600)' }} />
                    </div>
                    <div style={{
                        color: 'var(--success-700)',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        {successMessage}
                    </div>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            color: 'var(--success-600)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--success-100)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                {loading && stats.totalStaff === 0 ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        <StatsCard
                            title="Tổng nhân viên"
                            value={stats.totalStaff}
                            icon={Users}
                            color="white"
                            secondaryValue={stats.activeStaff}
                            secondaryLabel="Đang hoạt động"
                        />
                        <StatsCard
                            title="Kỹ thuật viên"
                            value={stats.totalTechnicians}
                            icon={Wrench}
                            color="white"
                            secondaryValue={stats.activeTechnicians}
                            secondaryLabel="Đang hoạt động"
                        />
                        <StatsCard
                            title="Trung tâm"
                            value={centers.length}
                            icon={Building2}
                            color="white"
                            secondaryValue={centers.filter(c => c.isActive).length}
                            secondaryLabel="Đang hoạt động"
                        />
                        <StatsCard
                            title="Hiệu suất"
                            value={4.8}
                            icon={Activity}
                            color="white"
                        />
                    </>
                )}
            </div>

            {/* Main Content */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '32px',
                borderRadius: '20px',
                border: '1px solid var(--border-primary)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
            }}>
                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    borderBottom: '2px solid var(--border-primary)',
                    paddingBottom: '16px'
                }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setActiveTab('staff')}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                borderRadius: '12px',
                                background: activeTab === 'staff' ? 'var(--primary-500)' : 'var(--bg-secondary)',
                                color: activeTab === 'staff' ? 'white' : 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease',
                                boxShadow: activeTab === 'staff' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== 'staff') {
                                    e.currentTarget.style.background = 'var(--primary-50)'
                                    e.currentTarget.style.color = 'var(--primary-600)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== 'staff') {
                                    e.currentTarget.style.background = 'var(--bg-secondary)'
                                    e.currentTarget.style.color = 'var(--text-primary)'
                                }
                            }}
                        >
                            <Users size={16} />
                            Nhân viên
                            <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: activeTab === 'staff' ? 'rgba(255,255,255,0.2)' : 'var(--primary-100)',
                                color: activeTab === 'staff' ? 'white' : 'var(--primary-700)',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                {stats.totalStaff}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('technician')}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                borderRadius: '12px',
                                background: activeTab === 'technician' ? 'var(--success-500)' : 'var(--bg-secondary)',
                                color: activeTab === 'technician' ? 'white' : 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease',
                                boxShadow: activeTab === 'technician' ? '0 4px 12px rgba(34, 197, 94, 0.3)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== 'technician') {
                                    e.currentTarget.style.background = 'var(--success-50)'
                                    e.currentTarget.style.color = 'var(--success-600)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== 'technician') {
                                    e.currentTarget.style.background = 'var(--bg-secondary)'
                                    e.currentTarget.style.color = 'var(--text-primary)'
                                }
                            }}
                        >
                            <Wrench size={16} />
                            Kỹ thuật viên
                            <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: activeTab === 'technician' ? 'rgba(255,255,255,0.2)' : 'var(--success-100)',
                                color: activeTab === 'technician' ? 'white' : 'var(--success-700)',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                {stats.totalTechnicians}
                            </span>
                        </button>
                    </div>

                    <div style={{
                        padding: '8px 16px',
                        background: 'var(--primary-50)',
                        color: 'var(--primary-700)',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        {activeTab === 'staff' ? stats.totalStaff : stats.totalTechnicians} {activeTab === 'staff' ? 'nhân viên' : 'kỹ thuật viên'}
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-primary)',
                    marginBottom: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                     <div style={{
                         display: 'grid',
                         gridTemplateColumns: '1fr 1fr 1fr auto',
                         gap: '16px',
                         alignItems: 'end'
                     }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                marginBottom: '8px'
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
                                    placeholder="Tìm kiếm theo tên, email, SĐT..."
                                    value={activeTab === 'staff' ? staffFilters.searchTerm : technicianFilters.searchTerm}
                                    onChange={(e) => activeTab === 'staff'
                                        ? setStaffFilters(prev => ({ ...prev, searchTerm: e.target.value }))
                                        : setTechnicianFilters(prev => ({ ...prev, searchTerm: e.target.value }))
                                    }
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
                                Trung tâm
                            </label>
                            <select
                                value={activeTab === 'staff' ? staffFilters.centerId || '' : technicianFilters.centerId || ''}
                                onChange={(e) => activeTab === 'staff'
                                    ? setStaffFilters(prev => ({ ...prev, centerId: e.target.value ? Number(e.target.value) : null }))
                                    : setTechnicianFilters(prev => ({ ...prev, centerId: e.target.value ? Number(e.target.value) : null }))
                                }
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
                                <option value="">Tất cả trung tâm</option>
                                {centers.map(center => (
                                    <option key={center.centerId} value={center.centerId}>
                                        {center.centerName}
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
                                value={activeTab === 'staff'
                                    ? staffFilters.isActive === null ? '' : staffFilters.isActive.toString()
                                    : technicianFilters.isActive === null ? '' : technicianFilters.isActive.toString()
                                }
                                onChange={(e) => activeTab === 'staff'
                                    ? setStaffFilters(prev => ({ ...prev, isActive: e.target.value === '' ? null : e.target.value === 'true' }))
                                    : setTechnicianFilters(prev => ({ ...prev, isActive: e.target.value === '' ? null : e.target.value === 'true' }))
                                }
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
                                <option value="">Tất cả trạng thái</option>
                                <option value="true">Hoạt động</option>
                                <option value="false">Không hoạt động</option>
                            </select>
                        </div>

                         <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', minWidth: 0 }}>
                             <button
                                 onClick={activeTab === 'staff' ? loadStaffData : loadTechnicianData}
                                 disabled={loading}
                                 style={{
                                     padding: '12px 16px',
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
                                     gap: '6px',
                                     transition: 'all 0.2s ease',
                                     whiteSpace: 'nowrap',
                                     flexShrink: 0
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
                                 <RefreshCw size={14} style={{
                                     animation: loading ? 'spin 1s linear infinite' : 'none'
                                 }} />
                                 Làm mới
                             </button>

                             <button
                                 onClick={activeTab === 'staff' ? () => setShowStaffModal(true) : () => setShowTechnicianModal(true)}
                                 style={{
                                     padding: '12px 16px',
                                     background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                     color: 'white',
                                     border: 'none',
                                     borderRadius: '12px',
                                     fontSize: '14px',
                                     fontWeight: '600',
                                     cursor: 'pointer',
                                     display: 'flex',
                                     alignItems: 'center',
                                     gap: '6px',
                                     boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                     transition: 'all 0.2s ease',
                                     transform: 'translateY(0)',
                                     whiteSpace: 'nowrap',
                                     flexShrink: 0
                                 }}
                                 onMouseEnter={(e) => {
                                     e.currentTarget.style.transform = 'translateY(-2px)'
                                     e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                                 }}
                                 onMouseLeave={(e) => {
                                     e.currentTarget.style.transform = 'translateY(0)'
                                     e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                                 }}
                             >
                                 <Plus size={16} />
                                 Thêm mới
                             </button>
                         </div>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflow: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                    }}>
                        <thead>
                            <tr style={{
                                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                color: 'white'
                            }}>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    border: 'none'
                                }}>
                                    Thông tin
                                </th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    border: 'none'
                                }}>
                                    Trung tâm
                                </th>
                                {activeTab === 'technician' && (
                                    <th style={{
                                        padding: '16px 20px',
                                        textAlign: 'left',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        border: 'none'
                                    }}>
                                        Vị trí
                                    </th>
                                )}
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    border: 'none'
                                }}>
                                    Trạng thái
                                </th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    border: 'none'
                                }}>
                                    Ngày tạo
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
                            {loading ? (
                                <>
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                </>
                            ) : (
                                (activeTab === 'staff' ? staff : technicians).map((item: any, index: number) => (
                                    <tr
                                        key={item.staffId || item.technicianId}
                                        style={{
                                            borderBottom: '1px solid var(--border-primary)',
                                            transition: 'all 0.2s ease',
                                            background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--primary-50)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                                        }}
                                    >
                                        <td style={{
                                            padding: '16px 20px',
                                            fontSize: '14px',
                                            color: 'var(--text-primary)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    flexShrink: 0,
                                                    fontSize: '16px',
                                                    fontWeight: '700'
                                                }}>
                                                    {item.userFullName?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div style={{
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        color: 'var(--text-primary)',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {item.userFullName || 'Chưa có tên'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        marginBottom: '2px'
                                                    }}>
                                                        <Mail size={12} />
                                                        {item.userEmail || 'Chưa có email'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <Smartphone size={12} />
                                                        {item.userPhoneNumber || 'Chưa có SĐT'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            fontSize: '14px',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '4px 12px',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                {item.centerName || 'Chưa có trung tâm'}
                                            </div>
                                        </td>
                                        {activeTab === 'technician' && (
                                            <td style={{
                                                padding: '16px 20px',
                                                fontSize: '14px',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                <div style={{
                                                    display: 'inline-block',
                                                    padding: '4px 12px',
                                                    background: 'var(--success-50)',
                                                    color: 'var(--success-700)',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    {getPositionText(item.position)}
                                                </div>
                                            </td>
                                        )}
                                        <td style={{
                                            padding: '16px 20px',
                                            textAlign: 'center'
                                        }}>
                                            <StatusBadge isActive={item.isActive} />
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            fontSize: '14px',
                                            color: 'var(--text-secondary)',
                                            textAlign: 'center'
                                        }}>
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <ActionButton
                                                    onClick={() => activeTab === 'staff'
                                                        ? handleUpdateStaffStatus(item.staffId, !item.isActive)
                                                        : handleUpdateTechnicianStatus(item.technicianId, !item.isActive)
                                                    }
                                                    icon={item.isActive ? X : CheckCircle}
                                                    variant={item.isActive ? 'error' : 'success'}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Empty State */}
                    {!loading && (activeTab === 'staff' ? staff.length === 0 : technicians.length === 0) && (
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
                                fontSize: '24px'
                            }}>
                                👥
                            </div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                                Không tìm thấy {activeTab === 'staff' ? 'nhân viên' : 'kỹ thuật viên'} nào
                            </h4>
                            <p style={{ margin: 0, fontSize: '14px' }}>
                                Thử thay đổi bộ lọc hoặc thêm {activeTab === 'staff' ? 'nhân viên' : 'kỹ thuật viên'} mới
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {(showStaffModal || showTechnicianModal) && (
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
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                            paddingBottom: '16px',
                            borderBottom: '2px solid var(--border-primary)'
                        }}>
                            <div>
                                <h3 style={{
                                    margin: '0 0 4px 0',
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    {activeTab === 'staff' ? 'Thêm Nhân viên Mới' : 'Thêm Kỹ thuật viên Mới'}
                                </h3>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {activeTab === 'staff'
                                        ? 'Thêm nhân viên mới vào hệ thống'
                                        : 'Thêm kỹ thuật viên mới vào hệ thống'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={activeTab === 'staff' ? () => setShowStaffModal(false) : () => setShowTechnicianModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--error-50)'
                                    e.currentTarget.style.color = 'var(--error-600)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--bg-secondary)'
                                    e.currentTarget.style.color = 'var(--text-primary)'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    marginBottom: '8px'
                                }}>
                                    Người dùng <span style={{ color: 'var(--error-500)' }}>*</span>
                                    {loading && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>Đang tải...</span>}
                                </label>
                                <select
                                    value={activeTab === 'staff' ? staffForm.userId : technicianForm.userId}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        console.log('Selected user ID:', value);
                                        console.log('Users data structure:', users);
                                        console.log('Selected user object:', users.find(u => u.id?.toString() === value || u.userId?.toString() === value));
                                        if (activeTab === 'staff') {
                                            setStaffForm(prev => ({
                                                ...prev,
                                                userId: value
                                            }))
                                        } else {
                                            setTechnicianForm(prev => ({
                                                ...prev,
                                                userId: value
                                            }))
                                        }
                                    }}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        border: '2px solid var(--border-primary)',
                                        borderRadius: '12px',
                                        background: loading ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        transition: 'all 0.2s ease',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                    onFocus={(e) => {
                                        if (!loading) {
                                            e.target.style.borderColor = 'var(--primary-500)'
                                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                        }
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--border-primary)'
                                        e.target.style.boxShadow = 'none'
                                    }}
                                >
                                    <option value="">{loading ? 'Đang tải người dùng...' : 'Chọn người dùng'}</option>
                                    {users.map(user => (
                                        <option key={user.id || user.userId} value={user.id || user.userId}>
                                            {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()} - {user.email}
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
                                    Trung tâm <span style={{ color: 'var(--error-500)' }}>*</span>
                                </label>
                                <select
                                    value={activeTab === 'staff' ? staffForm.centerId : technicianForm.centerId}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        console.log('Selected center ID:', value);
                                        if (activeTab === 'staff') {
                                            setStaffForm(prev => ({
                                                ...prev,
                                                centerId: value
                                            }))
                                        } else {
                                            setTechnicianForm(prev => ({
                                                ...prev,
                                                centerId: value
                                            }))
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        border: '2px solid var(--border-primary)',
                                        borderRadius: '12px',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        transition: 'all 0.2s ease',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        cursor: 'pointer'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--primary-500)'
                                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--border-primary)'
                                        e.target.style.boxShadow = 'none'
                                    }}
                                >
                                    <option value="">Chọn trung tâm</option>
                                    {centers.map(center => (
                                        <option key={center.centerId} value={center.centerId}>
                                            {center.centerName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {activeTab === 'technician' && (
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)',
                                        marginBottom: '8px'
                                    }}>
                                        Vị trí <span style={{ color: 'var(--error-500)' }}>*</span>
                                    </label>
                                    <select
                                        value={technicianForm.position}
                                        onChange={(e) => setTechnicianForm(prev => ({ ...prev, position: e.target.value as any }))}
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            border: '2px solid var(--border-primary)',
                                            borderRadius: '12px',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                            transition: 'all 0.2s ease',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            cursor: 'pointer'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary-500)'
                                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-primary)'
                                            e.target.style.boxShadow = 'none'
                                        }}
                                    >
                                        <option value="GENERAL">Kỹ thuật viên</option>
                                        <option value="SENIOR">Kỹ thuật viên cao cấp</option>
                                        <option value="LEAD">Trưởng nhóm kỹ thuật</option>
                                    </select>
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                marginTop: '8px',
                                paddingTop: '20px',
                                borderTop: '2px solid var(--border-primary)'
                            }}>
                                <button
                                    onClick={activeTab === 'staff' ? () => setShowStaffModal(false) : () => setShowTechnicianModal(false)}
                                    style={{
                                        border: '2px solid var(--border-primary)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        borderRadius: '12px',
                                        padding: '12px 24px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--text-secondary)'
                                        e.currentTarget.style.background = 'var(--bg-tertiary)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-primary)'
                                        e.currentTarget.style.background = 'var(--bg-secondary)'
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    disabled={loading || isValidating || (activeTab === 'staff'
                                        ? !staffForm.userId || !staffForm.centerId
                                        : !technicianForm.userId || !technicianForm.centerId
                                    )}
                                    onClick={activeTab === 'staff' ? handleCreateStaff : handleCreateTechnician}
                                    style={{
                                        border: 'none',
                                        background: (loading || isValidating)
                                            ? 'var(--text-tertiary)'
                                            : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                        color: 'white',
                                        borderRadius: '12px',
                                        padding: '12px 24px',
                                        cursor: (loading || isValidating) ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        opacity: (loading || isValidating) ? 0.7 : 1,
                                        transition: 'all 0.2s ease',
                                        boxShadow: (loading || isValidating) ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!loading && !isValidating) {
                                            e.currentTarget.style.transform = 'translateY(-1px)'
                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!loading && !isValidating) {
                                            e.currentTarget.style.transform = 'translateY(0)'
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                                        }
                                    }}
                                >
                                    {(loading || isValidating) && (
                                        <RefreshCw size={16} style={{
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                    )}
                                    {isValidating ? 'Đang kiểm tra...' :
                                        loading ? 'Đang lưu...' :
                                            (activeTab === 'staff' ? 'Tạo Nhân viên' : 'Tạo Kỹ thuật viên')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
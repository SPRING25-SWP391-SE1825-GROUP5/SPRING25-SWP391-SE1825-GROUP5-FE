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
    ChevronUp,
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
    BarChart3,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'
import { StaffService, type AvailableUser, type Employee } from '@/services/staffService'
import { TechnicianService } from '@/services/technicianService'
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

    const [employees, setEmployees] = useState<Employee[]>([])
    const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
    const [centers, setCenters] = useState<Center[]>([])

    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0
    })

    const [filters, setFilters] = useState({
        searchTerm: '',
        centerId: null as number | null,
        isActive: null as boolean | null,
        unassigned: false
    })

    const [sortBy, setSortBy] = useState<'fullName' | 'centerName' | 'role' | 'isActive' | 'createdAt'>('fullName')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    const [showAssignmentModal, setShowAssignmentModal] = useState(false)
    const [assignmentForm, setAssignmentForm] = useState({
        userIds: [] as number[],
        centerId: '',
        employeeType: 'STAFF' as 'STAFF' | 'TECHNICIAN'
    })
    const [assignmentError, setAssignmentError] = useState<string | null>(null)
    const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(null)
    const [assignedMap, setAssignedMap] = useState<Record<string, { centerName?: string }>>({})

    const [stats, setStats] = useState({
        totalStaff: 0,
        activeStaff: 0,
        inactiveStaff: 0,
        totalTechnicians: 0,
        activeTechnicians: 0,
        inactiveTechnicians: 0
    })

    const visibleEmployees = useMemo(() => {
        const role = activeTab === 'staff' ? 'STAFF' : 'TECHNICIAN'
        return (employees ?? []).filter(e => e.role === role)
    }, [employees, activeTab])

    const sortedVisibleEmployees = useMemo(() => {
        const getValue = (e: Employee) => {
            switch (sortBy) {
                case 'fullName':
                    return (e.fullName || '').toLowerCase()
                case 'centerName':
                    return (e.centerName || '').toLowerCase()
                case 'role':
                    return (e.role || '').toLowerCase()
                case 'isActive':
                    return e.isActive ? 1 : 0
                case 'createdAt':
                    return e.createdAt ? new Date(e.createdAt).getTime() : 0
                default:
                    return (e.fullName || '').toLowerCase()
            }
        }

        const list = [...visibleEmployees]
        list.sort((a, b) => {
            const av = getValue(a) as any
            const bv = getValue(b) as any
            if (sortOrder === 'asc') {
                return av < bv ? -1 : av > bv ? 1 : 0
            }
            return av > bv ? -1 : av < bv ? 1 : 0
        })
        return list
    }, [visibleEmployees, sortBy, sortOrder])

    const handleSort = (field: 'fullName' | 'centerName' | 'role' | 'isActive' | 'createdAt') => {
        if (sortBy === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
    }

    const getSortIcon = (field: 'fullName' | 'centerName' | 'role' | 'isActive' | 'createdAt') => {
        if (sortBy !== field) {
            return <ChevronUp size={14} style={{ opacity: 0.3 }} />
        }
        return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    }

    const computedStats = useMemo(() => {
        const totalStaff = employees.filter(e => e.role === 'STAFF').length
        const activeStaff = employees.filter(e => e.role === 'STAFF' && e.isActive).length
        const totalTechnicians = employees.filter(e => e.role === 'TECHNICIAN').length
        const activeTechnicians = employees.filter(e => e.role === 'TECHNICIAN' && e.isActive).length
        return {
            totalStaff,
            activeStaff,
            inactiveStaff: totalStaff - activeStaff,
            totalTechnicians,
            activeTechnicians,
            inactiveTechnicians: totalTechnicians - activeTechnicians
        }
    }, [employees])

    useEffect(() => {
        loadInitialData()
    }, [])

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadEmployeeData()
        }, 300) // 300ms debounce

        return () => clearTimeout(timeoutId)
    }, [filters.searchTerm, filters.centerId, filters.isActive, filters.unassigned, pagination.pageNumber])

    const loadInitialData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [centersData, staffUsersData, technicianUsersData, statsData] = await Promise.all([
                CenterService.getCenters({ pageSize: 1000 }),
                UserService.getUsers({ pageSize: 1000, role: 'staff' }),
                UserService.getUsers({ pageSize: 1000, role: 'technician' }),
                StaffService.getStaffStats()
            ])

            setCenters(centersData.centers)
            const staffUsers = staffUsersData?.data?.users ?? []
            const technicianUsers = technicianUsersData?.data?.users ?? []
            const mergedUsers = [...staffUsers, ...technicianUsers].map((u: any) => ({
                id: u.id ?? u.userId,
                fullName: u.fullName ?? `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                email: u.email,
                phoneNumber: u.phoneNumber ?? u.phone,
                isActive: u.isActive ?? true,
                role: u.role ?? ''
            }))
            setAvailableUsers(mergedUsers)
            setStats(statsData)

            console.log('Available users data:', mergedUsers)
            console.log('Centers data:', centersData.centers)

        } catch (err: any) {
            setError('Không thể tải dữ liệu: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const loadAllAssignments = async () => {
        try {
            setIsValidating(true)
            const centersResp = await CenterService.getCenters({ pageSize: 1000 })
            const centerIds = (centersResp?.centers || []).map((c: any) => c.centerId)
            const groups = await Promise.all(
                centerIds.map(async (cid: number) => {
                    const r = await StaffService.getCenterEmployees({
                        centerId: cid,
                        pageNumber: 1,
                        pageSize: 1000
                    })
                    const list = Array.isArray((r as any)?.employees) ? (r as any).employees : []
                    return list.map((e: any) => ({
                        userId: e.userId,
                        role: e.role,
                        centerName: e.centerName
                    }))
                })
            )
            const map: Record<string, { centerName?: string }> = {}
            groups.flat().forEach((it: any) => {
                const key = `${it.userId}-${it.role}`
                map[key] = { centerName: it.centerName }
            })
            setAssignedMap(map)
        } catch (e) {
            // silent fail for modal auxiliary data
        } finally {
            setIsValidating(false)
        }
    }

    const handleOpenAssignmentModal = async () => {
        setShowAssignmentModal(true)
        await loadAllAssignments()
    }

    const loadEmployeeData = async () => {
        try {
            setLoading(true)
            let employeeData: Employee[] = []

            if (!filters.centerId && !filters.unassigned) {
                // Tất cả trung tâm: gộp dữ liệu theo từng center
                const centersResp = await CenterService.getCenters({ pageSize: 1000 })
                const centerIds = (centersResp?.centers || []).map((c: any) => c.centerId)
                const groups = await Promise.all(
                    centerIds.map(async (cid: number) => {
                        const r = await StaffService.getCenterEmployees({
                            centerId: cid,
                            pageNumber: 1,
                            pageSize: 1000,
                            searchTerm: filters.searchTerm || undefined,
                            isActive: filters.isActive || undefined
                        })
                        const list = Array.isArray((r as any)?.employees) ? (r as any).employees : []
                        return list
                    })
                )
                employeeData = groups.flat()
            } else {
                // 1 trung tâm cụ thể hoặc danh sách chưa phân công
                const response = await StaffService.getCenterEmployees({
                    centerId: filters.centerId || undefined,
                    unassigned: filters.unassigned,
                    pageNumber: pagination.pageNumber,
                    pageSize: pagination.pageSize,
                    searchTerm: filters.searchTerm || undefined,
                    isActive: filters.isActive || undefined
                })
                employeeData = Array.isArray((response as any)?.employees)
                    ? (response as any).employees
                    : []
            }

            // Apply status filter client-side if needed (an extra guard)
            if (filters.isActive !== null) {
                employeeData = employeeData.filter((employee: Employee) => employee.isActive === filters.isActive)
            }

            setEmployees(employeeData)
            setPagination(prev => ({
                ...prev,
                totalCount: employeeData.length,
                totalPages: Math.ceil(employeeData.length / prev.pageSize)
            }))

        } catch (err: any) {
            setError('Không thể tải danh sách nhân viên: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const handleAssignEmployees = async () => {
        try {
            setLoading(true)
            setError(null)
            setSuccessMessage(null)
            setAssignmentError(null)
            setAssignmentSuccess(null)
            setIsValidating(true)

            // Validate form data
            if (assignmentForm.userIds.length === 0 || !assignmentForm.centerId) {
                throw new Error('Vui lòng chọn người dùng và trung tâm')
            }

            const formData = {
                userIds: assignmentForm.userIds,
                centerId: Number(assignmentForm.centerId)
            }

            console.log('Assigning employees with data:', formData)

            // Assign employees
            const result = await StaffService.assignEmployeesToCenter(formData)

            // Success message hiển thị trong modal
            setAssignmentSuccess(`Gán ${result.length} người dùng thành công!`)
            // Giữ modal mở, chỉ reset danh sách chọn để dễ thao tác tiếp
            setAssignmentForm(prev => ({ ...prev, userIds: [] }))

            // Reload data
            await Promise.all([loadEmployeeData(), loadInitialData()])

            // Clear modal success after 3 seconds
            setTimeout(() => setAssignmentSuccess(null), 3000)

        } catch (err: any) {
            // Lỗi hiển thị trong modal
            setAssignmentError(err.message || 'Không thể gán nhân viên')
        } finally {
            setLoading(false)
            setIsValidating(false)
        }
    }

    const handleUpdateEmployeeStatus = async (employeeId: number, isActive: boolean) => {
        try {
            setLoading(true)
            // Tìm employee để xác định loại
            const employee = employees.find(emp => emp.id === employeeId)
            if (!employee) {
                throw new Error('Không tìm thấy nhân viên')
            }

            if (employee.role === 'STAFF') {
                await StaffService.updateStaff(employeeId, { isActive })
            } else {
                await StaffService.updateTechnician(employeeId, { isActive })
            }
            
            await loadEmployeeData()
            await loadInitialData()
        } catch (err: any) {
            setError('Không thể cập nhật nhân viên: ' + (err.message || 'Unknown error'))
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
        isActive,
        disabled = false
    }: {
        onClick: () => void
        isActive: boolean
        disabled?: boolean
    }) => {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                style={{
                    padding: '8px',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.7 : 1,
                    width: '36px',
                    height: '36px'
                }}
                onMouseEnter={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.borderColor = isActive ? 'var(--error-500)' : 'var(--success-500)'
                        e.currentTarget.style.background = isActive ? 'var(--error-50)' : 'var(--success-50)'
                    }
                }}
                onMouseLeave={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.borderColor = 'var(--border-primary)'
                        e.currentTarget.style.background = 'var(--bg-card)'
                    }
                }}
                title={isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
            >
                {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
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
                            value={computedStats.totalStaff}
                            icon={Users}
                            color="white"
                            secondaryValue={computedStats.activeStaff}
                            secondaryLabel="Đang hoạt động"
                        />
                        <StatsCard
                            title="Kỹ thuật viên"
                            value={computedStats.totalTechnicians}
                            icon={Wrench}
                            color="white"
                            secondaryValue={computedStats.activeTechnicians}
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
                {/* Header + Tabs */}
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
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: `2px solid ${activeTab === 'staff' ? 'var(--primary-500)' : 'var(--border-primary)'}`,
                                background: activeTab === 'staff' ? 'var(--primary-50)' : 'var(--bg-secondary)',
                                color: activeTab === 'staff' ? 'var(--primary-700)' : 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Nhân viên
                        </button>
                        <button
                            onClick={() => setActiveTab('technician')}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: `2px solid ${activeTab === 'technician' ? 'var(--primary-500)' : 'var(--border-primary)'}`,
                                background: activeTab === 'technician' ? 'var(--primary-50)' : 'var(--bg-secondary)',
                                color: activeTab === 'technician' ? 'var(--primary-700)' : 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Kỹ thuật viên
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
                        {visibleEmployees.length} {activeTab === 'staff' ? 'nhân viên' : 'kỹ thuật viên'} hiện tại
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
                        gridTemplateColumns: '1fr 1fr 1fr auto auto',
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
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
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
                                value={filters.centerId || ''}
                                onChange={(e) => setFilters(prev => ({ 
                                    ...prev, 
                                    centerId: e.target.value ? Number(e.target.value) : null,
                                    unassigned: false
                                }))}
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
                                value={filters.isActive === null ? '' : filters.isActive.toString()}
                                onChange={(e) => setFilters(prev => ({ 
                                    ...prev, 
                                    isActive: e.target.value === '' ? null : e.target.value === 'true' 
                                }))}
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
                                onClick={() => {
                                    setPagination(prev => ({ ...prev, pageNumber: 1 }))
                                    setFilters({
                                        searchTerm: '',
                                        centerId: null,
                                        isActive: null,
                                        unassigned: false
                                    })
                                }}
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
                                <RefreshCw size={14} />
                                Đặt lại bộ lọc
                            </button>

                            <button
                                onClick={handleOpenAssignmentModal}
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
                                Phân công
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
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Thông tin
                                        <div style={{ display: 'flex', alignItems: 'center', opacity: sortBy === 'fullName' ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
                                            {getSortIcon('fullName')}
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
                                    Trung tâm
                                </th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    border: 'none'
                                }}>
                                    Vai trò
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
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        Ngày tạo
                                        <div style={{ display: 'flex', alignItems: 'center', opacity: sortBy === 'createdAt' ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
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
                            {loading ? (
                                <>
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                </>
                            ) : (
                                (sortedVisibleEmployees ?? []).map((employee: Employee, index: number) => (
                                    <tr
                                        key={employee.id}
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
                                                    {employee.fullName?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div style={{
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        color: 'var(--text-primary)',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {employee.fullName || 'Chưa có tên'}
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
                                                        {employee.email || 'Chưa có email'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <Smartphone size={12} />
                                                        {employee.phoneNumber || 'Chưa có SĐT'}
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
                                                {employee.centerName || 'Chưa có trung tâm'}
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
                                                background: employee.role === 'STAFF' ? 'var(--primary-50)' : 'var(--success-50)',
                                                color: employee.role === 'STAFF' ? 'var(--primary-700)' : 'var(--success-700)',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                {employee.role === 'STAFF' ? 'Nhân viên' : 'Kỹ thuật viên'}
                                            </div>
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            textAlign: 'center'
                                        }}>
                                            <StatusBadge isActive={employee.isActive} />
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            fontSize: '14px',
                                            color: 'var(--text-secondary)',
                                            textAlign: 'center'
                                        }}>
                                            {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <ActionButton
                                                    onClick={() => handleUpdateEmployeeStatus(employee.id, !employee.isActive)}
                                                    isActive={employee.isActive}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Empty State */}
                    {!loading && visibleEmployees.length === 0 && (
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
                                {activeTab === 'staff' ? <Users size={32} /> : <Wrench size={32} />}
                            </div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                                {activeTab === 'staff' ? 'Không có nhân viên' : 'Không có kỹ thuật viên'}
                            </h4>
                            <p style={{ margin: 0, fontSize: '14px' }}>
                                Thử thay đổi bộ lọc hoặc thêm mới
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Assignment Modal */}
            {showAssignmentModal && (
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
                        width: '700px',
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
                                    Phân công Nhân viên
                                </h3>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Gán người dùng vào trung tâm làm nhân viên hoặc kỹ thuật viên
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAssignmentModal(false)}
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
                            {(assignmentError || assignmentSuccess) && (
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: `2px solid ${assignmentError ? 'var(--error-200)' : 'var(--success-200)'}`,
                                    background: assignmentError ? 'var(--error-50)' : 'var(--success-50)',
                                    color: assignmentError ? 'var(--error-700)' : 'var(--success-700)'
                                }}>
                                    {assignmentError || assignmentSuccess}
                                </div>
                            )}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    marginBottom: '8px'
                                }}>
                                    Loại nhân viên <span style={{ color: 'var(--error-500)' }}>*</span>
                                </label>
                                <select
                                    value={assignmentForm.employeeType}
                                    onChange={(e) => setAssignmentForm(prev => ({ 
                                        ...prev, 
                                        employeeType: e.target.value as 'STAFF' | 'TECHNICIAN',
                                        // đổi loại thì reset lựa chọn người dùng để tránh lệch role
                                        userIds: [] 
                                    }))}
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
                                >
                                    <option value="STAFF">Nhân viên</option>
                                    <option value="TECHNICIAN">Kỹ thuật viên</option>
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
                                    Người dùng <span style={{ color: 'var(--error-500)' }}>*</span>
                                </label>
                                <div style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    border: '2px solid var(--border-primary)',
                                    borderRadius: '12px',
                                    background: 'var(--bg-secondary)',
                                    padding: '8px'
                                }}>
                                    {availableUsers
                                        .filter(user => {
                                            const want = assignmentForm.employeeType === 'STAFF' ? 'staff' : 'technician'
                                            return (user.role || '').toLowerCase() === want
                                        })
                                        .map(user => {
                                            const key = `${user.id}-${assignmentForm.employeeType}`
                                            const assignedInfo = assignedMap[key]
                                            const isAssigned = Boolean(assignedInfo)
                                            return (
                                        <label key={user.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            cursor: isAssigned ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            marginBottom: '4px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--primary-50)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={assignmentForm.userIds.includes(user.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setAssignmentForm(prev => ({
                                                            ...prev,
                                                            userIds: [...prev.userIds, user.id]
                                                        }))
                                                    } else {
                                                        setAssignmentForm(prev => ({
                                                            ...prev,
                                                            userIds: prev.userIds.filter(id => id !== user.id)
                                                        }))
                                                    }
                                                }}
                                                disabled={isAssigned}
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    accentColor: 'var(--primary-500)'
                                                }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: '600' }}>
                                                        {user.fullName}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                        {user.email} • {user.phoneNumber}
                                                    </div>
                                                </div>
                                                {isAssigned && assignedInfo?.centerName && (
                                                    <div style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '4px 8px',
                                                        borderRadius: '12px',
                                                        background: 'var(--warning-50)',
                                                        color: 'var(--warning-700)',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        border: '1px solid var(--warning-200)'
                                                    }} title={assignedInfo.centerName}>
                                                        {assignedInfo.centerName}
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                            )
                                    })}
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
                                    Trung tâm <span style={{ color: 'var(--error-500)' }}>*</span>
                                </label>
                                <select
                                    value={assignmentForm.centerId}
                                    onChange={(e) => setAssignmentForm(prev => ({ 
                                        ...prev, 
                                        centerId: e.target.value 
                                    }))}
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
                                >
                                    <option value="">Chọn trung tâm</option>
                                    {centers.map(center => (
                                        <option key={center.centerId} value={center.centerId}>
                                            {center.centerName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                marginTop: '8px',
                                paddingTop: '20px',
                                borderTop: '2px solid var(--border-primary)'
                            }}>
                                <button
                                    onClick={() => setShowAssignmentModal(false)}
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
                                >
                                    Hủy
                                </button>
                                <button
                                    disabled={loading || isValidating || assignmentForm.userIds.length === 0 || !assignmentForm.centerId}
                                    onClick={handleAssignEmployees}
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
                                >
                                    {(loading || isValidating) && (
                                        <RefreshCw size={16} style={{
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                    )}
                                    {isValidating ? 'Đang kiểm tra...' :
                                        loading ? 'Đang phân công...' :
                                            'Phân công Nhân viên'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
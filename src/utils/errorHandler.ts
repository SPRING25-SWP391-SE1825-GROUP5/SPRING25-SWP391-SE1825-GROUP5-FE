import toast from 'react-hot-toast'

export interface ApiError {
    message?: string
    userMessage?: string
    status?: number
    code?: string
}

/**
 * Hiển thị thông báo lỗi thân thiện với người dùng
 */
export const showErrorToast = (error: ApiError | string) => {
    let message = 'Đã xảy ra lỗi. Vui lòng thử lại sau.'

    if (typeof error === 'string') {
        message = error
    } else if (error?.userMessage) {
        message = error.userMessage
    } else if (error?.message) {
        message = error.message
    }

    toast.error(message, {
        duration: 5000,
        position: 'bottom-right',
        style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500'
        }
    })
}

/**
 * Hiển thị thông báo thành công
 */
export const showSuccessToast = (message: string) => {
    toast.success(message, {
        duration: 3000,
        position: 'bottom-right',
        style: {
            background: '#dcfce7',
            color: '#16a34a',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500'
        }
    })
}

/**
 * Hiển thị thông báo cảnh báo
 */
export const showWarningToast = (message: string) => {
    toast(message, {
        duration: 4000,
        position: 'bottom-right',
        icon: '⚠️',
        style: {
            background: '#fef3c7',
            color: '#d97706',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500'
        }
    })
}

/**
 * Xử lý lỗi API và hiển thị thông báo phù hợp
 */
export const handleApiError = (error: any) => {
    console.error('API Error:', error)

    // Kiểm tra các loại lỗi cụ thể
    if (error?.code === 'ECONNREFUSED' || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        showErrorToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
    } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        showErrorToast('Kết nối quá chậm. Vui lòng thử lại sau.')
    } else if (error?.status === 401) {
        showErrorToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    } else if (error?.status === 403) {
        showErrorToast('Bạn không có quyền thực hiện hành động này.')
    } else if (error?.status === 404) {
        showErrorToast('Không tìm thấy tài nguyên yêu cầu.')
    } else if (error?.status === 409) {
        showErrorToast('Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.')
    } else if (error?.status === 422) {
        showErrorToast('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.')
    } else if (error?.status === 429) {
        showErrorToast('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
    } else if (error?.status >= 500) {
        showErrorToast('Lỗi máy chủ. Vui lòng thử lại sau.')
    } else {
        // Sử dụng thông báo lỗi từ API hoặc thông báo mặc định
        const message = error?.userMessage || error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
        showErrorToast(message)
    }
}

/**
 * Xử lý lỗi validation
 */
export const handleValidationError = (errors: Record<string, string[]>) => {
    const firstError = Object.values(errors)[0]?.[0]
    if (firstError) {
        showErrorToast(firstError)
    } else {
        showErrorToast('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.')
    }
}

import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { OrderService, PromotionService, CustomerService } from '@/services'
import { PromotionBookingService } from '@/services/promotionBookingService'
import { PayOSService } from '@/services/payOSService'
import { ERROR_TYPES, ERROR_MESSAGES } from '@/constants/appConstants'
import './order-confirmation.scss'
import toast from 'react-hot-toast'

type OrderDetail = {
  orderId: number
  items: Array<{
    productId?: number
    partId?: number
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  discount?: number
  total: number
  couponCode?: string | null
}

export default function OrderConfirmationPage() {
  const { orderId: orderIdParam } = useParams()
  const location = useLocation() as { state?: { orderId?: number } }
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentLinkCheckAttempted, setPaymentLinkCheckAttempted] = useState(false)
  const [existingPaymentLink, setExistingPaymentLink] = useState<string | null>(null)
  const [isCreatingNewOrder, setIsCreatingNewOrder] = useState(false)
  const [lastError231OrderId, setLastError231OrderId] = useState<number | null>(null)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState<number>(0)
  const [savedPromos, setSavedPromos] = useState<Array<{ code?: string; description?: string; discountAmount?: number; status?: string }>>([])
  const [loadingPromos, setLoadingPromos] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const idFromState = location?.state?.orderId
      const idFromSession = sessionStorage.getItem('currentOrderId')
      const resolvedId = Number(idFromState ?? orderIdParam ?? idFromSession)
      if (!resolvedId || Number.isNaN(resolvedId)) {
        toast.error('Không xác định được đơn hàng')
        navigate('/')
        return
      }
      sessionStorage.setItem('currentOrderId', String(resolvedId))
      try {
        setLoading(true)
        const [detailResp, itemsResp] = await Promise.all([
          OrderService.getOrderById(resolvedId),
          OrderService.getOrderItems(resolvedId),
        ])
        console.log('OrderConfirmationPage - detailResp:', detailResp)
        console.log('OrderConfirmationPage - itemsResp:', itemsResp)
        
        if (!detailResp?.success) {
          toast.error(detailResp?.message || 'Không thể tải chi tiết đơn hàng')
          setLoading(false)
          return
        }
        
        const o = detailResp.data as any
        console.log('OrderConfirmationPage - detail data:', o)
        
        // Xử lý items: kiểm tra cả success và data structure
        let itemsRaw: any[] = []
        if (itemsResp?.success && Array.isArray(itemsResp?.data)) {
          itemsRaw = itemsResp.data
        } else if (Array.isArray(itemsResp)) {
          // Nếu response là array trực tiếp (không wrap trong {success, data})
          itemsRaw = itemsResp
        } else if (itemsResp?.data && Array.isArray(itemsResp.data)) {
          itemsRaw = itemsResp.data
        } else if (!itemsResp?.success) {
          // Nếu items API fail, thử dùng OrderItems từ detail response
          console.warn('Items API failed, trying to use OrderItems from detail response')
          if (Array.isArray(o?.OrderItems)) {
            itemsRaw = o.OrderItems
          } else if (Array.isArray(o?.orderItems)) {
            itemsRaw = o.orderItems
          }
        }
        console.log('OrderConfirmationPage - itemsRaw:', itemsRaw)
        
        const items = itemsRaw.map((it: any) => ({
          productId: it.PartId ?? it.partId,
          partId: it.PartId ?? it.partId,
          name: it.PartName ?? it.partName ?? it.name ?? 'Sản phẩm không xác định',
          quantity: it.Quantity ?? it.quantity ?? 1,
          unitPrice: Number(it.UnitPrice ?? it.unitPrice ?? 0),
          totalPrice: Number(it.Subtotal ?? it.subtotal ?? it.LineTotal ?? it.lineTotal ?? 0),
        }))
        
        console.log('OrderConfirmationPage - mapped items:', items)
        
        const subtotal = items.reduce((s, it) => s + (it.totalPrice || 0), 0)
        const mapped: OrderDetail = {
          orderId: o.OrderId ?? o.orderId ?? o.Id ?? resolvedId,
          items,
          subtotal,
          discount: 0,
          total: Number(o.TotalAmount ?? o.totalAmount ?? subtotal),
          couponCode: o.CouponCode ?? o.couponCode ?? null,
        }
        console.log('OrderConfirmationPage - final mapped order:', mapped)
        setOrder(mapped)
        setDiscount(Number(o.DiscountAmount ?? o.discountAmount ?? 0))
        
        // Reset payment link check flag when order changes
        setPaymentLinkCheckAttempted(false)
        // Reset creating new order flag when order changes
        setIsCreatingNewOrder(false)
        // Reset last error orderId if it's different from current order
        if (lastError231OrderId && lastError231OrderId !== mapped.orderId) {
          setLastError231OrderId(null)
        }
        
        // Check for existing payment link when order loads (user might have returned from PayOS)
        const orderData = o || {}
        const detectedPaymentLink = orderData.paymentLink || 
                                   orderData.checkoutUrl || 
                                   orderData.PayOSCheckoutUrl ||
                                   orderData.payosCheckoutUrl ||
                                   orderData.payOSLink ||
                                   orderData.paymentLinkUrl ||
                                   orderData.payment_url ||
                                   (orderData.payments && orderData.payments[0]?.checkoutUrl) ||
                                   (orderData.paymentInfo && orderData.paymentInfo.checkoutUrl)
        
        if (detectedPaymentLink && typeof detectedPaymentLink === 'string' && detectedPaymentLink.trim() !== '') {
          console.log('🔗 Found existing payment link in order data:', detectedPaymentLink)
          setExistingPaymentLink(detectedPaymentLink)
          
          // Check order status - if still pending/unpaid, show notification
          const orderStatus = orderData.status || orderData.Status || orderData.orderStatus
          const isPending = !orderStatus || 
                           orderStatus === 'PENDING' || 
                           orderStatus === 'UNPAID' ||
                           orderStatus === 'AWAITING_PAYMENT'
          
          if (isPending) {
            console.log('⏳ Order is still pending payment, payment link is available')
            toast('Đã có link thanh toán. Bạn có thể tiếp tục thanh toán bằng cách bấm nút thanh toán.', {
              duration: 5000,
              icon: '💳',
              style: {
                background: '#e3f2fd',
                color: '#1976d2'
              }
            })
          }
        } else {
          // ALWAYS try to get payment link from GET endpoint: GET /api/Order/{orderId}/payment/link
          console.log('🔍 No payment link in order data, trying GET endpoint: GET /api/Order/' + resolvedId + '/payment/link')
          try {
            const paymentLinkResp = await OrderService.getExistingPaymentLink(resolvedId)
            console.log('📥 GET payment/link response:', paymentLinkResp)
            
            if (paymentLinkResp?.success && paymentLinkResp?.checkoutUrl) {
              console.log('✅ Found payment link via GET endpoint:', paymentLinkResp.checkoutUrl)
              setExistingPaymentLink(paymentLinkResp.checkoutUrl)
              toast('Đã có link thanh toán. Bạn có thể tiếp tục thanh toán.', {
                duration: 5000,
                icon: '💳',
                style: {
                  background: '#e3f2fd',
                  color: '#1976d2'
                }
              })
            } else {
              console.log('ℹ️ GET endpoint returned success but no checkoutUrl:', paymentLinkResp)
              setExistingPaymentLink(null)
            }
          } catch (getLinkError: any) {
            // Endpoint might return 404 if payment link doesn't exist or expired
            const status = getLinkError?.response?.status
            console.log('ℹ️ GET /api/Order/' + resolvedId + '/payment/link returned:', status)
            
            if (status === 404) {
              // Payment link doesn't exist or has expired - this is okay, we'll create new one
              console.log('ℹ️ Payment link not found (404) - may need to create new link')
            } else {
              console.log('⚠️ GET payment/link failed with status:', status)
            }
            setExistingPaymentLink(null)
          }
        }
        
        // Log order data to check if payment link exists
        console.log('Order data check - paymentLink fields:', {
          paymentLink: o.paymentLink,
          checkoutUrl: o.checkoutUrl,
          PayOSCheckoutUrl: o.PayOSCheckoutUrl,
          payosCheckoutUrl: o.payosCheckoutUrl,
          payOSLink: o.payOSLink,
          detectedPaymentLink,
          existingPaymentLink: detectedPaymentLink || null
        })
      } catch (e: any) {
        toast.error(e?.userMessage || e?.message || 'Lỗi tải chi tiết đơn hàng')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderIdParam, location?.state?.orderId])

  // Load saved promotions of current customer - Hiển thị các mã chưa sử dụng (SAVED và APPLIED)
  // Không hiển thị USED (đã sử dụng = đã thanh toán thành công)
  useEffect(() => {
    const loadSaved = async () => {
      setLoadingPromos(true)
      try {
        console.log('🔄 OrderConfirmationPage: Loading saved promotions...')
        const me = await CustomerService.getCurrentCustomer()
        const cid = me?.data?.customerId
        if (!cid) {
          console.warn('⚠️ OrderConfirmationPage: No customerId available')
          setLoadingPromos(false)
          return
        }
        
        console.log('📡 OrderConfirmationPage: Loading promotions for customerId:', cid)
        // Use PromotionBookingService instead of PromotionService for saved promotions
        const promos = await PromotionBookingService.getCustomerPromotions(Number(cid))
        console.log('📦 OrderConfirmationPage: Promotions response:', promos)
        console.log('📦 OrderConfirmationPage: Response type:', Array.isArray(promos) ? 'array' : typeof promos)
        console.log('📦 OrderConfirmationPage: Response length:', Array.isArray(promos) ? promos.length : 'not array')
        
        if (Array.isArray(promos) && promos.length > 0) {
          // Hiển thị promotions có status = "SAVED" hoặc "APPLIED" (có thể sử dụng)
          // Không hiển thị "USED" (đã sử dụng) vì đây là trang confirm order, chỉ cần mã chưa dùng
          const availablePromos = promos.filter((p: any) => {
            const status = String(p.userPromotionStatus || p.status || '').toUpperCase()
            const isAvailable = status === 'SAVED' || status === 'APPLIED'
            console.log(`🔍 Promotion ${p.code}: status=${status}, isAvailable=${isAvailable}`)
            return isAvailable // Chỉ hiển thị mã có thể sử dụng
          })
          console.log('✅ OrderConfirmationPage: Available promotions count:', availablePromos.length)
          setSavedPromos(availablePromos)
        } else {
          console.log('ℹ️ OrderConfirmationPage: No promotions found or empty response')
          setSavedPromos([])
        }
      } catch (error: any) {
        console.error('❌ OrderConfirmationPage: Error loading saved promotions:', error)
        console.error('❌ Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        // Set empty array on error instead of silently ignoring
        setSavedPromos([])
      } finally {
        setLoadingPromos(false)
      }
    }
    loadSaved()
  }, [])

  // Load applied coupon code từ sessionStorage khi reload
  useEffect(() => {
    const orderId = order?.orderId || Number(sessionStorage.getItem('currentOrderId'))
    if (orderId) {
      const savedCoupon = sessionStorage.getItem(`appliedCoupon_${orderId}`)
      if (savedCoupon) {
        setCouponCode(savedCoupon)
      }
    }
  }, [order])

  const applyCoupon = async () => {
    const id = order?.orderId || Number(sessionStorage.getItem('currentOrderId'))
    if (!id) return
    if (!couponCode.trim()) {
      const msg = 'Vui lòng nhập mã khuyến mãi'
      setCouponError(msg)
      toast.error(msg)
      return
    }
    try {
      setApplying(true)
      // Chỉ validate để không đánh dấu sử dụng trước thanh toán
      const resp = await PromotionService.validatePublic(couponCode.trim(), order?.subtotal ?? 0, 'ORDER')
      if (resp?.success && (resp?.data?.isValid ?? true)) {
        const discountAmount = Number(resp?.data?.discountAmount ?? 0)
        setDiscount(discountAmount)
        if (order) {
          const newTotal = Math.max(0, order.subtotal - discountAmount)
          setOrder({ ...order, discount: discountAmount, total: newTotal, couponCode: couponCode.trim() })
        }
        setCouponError(null)
        // Lưu mã vào sessionStorage để giữ khi reload trang
        const orderId = order?.orderId || Number(sessionStorage.getItem('currentOrderId'))
        if (orderId) {
          sessionStorage.setItem(`appliedCoupon_${orderId}`, couponCode.trim())
          sessionStorage.setItem('pendingCouponCode', couponCode.trim())
        }
        toast.success('Mã hợp lệ. Sẽ áp dụng khi thanh toán thành công')
      } else {
        const msg = resp?.message || 'Không thể áp dụng mã khuyến mãi'
        setCouponError(msg)
        toast.error(msg)
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.userMessage || e?.message || 'Lỗi áp dụng mã khuyến mãi'
      setCouponError(msg)
      toast.error(msg)
    } finally {
      setApplying(false)
    }
  }

  const goToPayment = async () => {
    // Prevent duplicate calls
    if (processingPayment || isCreatingNewOrder) {
      console.log('Payment already processing or creating new order, ignoring duplicate call')
      return
    }

    const id = order?.orderId || Number(sessionStorage.getItem('currentOrderId'))
    if (!id) {
      toast.error('Không xác định được đơn hàng')
      return
    }

    // Prevent loop: Only block if we're in the process of creating a new order from THIS orderId
    // Don't block if this is a different/new order
    const recentlyCreatedOrderId = sessionStorage.getItem('recentlyCreatedOrderId')
    if (recentlyCreatedOrderId && Number(recentlyCreatedOrderId) === id && isCreatingNewOrder) {
      console.warn('⚠️ Prevented loop: This orderId is being processed for new order creation')
      toast.error('Đang xử lý đơn hàng mới. Vui lòng đợi...')
      return
    }

    setProcessingPayment(true)
    try {
      // Helper function để redirect đến PayOS
      // QUAN TRỌNG: Phải redirect NGAY LẬP TỨC, không chờ bất kỳ async operation nào
      const redirectToPayOS = (url: string) => {
        console.log('🚀 Redirecting to PayOS:', url)
        // Validate URL trước
        if (!url || typeof url !== 'string' || !url.trim() || !url.startsWith('http')) {
          console.error('❌ Invalid URL for redirect:', url)
          toast.error('Link thanh toán không hợp lệ')
          setProcessingPayment(false)
          return
        }
        
        const cleanUrl = url.trim()
        console.log('✅ Valid URL, redirecting immediately to:', cleanUrl)
        
        // Redirect ngay lập tức - KHÔNG gọi setState trước redirect
        // Sử dụng nhiều phương pháp để đảm bảo redirect hoạt động
        try {
          // Method 1: window.location.href (phổ biến nhất)
          console.log('🔄 Attempting redirect method 1: window.location.href')
          window.location.href = cleanUrl
          
          // Method 2: window.location.assign() (backup)
          // Thử ngay sau đó để đảm bảo
          setTimeout(() => {
            try {
              console.log('🔄 Attempting redirect method 2: window.location.assign (backup)')
              window.location.assign(cleanUrl)
            } catch (e2) {
              console.warn('⚠️ window.location.assign failed:', e2)
              // Method 3: window.location.replace() (last resort)
              try {
                console.log('🔄 Attempting redirect method 3: window.location.replace (last resort)')
                window.location.replace(cleanUrl)
              } catch (e3) {
                console.error('❌ All redirect methods failed:', e3)
                toast.error('Không thể chuyển hướng đến PayOS. Vui lòng thử lại.')
                setProcessingPayment(false)
              }
            }
          }, 50)
        } catch (e) {
          console.error('❌ Initial redirect failed:', e)
          // Fallback: Thử lại với assign
          try {
            window.location.assign(cleanUrl)
          } catch (e2) {
            try {
              window.location.replace(cleanUrl)
            } catch (e3) {
              console.error('❌ All redirect methods failed:', e3)
              toast.error('Không thể chuyển hướng đến PayOS. Vui lòng thử lại.')
              setProcessingPayment(false)
            }
          }
        }
      }

      // FIRST: Check if we already have a payment link in state (from order load)
      // This handles the case when user returns from PayOS
      if (existingPaymentLink && existingPaymentLink.trim() !== '') {
        console.log('✅ Using existing payment link from state, redirecting:', existingPaymentLink)
        redirectToPayOS(existingPaymentLink)
        return
      }
      
      // SECOND: ALWAYS try GET endpoint first: GET /api/Order/{orderId}/payment/link
      // This is the primary way to get existing payment link
      console.log('🔍 Checking for existing payment link via GET /api/Order/' + id + '/payment/link...')
      try {
        const paymentLinkResp = await OrderService.getExistingPaymentLink(id)
        console.log('📥 GET payment/link response:', paymentLinkResp)
        
        if (paymentLinkResp?.success && paymentLinkResp?.checkoutUrl) {
          const checkoutUrl = paymentLinkResp.checkoutUrl.trim()
          if (checkoutUrl && checkoutUrl.startsWith('http')) {
            console.log('✅ Found payment link via GET endpoint, redirecting:', checkoutUrl)
            // Redirect TRƯỚC, sau đó mới setState (nếu redirect thành công thì sẽ không đến đây)
            redirectToPayOS(checkoutUrl)
            // Set state sau redirect để không block redirect
            setTimeout(() => setExistingPaymentLink(checkoutUrl), 0)
            return
          } else {
            console.warn('⚠️ Invalid checkoutUrl format:', checkoutUrl)
          }
        } else {
          console.log('ℹ️ GET endpoint returned success but no checkoutUrl')
        }
      } catch (getLinkError: any) {
        const status = getLinkError?.response?.status
        console.log('ℹ️ GET /api/Order/' + id + '/payment/link returned:', status)
        
        if (status === 404) {
          // Payment link doesn't exist - we'll create new one below
          console.log('ℹ️ Payment link not found (404) - will create new payment link')
        } else {
          // Other error - try to get from order data as fallback
          console.log('⚠️ GET payment/link failed, trying order data as fallback...')
          
          try {
            const orderDetails = await OrderService.getOrderById(id)
            const orderData = orderDetails?.data || {}
            
            // Check for payment link in order data
            const detectedLink = orderData.paymentLink || 
                                orderData.checkoutUrl || 
                                orderData.PayOSCheckoutUrl ||
                                orderData.payosCheckoutUrl ||
                                orderData.payOSLink ||
                                orderData.paymentLinkUrl ||
                                orderData.payment_url ||
                                (orderData.payments && orderData.payments[0]?.checkoutUrl) ||
                                (orderData.paymentInfo && orderData.paymentInfo.checkoutUrl)
            
            if (detectedLink && typeof detectedLink === 'string' && detectedLink.trim() !== '' && detectedLink.startsWith('http')) {
              console.log('✅ Found payment link in order data fallback, redirecting:', detectedLink)
              const cleanLink = detectedLink.trim()
              redirectToPayOS(cleanLink)
              setTimeout(() => setExistingPaymentLink(cleanLink), 0)
              return
            }
          } catch (orderError) {
            console.log('⚠️ Could not get payment link from order data either')
          }
        }
      }
      // Nếu có coupon code đã validate, apply vào order trước khi checkout
      if (order?.couponCode && order.couponCode.trim()) {
        try {
          // Check if order already has a coupon applied (to avoid duplicate apply)
          const currentOrder = await OrderService.getOrderById(id)
          const currentCoupon = currentOrder?.data?.couponCode || currentOrder?.data?.CouponCode
          
          // Only apply if the coupon code is different from the one already applied
          if (!currentCoupon || currentCoupon !== order.couponCode.trim()) {
            console.log('Applying coupon to order:', order.couponCode.trim())
            const applyResult = await PromotionService.applyCouponToOrder(id, order.couponCode.trim())
            console.log('Coupon applied successfully:', applyResult)
          } else {
            console.log('Order already has this coupon applied, skipping apply step')
          }
        } catch (couponError: any) {
          const errorMsg = couponError?.response?.data?.message || couponError?.message
          // If error is about coupon already applied or invalid, log but continue
          if (errorMsg?.includes('đã được áp dụng') || errorMsg?.includes('đã tồn tại')) {
            console.log('Coupon already applied or order already has coupon, proceeding with checkout')
          } else {
          console.warn('Could not apply coupon, proceeding with checkout:', couponError)
          }
          // Tiếp tục với checkout ngay cả khi không apply được coupon
        }
      }

      // Tạo link thanh toán PayOS: POST /api/Order/{orderId}/checkout/online
      console.log('📞 Calling checkoutOnline for orderId:', id)
      try {
        const resp = await OrderService.checkoutOnline(id)
        console.log('📥 checkoutOnline response:', resp)
        console.log('📥 Response type:', typeof resp)
        console.log('📥 Response keys:', resp ? Object.keys(resp) : 'null')
        console.log('📥 Response stringified:', JSON.stringify(resp, null, 2))
        
        // Kiểm tra response structure - có thể response nằm trong data property
        // Cast to any để check nested properties
        const respAny = resp as any
        let checkoutUrl: string | null = null
        
        // Case 1: Response có checkoutUrl trực tiếp
        if (resp?.checkoutUrl) {
          checkoutUrl = String(resp.checkoutUrl).trim()
          console.log('✅ Found checkoutUrl in response root:', checkoutUrl)
        }
        // Case 2: Response có data.checkoutUrl
        else if (respAny?.data?.checkoutUrl) {
          checkoutUrl = String(respAny.data.checkoutUrl).trim()
          console.log('✅ Found checkoutUrl in response.data:', checkoutUrl)
        }
        // Case 3: Response là string URL trực tiếp (ít khả năng)
        else if (typeof resp === 'string') {
          const urlStr = (resp as string).trim()
          if (urlStr.startsWith('http')) {
            checkoutUrl = urlStr
            console.log('✅ Response is direct URL string:', checkoutUrl)
          }
        }
        
        // Kiểm tra và redirect
        if (checkoutUrl && checkoutUrl.startsWith('http')) {
          console.log('✅ Valid checkout URL found! Redirecting to PayOS:', checkoutUrl)
          // QUAN TRỌNG: Redirect TRƯỚC, không chờ setState
          redirectToPayOS(checkoutUrl)
          // Set state sau redirect (nếu redirect thành công thì sẽ không đến đây)
          setTimeout(() => setExistingPaymentLink(checkoutUrl), 0)
          return // Đảm bảo không chạy code phía dưới
        } else {
          // Không có checkoutUrl hợp lệ
          console.error('❌ No valid checkoutUrl in response')
          console.error('Response structure:', JSON.stringify(resp, null, 2))
          console.error('CheckoutUrl value:', checkoutUrl)
          
          const errorMsg = resp?.message || respAny?.data?.message || 'Không thể tạo link thanh toán'
          toast.error(errorMsg || 'Không thể lấy link thanh toán từ server. Vui lòng thử lại.')
          setProcessingPayment(false)
          return
        }
      } catch (checkoutError: any) {
        // Error will be handled in the outer catch block below
        throw checkoutError
      }
    } catch (error: any) {
      console.error('Error creating checkout link:', error)
      console.log('Full error response:', error?.response)
      console.log('Error response data:', error?.response?.data)
      console.log('Error status:', error?.response?.status)
      
      const errorResponse = error?.response?.data
      let errorCode = errorResponse?.code || errorResponse?.errorCode
      let errorMsg = errorResponse?.message || errorResponse?.desc || error?.userMessage || error?.message || 'Lỗi khi tạo link thanh toán'
      
      // Parse JSON từ error message nếu có (backend có thể trả về JSON string trong message)
      if (errorMsg && typeof errorMsg === 'string') {
        try {
          // Tìm JSON object trong message (format: Response: {"code":"231",...})
          const jsonMatch = errorMsg.match(/\{[^}]*"code"[^}]*\}/i)
          if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[0])
            if (parsedJson.code) {
              errorCode = String(parsedJson.code)
              console.log('Parsed error code from message:', errorCode)
            }
            if (parsedJson.desc) {
              errorMsg = parsedJson.desc
              console.log('Parsed error message from JSON:', errorMsg)
            }
          }
        } catch (parseError) {
          console.log('Could not parse JSON from error message')
        }
      }
      
      // Helper function để redirect đến PayOS (define lại để dùng trong catch block)
      const redirectToPayOS = (url: string) => {
        console.log('🚀 Redirecting to PayOS:', url)
        try {
          window.location.replace(url)
        } catch (replaceError) {
          console.warn('window.location.replace failed, trying window.location.href:', replaceError)
          window.location.href = url
        }
      }

      // Kiểm tra xem có checkoutUrl trong error response không (trường hợp backend trả về lỗi nhưng vẫn có URL)
      if (errorResponse?.checkoutUrl && typeof errorResponse.checkoutUrl === 'string' && errorResponse.checkoutUrl.trim() !== '' && errorResponse.checkoutUrl.startsWith('http')) {
        console.log('Found checkoutUrl in error response, redirecting to PayOS:', errorResponse.checkoutUrl)
        redirectToPayOS(errorResponse.checkoutUrl.trim())
        return
      }
      
      // Thử parse checkoutUrl từ error message (nếu backend trả về trong message)
      if (errorMsg && typeof errorMsg === 'string') {
        // Tìm URL PayOS trong error message (format: https://pay.payos.vn/web/...)
        const payosUrlMatch = errorMsg.match(/https?:\/\/[^\s"']+/i)
        if (payosUrlMatch && payosUrlMatch[0].includes('pay.payos.vn')) {
          console.log('Found PayOS URL in error message, redirecting:', payosUrlMatch[0])
          redirectToPayOS(payosUrlMatch[0])
          return
        }
      }
      
      // Backend đã tự động xử lý lỗi 231 và trả về checkoutUrl nếu có
      // Nếu vẫn nhận được lỗi, có thể backend chưa rebuild hoặc có vấn đề khác
      const PAYOS_ERROR_CODE_EXISTS = '231'
      const isPaymentExistsError = errorCode === PAYOS_ERROR_CODE_EXISTS || 
                                   String(errorCode) === PAYOS_ERROR_CODE_EXISTS ||
                                   errorMsg.includes('Đơn thanh toán đã tồn tại') || 
                                   errorMsg.includes('đã tồn tại') ||
                                   errorMsg.includes('payment link already exists') ||
                                   (errorResponse?.errorType === 'BUSINESS_RULE_VIOLATION' && errorMsg.includes('tồn tại'))
      
      if (isPaymentExistsError) {
        console.log('Payment link already exists (code 231), trying to get existing link...')
        console.log('Error response data:', errorResponse)
        
        try {
          // First, check if payment link exists anywhere in the error response structure
          const paymentLinkInResponse = errorResponse?.paymentLink || 
                                      errorResponse?.data?.paymentLink ||
                                      errorResponse?.data?.checkoutUrl ||
                                      errorResponse?.checkoutUrl ||
                                      errorResponse?.data?.payOSLink
          
          // Helper function để redirect (define lại trong scope này)
          const redirectToPayOS = (url: string) => {
            console.log('🚀 Redirecting to PayOS:', url)
            try {
              window.location.replace(url)
            } catch (replaceError) {
              console.warn('window.location.replace failed, trying window.location.href:', replaceError)
              window.location.href = url
            }
          }

          if (paymentLinkInResponse && typeof paymentLinkInResponse === 'string' && paymentLinkInResponse.trim() !== '' && paymentLinkInResponse.startsWith('http')) {
            console.log('✅ Found payment link in error response structure, redirecting to PayOS:', paymentLinkInResponse)
            setExistingPaymentLink(paymentLinkInResponse.trim()) // Save for future use
            redirectToPayOS(paymentLinkInResponse.trim())
            return
          }
          
          // Second, try GET endpoint to get existing payment link (PRIMARY METHOD)
          console.log('🔍 Trying GET /api/Order/' + id + '/payment/link to retrieve existing payment link...')
          try {
            const existingLinkResp = await OrderService.getExistingPaymentLink(id)
            console.log('📥 GET payment/link response:', existingLinkResp)
            
            if (existingLinkResp?.success && existingLinkResp?.checkoutUrl) {
              const checkoutUrl = existingLinkResp.checkoutUrl.trim()
              if (checkoutUrl && checkoutUrl.startsWith('http')) {
                console.log('✅ Found existing payment link via GET endpoint, redirecting to PayOS:', checkoutUrl)
                setExistingPaymentLink(checkoutUrl) // Save for future use
                redirectToPayOS(checkoutUrl)
                return
              }
            } else {
              console.log('ℹ️ GET endpoint returned but no checkoutUrl found')
            }
          } catch (getLinkError: any) {
            console.log('⚠️ GET payment/link failed:', getLinkError?.response?.status, getLinkError?.message)
            // Continue to next fallback method
          }
          
          // Third, try to get payment link from order details as fallback
          console.log('🔍 Trying to get payment link from order details (fallback)...')
          const orderDetails = await OrderService.getOrderById(id)
          const orderData = orderDetails?.data || {}
          
          const paymentLinkFromOrder = orderData.paymentLink || 
                                     orderData.checkoutUrl || 
                                     orderData.PayOSCheckoutUrl ||
                                     orderData.payosCheckoutUrl ||
                                     orderData.payOSLink ||
                                     orderData.paymentLinkUrl ||
                                     orderData.payment_url ||
                                     orderData.payOSCheckoutUrl ||
                                     orderData.PayOSLink ||
                                     (orderData.payments && Array.isArray(orderData.payments) && orderData.payments[0]?.checkoutUrl) ||
                                     (orderData.paymentInfo && orderData.paymentInfo.checkoutUrl) ||
                                     (orderData.payment && orderData.payment.checkoutUrl) ||
                                     (orderData.PaymentLink) ||
                                     (orderData.CheckoutUrl)
          
          if (paymentLinkFromOrder && typeof paymentLinkFromOrder === 'string' && paymentLinkFromOrder.trim() !== '' && paymentLinkFromOrder.startsWith('http')) {
            console.log('✅ Found payment link in order details, saving and redirecting to PayOS:', paymentLinkFromOrder)
            setExistingPaymentLink(paymentLinkFromOrder.trim()) // Save for future use
            redirectToPayOS(paymentLinkFromOrder.trim())
            return
          }
          
          console.log('⚠️ Payment link exists in PayOS - cannot retrieve it (GET endpoint returns 404)')
          console.log('📋 Current situation:')
          console.log('  - Order #' + id + ' has payment link in PayOS (backend confirms)')
          console.log('  - GET /api/Order/' + id + '/payment/link returns 404 (not implemented)')
          console.log('  - Payment link cannot be retrieved from order data')
          console.log('  - Backend blocks creating new payment link (error 231)')
          
          // Solution: Automatically create a NEW order with NEW orderId
          // Backend will mark old order as EXPIRED and allow new payment link for new order
          console.log('💡 Auto-creating new order with same items. Old order will be marked EXPIRED.')
          
          // Mark this orderId to prevent loop
          setLastError231OrderId(id)
          setIsCreatingNewOrder(true)
          
          // Automatically create new order with same items
          console.log('🔄 Auto-creating new order with same items...')
          
          try {
            // Get order items
            const orderItemsResp = await OrderService.getOrderItems(id)
            const orderItems = orderItemsResp?.data || []
            
            if (orderItems.length === 0) {
              toast.error('Không tìm thấy sản phẩm trong đơn hàng.')
              setIsCreatingNewOrder(false)
              setProcessingPayment(false)
              return
            }
            
            // Get customer ID
            const orderDetailsResp = await OrderService.getOrderById(id)
            const customerId = orderDetailsResp?.data?.customerId
            
            if (!customerId) {
              toast.error('Không tìm thấy thông tin khách hàng.')
              setIsCreatingNewOrder(false)
              setProcessingPayment(false)
              return
            }
            
            // Check if order was already created recently (prevent loop)
            const recentlyCreatedOrderId = sessionStorage.getItem('recentlyCreatedOrderId')
            if (recentlyCreatedOrderId && Number(recentlyCreatedOrderId) === id) {
              console.warn('⚠️ This order was just created, preventing loop')
              setIsCreatingNewOrder(false)
              setProcessingPayment(false)
              toast.error('Đơn hàng này vừa được tạo. Vui lòng đợi một chút rồi thử lại.')
              return
            }
            
            // Create new order with same items
            console.log('📦 Creating new order with items:', orderItems)
            toast.loading('Đang tạo đơn hàng mới...', { id: 'creating-order' })
            
            const newOrderPayload = {
              items: orderItems.map((item: any) => ({
                partId: item.partId || item.PartId,
                quantity: item.quantity || item.Quantity || 1
              })),
              notes: `Tạo lại từ đơn hàng #${id} (payment link không truy cập được)`
            }
            
            const newOrderResp = await OrderService.createQuickOrder(customerId, newOrderPayload)
            
            if (newOrderResp?.success) {
              const newOrderId = newOrderResp?.data?.orderId || newOrderResp?.data?.OrderId || newOrderResp?.data?.id
              
              if (newOrderId) {
                console.log('✅ New order created:', newOrderId)
                console.log('📝 Old order #' + id + ' should be marked as EXPIRED by backend')
                
                // Mark this new order as recently created to prevent immediate loop
                sessionStorage.setItem('recentlyCreatedOrderId', String(newOrderId))
                // Clear after 5 seconds
                setTimeout(() => {
                  sessionStorage.removeItem('recentlyCreatedOrderId')
                }, 5000)
                
                toast.dismiss('creating-order')
                toast.success(
                  `Đã tạo đơn hàng mới #${newOrderId}. Đang chuyển đến trang thanh toán...`,
                  {
                    duration: 3000,
                    icon: '✅'
                  }
                )
                
                // Instead of navigating and reloading, try to checkout the new order immediately
                // This will create payment link for the new order
                console.log('🔄 Attempting to checkout new order immediately:', newOrderId)
                
                // Update sessionStorage with new orderId
                sessionStorage.setItem('currentOrderId', String(newOrderId))
                
                // Clear flags and reset lastError231OrderId before attempting checkout
                setIsCreatingNewOrder(false)
                setLastError231OrderId(null) // Reset to allow normal checkout flow
                setProcessingPayment(true) // Keep processing payment flag for the checkout
                
                // Try to checkout the new order immediately
                try {
                  // Apply coupon if there was one
                  if (couponCode && couponCode.trim() !== '') {
                    try {
                      await PromotionService.applyCouponToOrder(newOrderId, couponCode)
                      console.log('✅ Coupon applied to new order')
                    } catch (couponError) {
                      console.warn('⚠️ Could not apply coupon to new order, proceeding anyway')
                    }
                  }
                  
                  // Create payment link for new order
                  console.log('💳 Creating payment link for new order:', newOrderId)
                  
                  try {
                    const checkoutResp = await OrderService.checkoutOnline(newOrderId)
                    console.log('📥 Checkout response for new order:', checkoutResp)
                    
                    // Response structure from orderService.checkoutOnline: { success, checkoutUrl, message?, code? }
                    const newPaymentLink = checkoutResp?.checkoutUrl
                    
                    // Helper function để redirect (trong scope này)
                    const redirectToPayOS = (url: string) => {
                      console.log('🚀 Redirecting to PayOS:', url)
                      try {
                        window.location.replace(url)
                      } catch (replaceError) {
                        console.warn('window.location.replace failed, trying window.location.href:', replaceError)
                        window.location.href = url
                      }
                    }

                    if (checkoutResp?.success && newPaymentLink && typeof newPaymentLink === 'string' && newPaymentLink.trim() !== '' && newPaymentLink.startsWith('http')) {
                      console.log('✅ Payment link created for new order, redirecting to PayOS:', newPaymentLink)
                      toast.dismiss('creating-order')
                      
                      // Save payment link to state
                      setExistingPaymentLink(newPaymentLink.trim())
                      
                      // Redirect to PayOS immediately (no delay)
                      redirectToPayOS(newPaymentLink.trim())
                      return
                    } else {
                      console.warn('⚠️ Checkout response:', {
                        success: checkoutResp?.success,
                        checkoutUrl: checkoutResp?.checkoutUrl,
                        message: checkoutResp?.message,
                        code: checkoutResp?.code
                      })
                      
                      // Try to get payment link from response (checkoutUrl is the only field in type)
                      const alternativeLink = checkoutResp?.checkoutUrl
                      
                      if (alternativeLink && typeof alternativeLink === 'string' && alternativeLink.trim() !== '' && alternativeLink.startsWith('http')) {
                        console.log('✅ Found payment link in alternative field, redirecting:', alternativeLink)
                        setExistingPaymentLink(alternativeLink.trim())
                        redirectToPayOS(alternativeLink.trim())
                        return
                      }
                      
                      // If no payment link found, try GET endpoint
                      console.log('🔍 No payment link in response, trying GET endpoint...')
                      try {
                        const existingLinkResp = await OrderService.getExistingPaymentLink(newOrderId)
                        if (existingLinkResp?.success && existingLinkResp?.checkoutUrl) {
                          const checkoutUrl = existingLinkResp.checkoutUrl.trim()
                          if (checkoutUrl && checkoutUrl.startsWith('http')) {
                            console.log('✅ Found payment link via GET endpoint:', checkoutUrl)
                            setExistingPaymentLink(checkoutUrl)
                            redirectToPayOS(checkoutUrl)
                            return
                          }
                        }
                      } catch (getLinkErr) {
                        console.warn('⚠️ GET endpoint also failed:', getLinkErr)
                      }
                      
                      // Final fallback: navigate to order page
                      toast.dismiss('creating-order')
                      toast.error('Không thể tạo link thanh toán. Đã tạo đơn hàng mới #' + newOrderId + '. Vui lòng thử lại.')
                      navigate(`/confirm-order`, { 
                        state: { orderId: newOrderId },
                        replace: true 
                      })
                      window.location.reload()
                      return
                    }
                  } catch (checkoutError: any) {
                    console.error('❌ Error checking out new order:', checkoutError)
                    console.error('Error details:', {
                      message: checkoutError?.message,
                      response: checkoutError?.response?.data,
                      status: checkoutError?.response?.status
                    })
                    
                    // Check if error response contains payment link
                    const errorResponse = checkoutError?.response?.data
                    const errorPaymentLink = errorResponse?.checkoutUrl || 
                                            errorResponse?.paymentLink ||
                                            errorResponse?.payOSLink
                    
                    if (errorPaymentLink && typeof errorPaymentLink === 'string' && errorPaymentLink.trim() !== '' && errorPaymentLink.startsWith('http')) {
                      console.log('✅ Found payment link in error response, redirecting:', errorPaymentLink)
                      setExistingPaymentLink(errorPaymentLink.trim())
                      redirectToPayOS(errorPaymentLink.trim())
                      return
                    }
                    
                    // Check if it's error 231 again (shouldn't happen but just in case)
                    const errorCode = errorResponse?.code || errorResponse?.errorCode
                    const errorMsg = errorResponse?.message || errorResponse?.desc || checkoutError?.message || ''
                    const isError231 = errorCode === '231' || String(errorCode) === '231' || 
                                     errorMsg.includes('Đơn thanh toán đã tồn tại')
                    
                    if (isError231) {
                      console.error('❌ New order also has error 231! This should not happen.')
                      toast.dismiss('creating-order')
                      toast.error('Lỗi: Đơn hàng mới vẫn gặp vấn đề thanh toán. Vui lòng liên hệ hỗ trợ.')
                    } else {
                      toast.dismiss('creating-order')
                      toast.error('Không thể tạo link thanh toán: ' + (errorMsg || 'Vui lòng thử lại'))
                    }
                    
                    // Navigate to new order page as fallback
                    navigate(`/confirm-order`, { 
                      state: { orderId: newOrderId },
                      replace: true 
                    })
                    window.location.reload()
                    return
                  }
                } catch (outerCheckoutError: any) {
                  // Handle any unexpected errors in the outer try block
                  console.error('❌ Unexpected error during checkout process:', outerCheckoutError)
                  toast.dismiss('creating-order')
                  toast.error('Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.')
                  navigate(`/confirm-order`, { 
                    state: { orderId: newOrderId },
                    replace: true 
                  })
                  window.location.reload()
                  return
                }
              } else {
                toast.dismiss('creating-order')
                toast.error('Tạo đơn hàng mới thành công nhưng không lấy được OrderId')
                setIsCreatingNewOrder(false)
                setProcessingPayment(false)
                return
              }
            } else {
              toast.dismiss('creating-order')
              toast.error(newOrderResp?.message || 'Không thể tạo đơn hàng mới')
              setIsCreatingNewOrder(false)
              setProcessingPayment(false)
              return
            }
          } catch (createError: any) {
            console.error('Error creating new order:', createError)
            toast.dismiss('creating-order')
            toast.error('Lỗi khi tạo đơn hàng mới: ' + (createError?.message || 'Vui lòng thử lại'))
            setIsCreatingNewOrder(false)
          setProcessingPayment(false)
            return
          }
        } catch (finalError: any) {
          console.error('❌ Error in payment exists handling:', finalError)
          toast.error('Không thể xử lý payment link. Vui lòng thử lại sau.')
          setProcessingPayment(false)
          return
        }
      }
      
      // Nếu không phải lỗi payment exists, hiển thị lỗi chung
      toast.error(errorMsg || 'Không thể tạo link thanh toán. Vui lòng thử lại sau.')
      setProcessingPayment(false)
    } finally {
      setProcessingPayment(false)
    }
  }

  // Luôn render layout cố định để tránh layout shift khi reload
  return (
    <div className="container confirm-order-page">
      <div className="page-title">Xác nhận đơn hàng</div>

      {loading ? (
        <div className="section section--spaced">
          <div className="section-title section-title--main">Chi tiết đơn hàng</div>
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p>Đang tải chi tiết đơn hàng...</p>
          </div>
        </div>
      ) : !order ? (
        <div className="section section--spaced">
          <div className="section-title section-title--main">Chi tiết đơn hàng</div>
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p>Không tìm thấy đơn hàng.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="section section--spaced">
            <div className="section-title section-title--main">Chi tiết đơn hàng</div>
        {order.items && order.items.length > 0 ? (
          <div className="items-list">
            {order.items.map((it, idx) => (
              <div key={idx} className="item-row">
                <div>
                  <div className="item-name">{it.name}</div>
                  <div className="item-meta">Số lượng: {it.quantity}</div>
                </div>
              <div className="text-right">
                  <div className="item-meta">Đơn giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(it.unitPrice)}</div>
                  <div className="price-text">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(it.totalPrice)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="item-meta" style={{ padding: '8px 0' }}>Chưa có sản phẩm trong đơn hàng</div>
        )}

            <div style={{ marginTop: 24 }}>
              <div className="section-title">Mã khuyến mãi</div>
              <div className="coupon-row">
                <input
                  className={`input${couponError ? ' input--error' : ''}`}
                  placeholder="Nhập mã khuyến mãi"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); if (couponError) setCouponError(null) }}
                />
                <button className="btn-primary" disabled={applying || loading} onClick={applyCoupon}>
                  {applying ? 'Đang áp dụng...' : 'Áp dụng'}
                </button>
              </div>
              {couponError && (
                <div className="item-meta" style={{ color: 'var(--error-600)', marginTop: 8, minHeight: '20px' }}>
                  {couponError}
                </div>
              )}
              {!couponError && <div style={{ minHeight: '20px', marginTop: 8 }}></div>}
              <div style={{ marginTop: 16 }}>
                <div className="item-meta" style={{ marginBottom: 8 }}>Mã đã lưu:</div>
                {loadingPromos ? (
                  <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center' }}>
                    <span className="item-meta" style={{ color: 'var(--text-secondary)' }}>Đang tải mã khuyến mãi...</span>
                  </div>
                ) : savedPromos && savedPromos.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: '36px' }}>
                    {savedPromos.map((p, i) => (
                      <button
                        key={`${p.code}-${i}`}
                        className="btn-primary"
                        style={{ padding: '6px 12px', borderRadius: 9999, backgroundColor: 'var(--secondary-500)', borderColor: 'var(--secondary-500)', fontSize: '13px' }}
                        onClick={() => { setCouponCode(String(p.code || '')); setCouponError(null) }}
                        title={p.description || `Giảm ${p.discountAmount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.discountAmount) : ''}`}
                      >
                        {p.code}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center' }}>
                    <span className="item-meta" style={{ color: 'var(--text-secondary)' }}>Chưa có mã khuyến mãi đã lưu</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="section section--spaced">
            <div className="section-title">Tổng kết</div>
            <div className="summary-row">
              <span>Tạm tính</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}</span>
            </div>
            <div className="summary-row" style={{ minHeight: '28px' }}>
              <span>Giảm giá</span>
              <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discount ?? discount ?? 0)}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Thành tiền</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}</span>
            </div>
          </div>

          {/* Payment link info banner */}
          {existingPaymentLink && (
            <div className="section" style={{
              background: 'var(--info-bg, #e3f2fd)',
              border: '1px solid var(--info-border, #90caf9)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--info-text, #1976d2)' }}>
                  💳 Link thanh toán đã sẵn sàng
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Bạn có thể tiếp tục thanh toán với session hiện tại. Nhấn nút bên dưới để chuyển đến PayOS.
                </div>
              </div>
            </div>
          )}

          <div className="actions">
            <button className="btn-primary" onClick={goToPayment} disabled={loading || processingPayment}>
              {processingPayment 
                ? 'Đang xử lý...' 
                : existingPaymentLink 
                  ? 'Tiếp tục thanh toán' 
                  : 'Xác nhận và tiếp tục thanh toán'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}



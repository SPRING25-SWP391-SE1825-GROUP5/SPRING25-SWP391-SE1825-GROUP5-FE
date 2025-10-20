# Service Booking Form Components

Giao diện đặt lịch dịch vụ với 6 bước theo yêu cầu, bao gồm validation và tích hợp API.

## Cấu trúc Components

### 1. ServiceBookingForm (Component chính)
- Quản lý state của toàn bộ form
- Điều hướng giữa các bước
- Xử lý submit cuối cùng

### 2. StepsProgressIndicator
- Hiển thị tiến trình 6 bước
- Màu sắc thay đổi theo trạng thái hoàn thành
- Cho phép click để điều hướng

### 3. Các Step Components

#### CustomerInfoStep (Bước 1)
- Thông tin khách hàng: Họ tên, SĐT, Email
- Validation real-time
- Character counter cho họ tên

#### VehicleInfoStep (Bước 2)
- Thông tin xe: Mẫu xe, Biển số, Số km
- Dropdown chọn mẫu xe
- Validation biển số xe

#### ServiceSelectionStep (Bước 3)
- Chọn dịch vụ: Bảo dưỡng, Sửa chữa, Đồng sơn
- Checkbox selection với chi tiết
- Ghi chú tùy chọn

#### LocationTimeStep (Bước 4)
- Địa điểm: Tỉnh thành, Phường/Xã
- Loại dịch vụ: Xưởng hoặc Lưu động
- Thời gian: Ngày và giờ

#### AccountStep (Bước 5 - Chỉ cho khách vãng lai)
- Tạo tài khoản mới
- Username và password validation
- Password strength indicator

#### ConfirmationStep (Bước 6)
- Xem lại toàn bộ thông tin
- Upload ảnh (tối đa 5 ảnh)
- Đồng ý điều khoản
- Submit cuối cùng

## Cách sử dụng

### 1. Import component
```tsx
import { ServiceBookingForm } from '@/components/booking'
```

### 2. Sử dụng trong view
```tsx
const BookingView = () => {
  return (
    <div>
      <ServiceBookingForm />
    </div>
  )
}
```

### 3. Tích hợp với API
```tsx
import { bookingService } from '@/services/bookingService'

// Lấy danh sách dịch vụ
const services = await bookingService.getServices()

// Tạo booking
const result = await bookingService.createBooking(bookingData)
```

## API Endpoints

### Booking Service
- `POST /bookings` - Tạo booking mới
- `GET /bookings/{id}` - Lấy thông tin booking
- `PUT /bookings/{id}/cancel` - Hủy booking
- `PUT /bookings/{id}/reschedule` - Đổi lịch booking

### Data Services
- `GET /vehicles/models` - Lấy danh sách mẫu xe
- `GET /locations/provinces` - Lấy danh sách tỉnh thành
- `GET /locations/provinces/{id}/wards` - Lấy danh sách phường/xã
- `GET /services` - Lấy danh sách dịch vụ
- `GET /bookings/time-slots` - Lấy khung giờ trống
- `GET /auth/check-username` - Kiểm tra username

## Validation Rules

### Customer Info
- Họ tên: 2-80 ký tự
- SĐT: 10-11 chữ số
- Email: Format hợp lệ

### Vehicle Info
- Mẫu xe: Bắt buộc
- Biển số: Format Việt Nam (VD: 30A12345)
- Số km: Số dương (tùy chọn)

### Service Selection
- Ít nhất 1 dịch vụ được chọn
- Ghi chú: Tối đa 500 ký tự

### Location & Time
- Tỉnh thành: Bắt buộc
- Phường/Xã: Bắt buộc
- Ngày: Không được là quá khứ
- Giờ: Trong khung giờ làm việc

### Account (Guest only)
- Username: 3-20 ký tự, chỉ chữ, số, gạch dưới
- Password: 6-50 ký tự, có chữ hoa, thường, số
- Confirm password: Khớp với password

## Styling

### Color Scheme
- Primary: #3b82f6 (Blue)
- Success: #10b981 (Green)
- Warning: #f59e0b (Yellow)
- Error: #ef4444 (Red)
- Gray: #6b7280

### Responsive Design
- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px
- Flexible grid layouts
- Touch-friendly interactions

## State Management

### Booking Data Structure
```typescript
interface BookingData {
  customerInfo: CustomerInfo
  vehicleInfo: VehicleInfo
  serviceInfo: ServiceInfo
  locationTimeInfo: LocationTimeInfo
  accountInfo?: AccountInfo
  images: File[]
}
```

### Step Validation
- Mỗi bước có validation riêng
- Chỉ cho phép chuyển bước khi hợp lệ
- Hiển thị lỗi real-time
- Progress indicator cập nhật theo trạng thái

## Features

### User Experience
- Smooth transitions giữa các bước
- Auto-save progress
- Responsive design
- Accessibility support
- Loading states
- Error handling

### Developer Experience
- TypeScript support
- Modular components
- Reusable validation
- API integration ready
- Easy customization
- Comprehensive documentation

## Customization

### Styling
- CSS-in-JS với styled-jsx
- CSS variables cho theming
- Responsive breakpoints
- Animation transitions

### Validation
- Custom validation rules
- Error messages
- Real-time feedback
- Form state management

### API Integration
- Configurable endpoints
- Error handling
- Loading states
- Retry mechanisms

## Troubleshooting

### Common Issues
1. **Import errors**: Kiểm tra path imports
2. **API errors**: Kiểm tra endpoint URLs
3. **Validation errors**: Kiểm tra data format
4. **Styling issues**: Kiểm tra CSS conflicts

### Debug Mode
```tsx
// Enable debug logging
localStorage.setItem('debug', 'booking:*')
```

## Future Enhancements

- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced validation
- [ ] Offline support
- [ ] Progressive Web App
- [ ] Analytics integration
- [ ] A/B testing
- [ ] Performance optimization


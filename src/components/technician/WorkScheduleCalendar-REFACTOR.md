# WorkScheduleCalendar CSS Refactor

## Tổng quan
Refactor toàn bộ CSS cho component `WorkScheduleCalendar` để tăng độ tương phản và đồng bộ màu sắc với hệ thống màu xanh lá.

## Các thay đổi đã thực hiện

### 1. Tiêu đề Lịch (CN, T2, T3...)
- **Background**: `var(--primary-500)` (#004030) - màu xanh lá chính của hệ thống
- **Text color**: `#FFFFFF` (trắng)
- **Font weight**: `700` (bold)
- **Border**: `#9CA3AF` (đậm hơn để tăng tương phản)

### 2. Ô Ngày "Ngoài" Tháng
- **Background**: `#D1D5DB` (xám đậm rõ rệt)
- **Text color**: `#6B7280` (xám mờ)
- **Pointer events**: `none` (vô hiệu hóa tương tác)

### 3. Ô Ngày "Trong" Tháng
- **Background mặc định**: `#FFFFFF` (trắng)
- **Hover effect**: `var(--primary-50)` (xanh lá nhạt)
- **Today highlight**: `var(--primary-50)` background với `var(--primary-500)` text

### 4. Chấm Lịch làm việc (Work Indicator)
- **Background**: `var(--primary-500)` (#004030) - màu xanh lá hệ thống
- **Size**: `0.5rem x 0.5rem`
- **Border radius**: `50%` (hình tròn)

### 5. Đường viền Lưới (Grid Borders)
- **Border color**: `#9CA3AF` (đậm hơn để tăng tương phản)
- **Grid border**: `#9CA3AF` cho toàn bộ grid
- **Day cell borders**: `#9CA3AF` cho tất cả các ô

## Màu sắc sử dụng

### Hệ thống màu chính
- `var(--primary-500)`: #004030 (xanh lá đậm)
- `var(--primary-50)`: #e6f2f0 (xanh lá nhạt)
- `#FFFFFF`: Trắng
- `#6B7280`: Xám mờ
- `#D1D5DB`: Xám đậm
- `#9CA3AF`: Xám border

### Trạng thái tương tác
- **Hover**: `var(--primary-50)` cho tất cả các ô trong tháng
- **Today**: `var(--primary-50)` background với `var(--primary-500)` text
- **Has schedule**: Trắng background với chấm xanh lá

## Cải thiện tương phản

1. **Tiêu đề**: Nền xanh đậm với chữ trắng bold
2. **Ô ngoài tháng**: Nền xám đậm với chữ xám mờ, không tương tác
3. **Ô trong tháng**: Nền trắng với hover xanh nhạt
4. **Borders**: Đậm hơn (#9CA3AF) để phân tách rõ ràng
5. **Work dots**: Màu xanh lá hệ thống thay vì teal

## Responsive Design
- Tất cả các thay đổi đều tương thích với responsive design hiện có
- Mobile breakpoint vẫn được duy trì ở 768px

## Browser Support
- Sử dụng CSS variables để tương thích với các trình duyệt hiện đại
- Fallback colors được cung cấp cho các trình duyệt cũ

## Testing
- Kiểm tra trên các kích thước màn hình khác nhau
- Đảm bảo tương phản đủ cho accessibility
- Test hover states và interactive elements

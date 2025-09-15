# CSS Module hóa và dọn dẹp legacy CSS

Tài liệu này mô tả các thay đổi đã thực hiện để module hóa CSS theo trang/component, loại bỏ các file CSS legacy ở public, và cách tiếp tục mở rộng về sau.

## Tổng quan
- Giữ global: `src/styles/global.scss` (import trong `src/main.tsx`) sử dụng `@use './legacy'` để có biến màu, utilities và Tailwind.
- Mỗi trang chính có file SCSS riêng, import trực tiếp trong TSX và scope bằng class wrapper để tránh rò rỉ style toàn cục.
- Đã xóa toàn bộ CSS legacy trong `public/css` sau khi thay thế bằng SCSS trong `src`.

## Các trang đã module hóa

### Auth
- Login
  - SCSS: `src/views/auth/login.scss`
  - Import: `src/views/auth/Login.tsx`
  - Wrapper scope: `.auth-page`
  - Lưu ý: các hover của nút và responsive cho layout login.

- Register
  - SCSS: `src/views/auth/register.scss`
  - Import: `src/views/auth/Register.tsx`
  - Wrapper scope: `.register-page`

### Services
- SCSS: `src/views/services.scss`
- Import: `src/views/Services.tsx`
- Wrapper scope: `.services-page`

### Booking
- SCSS: `src/views/booking/booking.scss`
- Import: `src/views/booking/Booking.tsx`
- Wrapper scope: `.booking-page`
- Gồm: hover/selected/disabled cho `time-slot`, reinforce `selectable`.

### Staff
- SCSS: `src/views/Staff/staff.scss`
- Import tại: `Customers.tsx`, `Appointments.tsx`, `ServiceOrders.tsx`
- Wrapper scope: `.staff-page`
- Responsive cho Appointments (control panel, filters, content grid...).

### Technician
- SCSS: `src/views/Technician/technician.scss`
- Import tại: `WorkQueue.tsx`, `Checklists.tsx`, `PartsRequest.tsx`
- Wrapper scope: `.technician-page`

### Customer
- SCSS: `src/views/Customer/customer.scss`
- Import tại: `MyVehicles.tsx`, `MaintenanceHistory.tsx`
- Wrapper scope: `.customer-page`
- Responsive cho MaintenanceHistory (filters, summary stats...).

### Dashboard
- SCSS: `src/views/Dashboard.scss`
- Import tại: `src/views/Dashboard.tsx`
- Wrapper scope: `.dashboard-page`

### Admin
- SCSS: `src/views/Admin/admin.scss`
- Import tại: `PartsManagement.tsx`, `Reports.tsx`, `StaffManagement.tsx`
- Wrapper scope: `.admin-page`

## Các file CSS đã xóa (public/css)
- `admin.css`
- `customer.css`
- `dashboard.css`
- `homepage-responsive.css`
- `login.css`
- `register.css`
- `services.css`
- `staff.css`
- `technician.css`

## Cách thêm style cho trang mới
1. Tạo file SCSS trong cùng thư mục với trang, ví dụ: `src/views/SomePage/SomePage.scss`.
2. Tạo class wrapper để scope, ví dụ: `.some-page { ... }`.
3. Import trong TSX: `import './SomePage.scss'` và thêm class wrapper vào root section/div của trang.
4. Dùng biến màu/utility từ `legacy.scss` (đã có qua `global.scss`).
5. Hạn chế thêm style global; nếu cần, cân nhắc đưa vào `legacy.scss` một cách có kiểm soát.

## Lưu ý xung đột
- Nếu có class trùng tên giữa các trang (ví dụ `.btn-primary`), ưu tiên dùng biến + utility sẵn có; hoặc bọc trong wrapper page để giới hạn phạm vi.
- Tránh import trực tiếp CSS từ `public`.

## Kiểm thử nhanh
- Chạy app và duyệt các trang: Login, Register, Services, Booking, Staff (3 trang), Technician (3 trang), Customer (2 trang), Dashboard, Admin (3 trang).
- Kiểm tra responsive < 768px cho các trang có rule.

## Mở rộng
- Có thể tách nhỏ SCSS theo component nếu trang lớn dần.
- Khi có rule dùng chung cho nhiều trang, cân nhắc tạo `src/styles/shared/*.scss` và import selective tại trang cần dùng.


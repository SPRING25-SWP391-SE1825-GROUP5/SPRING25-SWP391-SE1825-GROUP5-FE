## Quy tắc thiết kế Admin UI (chuẩn áp dụng toàn bộ trang Admin)

Phạm vi áp dụng: Tất cả trang trong khu vực Admin (Người dùng, Dịch vụ, Gói dịch vụ, Khuyến mãi, Trung tâm, Nhân sự/Staff, v.v.)

### 1) Màu sắc (Color System)
- **Accent (Primary)**: `#FFD875` (vàng nhạt)
  - Hover/overlay nhạt: `#FFF6D1`
- **Văn bản**: dùng token hệ thống
  - `var(--text-primary)` cho nội dung chính
  - `var(--text-secondary)` cho nội dung phụ, header bảng
  - `var(--text-tertiary)` cho icon mờ/placeholder
- **Đường viền**: `var(--border-primary)` (line mảnh 1px)
- **Trạng thái**:
  - Success: dot/nhấn xanh `var(--success-500)`; text/viền dùng cặp `--success-700`/`--success-200`
  - Error: dot/nhấn đỏ `var(--error-500)`; text/viền dùng cặp `--error-700`/`--error-200`
  - Info/Neutral: dùng hệ text/border mặc định

### 2) Typography
- Font-weight mặc định: 400 (không in đậm trừ tiêu đề cần nhấn mạnh)
- Kích thước khuyến nghị (scale nhẹ):
  - Tiêu đề trang: 28px – 32px
  - Subheading/toolbar: 14px – 16px
  - Bảng (th/td), nút, input: 13px – 14px
- Line-height: 1.4 – 1.5 (đảm bảo dễ đọc)

### 3) Spacing & Grid
- Hệ lưới 8px (multiples of 4/8): 4/8/12/16/20/24…
- Khoảng cách dọc trong bảng compact:
  - `th` và `td`: padding-y 6px; padding-x 10–12px

### 4) Toolbar & Bộ lọc
- Bố cục 2 hàng (chuẩn áp dụng theo hình 1):
  - Hàng trên (Top):
    - Trái: “Bảng | Bảng điều khiển | Danh sách” (chip không viền)
    - Giữa: Ô tìm kiếm gạch dưới (icon bên trái, underline focus màu `#FFD875`)
    - Phải: Actions “Ẩn | Tùy chỉnh | Xuất” + CTA chính “Thêm …” (CTA màu `#FFD875` đặt cùng hàng phải)
  - Hàng dưới (Bottom):
    - Trái: Các filter dạng pill (Ví dụ Users: Vai trò, Trạng thái. Service Packages: Trạng thái, Dịch vụ)
    - Phải: để trống (không đặt CTA ở hàng dưới)
  - Nút “chip”: nền trắng, không viền; hover nền `#f6f7f9`
  - CTA accent: nền `#FFD875`, hover có glow nhẹ (box-shadow vàng)
  - Không dùng nút "Làm mới" trong toolbar (nếu cần reload hãy tự động khi thay filter/loại bỏ).
  - Ô tìm kiếm: chỉ gạch dưới; khi focus có hiệu ứng gạch vàng chạy từ trái sang phải (`#FFD875`)

#### Quy ước riêng: Trang Gói Dịch vụ
- Bỏ hoàn toàn tiêu đề/khung "Danh sách Gói Dịch vụ" ở trên bảng (không có wrapper riêng, bảng hiển thị trực tiếp).
- Phân trang cuối trang dùng cùng layout với Users (icon-only, không viền; khối chứa phân trang không bo góc/không shadow).
- Cột "Tên gói": KHÔNG bật sort hoặc hành vi reload khi click; chỉ là tiêu đề tĩnh.
- Cột "Credits": KHÔNG sort/reload; căn trái; hiển thị một icon nhỏ (ví dụ `Zap`) trước số credits.
- Cột "Giá", "Trạng thái", "Thao tác": căn trái toàn bộ nội dung và tiêu đề.

### 5) Dropdown “Pill” (Headless)
- Hình con nhộng: border 1px, radius 8–999px, nền trắng
- Menu: bo tròn 12px, bóng nhẹ, item hover nền `#FFF6D1`
- Không có ô tìm trong menu; chỉ danh sách chọn
- Khi mở một dropdown, dropdown khác đóng lại

### 6) Bảng dữ liệu (không dùng card thống kê riêng)
- Nền trắng, bỏ bo góc (table/th/td đều `border-radius: 0`)
- Sử dụng `border-collapse: separate` + `border-spacing: 0`
- Header: nền trắng, chữ xám; có line trên và dưới; có line dọc giữa các cột
- Hàng:
  - Mỗi hàng có line phân cách ngang (1px `var(--border-primary)`)
  - Hover: nền `#FFF6D1`, chuyển động mượt; có thể nhô nhẹ `translateY(-1px)` + shadow nhỏ
- Căn trái toàn bộ nội dung (kể cả cột giá, thao tác)
- Cột đầu: checkbox chọn tất cả; checkbox 14px, bo 3px, `accent-color: #FFD875`
- Badge trạng thái/vai trò: nền trắng, viền vuông 1px, chỉ chấm tròn mang màu (dot)**
- Avatar/icon: tối giản; tránh icon thừa (ví dụ: không đặt icon cố định cạnh tên mục nếu không cần thiết)

### 7) Toolbar filter thay cho filter panel
- BẮT BUỘC xóa 2 phần sau khỏi các trang: (1) Card thống kê; (2) Khối filter riêng (form filter + nút “Đặt lại bộ lọc”).
- Toàn bộ tìm kiếm và lọc đặt trong `users-toolbar` (hàng trên + hàng dưới) bằng pill/dropdown + ô search gạch dưới.

### 8) Phân trang
- Layout 2 phía trong một hàng:
  - Trái: khối `pagination-info`
    - Label: “Hàng mỗi trang” (`.pagination-label`)
    - Dropdown chọn số hàng: `div.pill-select > button.pill-trigger + .caret` (Heroicon `ChevronDown`)
    - Menu: `ul.pill-menu > li.pill-item` (hover nền `#FFF6D1`, item active đổi màu chữ vàng)
    - Range: `span.pagination-range` hiển thị “a–b của N hàng”
  - Phải: `pagination-right-controls` gồm các nút icon-only: Đầu, Trước, trang 1, 2, …, N, Sau, Cuối
- Nút icon-only không viền, nền trắng; trạng thái `.is-disabled` nền xám nhạt; `.is-active` nền nhạt (`primary-50`)
- Container `pagination-controls-bottom`: `display:flex; justify-content:space-between; align-items:center; background:transparent; padding:8px 0; border:none; box-shadow:none`
- Dropdown `pill-select` tái sử dụng trên mọi trang Admin (Users/Services/Service Packages):
  - Kiến trúc headless: state `open`, ref `menuRef`, đóng khi click ra ngoài
  - Styles thống nhất: `pill-select`, `pill-menu show`, `pill-item active`

### 9) Form & Modal
- Input chỉ có border dưới; focus gạch vàng mảnh; width chuẩn 350px (trừ trường đặc biệt)
- Dùng `@mui/x-date-pickers` cho DatePicker; icon lịch bấm được; popper nhanh (ít animation)
- Modal: border 1px nhẹ, backdrop mờ nhẹ; header và footer có đường phân cách

### 10) Icon set
- Ưu tiên: **Heroicons** (Outline 24)
- Có thể bổ sung Lucide khi Heroicons không có biểu tượng tương đương (giữ phong cách dòng-outline thống nhất)

### 11) Quy tắc chung
- Không hardcode màu cục bộ; dùng CSS variable hiện có
- Không dùng inline-style cho layout/styling vĩnh viễn; chuyển sang SCSS module của trang
- Text tiếng Việt, thống nhất thuật ngữ; không dùng chữ in đậm trừ khi là tiêu đề/nhãn cần nhấn

---

Ghi chú triển khai
- Khi tạo trang Admin mới, sao chép cấu trúc toolbar + bảng từ một trang đã đạt chuẩn (Users/Services) và cập nhật class SCSS tương ứng.
- Nếu cần phần tử đặc thù (ví dụ: filter mới), giữ nguyên ngôn ngữ visual (pill, hover màu `#FFF6D1`).



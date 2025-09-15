---
title: "PROPOSAL DỰ ÁN: HỆ THỐNG QUẢN LÝ BẢO DƯỠNG XE ĐIỆN CHO TRUNG TÂM
  DỊCH VỤ"
---

# 1. Tóm tắt điều hành (Executive Summary)

Mục tiêu của dự án là xây dựng một nền tảng web giúp trung tâm dịch vụ
EV quản lý toàn bộ vòng đời bảo dưỡng/sửa chữa -- từ đặt lịch, tiếp
nhận, phân công kỹ thuật, theo dõi tiến độ, quản lý phụ tùng, đến lập
hóa đơn và báo cáo -- đồng thời cung cấp trải nghiệm minh bạch cho khách
hàng (theo dõi xe, nhắc lịch định kỳ, thanh toán online).

# 2. Bối cảnh & Vấn đề/Nỗi đau

\- Thiếu minh bạch với khách hàng về tiến độ, lịch sử bảo dưỡng, và chi
phí.

\- Lập lịch kỹ thuật viên thủ công gây quá tải/nhàn rỗi cục bộ.

\- Kiểm soát phụ tùng rời rạc, khó tối ưu lượng tồn tối thiểu dẫn tới
thiếu/đọng vốn.

\- Dữ liệu phân tán, báo cáo chậm; khó đo lường hiệu suất và lợi nhuận
theo dịch vụ.

# 3. Phạm vi & Chức năng theo nghiệp vụ

4.1 Khách hàng (Customer): nhắc bảo dưỡng theo km/thời gian, đặt lịch
online, theo dõi trạng thái, lịch sử & chi phí, thanh toán online.

4.2 Trung tâm dịch vụ (Staff/Technician/Admin): quản lý hồ sơ khách hàng
& xe (VIN, model), chat với KH, lập lịch & quản lý phiếu tiếp nhận, theo
dõi tiến độ, quản lý phụ tùng (tồn tối thiểu có AI gợi ý), phân công &
chấm công kỹ thuật, chứng chỉ chuyên môn, báo giá → hóa đơn → thanh
toán, báo cáo doanh thu/chi phí/lợi nhuận & thống kê hỏng hóc.

# 4. Điểm khác biệt/Đáng giá

\- AI gợi ý tồn tối thiểu & dự báo nhu cầu phụ tùng theo mùa, model xe,
lịch sử.

\- Lập lịch thông minh: phân bổ theo kỹ năng/chứng chỉ EV, tải công
việc, SLA.

\- Checklist EV số hóa theo model, tự động đề xuất hạng mục theo
DTC/triệu chứng.

\- OCR quét VIN/biển số từ ảnh, giảm nhập tay.

\- PWA/offline-first cho xưởng khi mạng chập chờn.

\- Dashboard thời gian thực cho quản lý & khách hàng.

# 5. Persona & Vai trò

\- Khách hàng (Customer)

\- Nhân viên lễ tân/Điều phối (Service Advisor/Dispatcher)

\- Kỹ thuật viên (Technician)

\- Quản lý trung tâm (Center Manager)

\- Quản trị hệ thống (Admin)

# 6. User Stories

**US1 - Đặt lịch dịch vụ**

Là Khách hàng, tôi muốn đặt lịch bảo dưỡng/sửa chữa online để chủ động
thời gian.

-   Có thể chọn trung tâm, loại dịch vụ, khung giờ trống.

-   Nhận email/SMS/Push xác nhận.

-   Không cho đặt trùng giờ.

    **US2 - Nhắc lịch định kỳ**

Là Khách hàng, tôi muốn nhận nhắc theo km/thời gian để không bỏ lỡ bảo
dưỡng.

-   Cấu hình tần suất/điều kiện nhắc.

-   Có nút đặt lịch trực tiếp từ thông báo.

    **US3 - Theo dõi trạng thái**

Là Khách hàng, tôi muốn xem trạng thái xe (chờ/đang làm/hoàn tất) theo
thời gian thực.

-   Hiển thị mốc thời gian & bước công việc.

-   Có lịch sử thay đổi trạng thái.

    **US4 - Lịch sử & chi phí**

Là Khách hàng, tôi muốn xem toàn bộ lịch sử bảo dưỡng và chi phí theo
từng lần.

-   Lọc theo ngày, dịch vụ, trung tâm.

-   Xuất PDF hóa đơn.

    **US5 - Thanh toán online**

Là Khách hàng, tôi muốn thanh toán qua ví/Banking.

-   Thanh toán an toàn theo chuẩn PCI DSS (tokenization).

-   Tự động phát hành hóa đơn khi thanh toán thành công.

    **US6 - Tiếp nhận yêu cầu**

Là Nhân viên, tôi muốn tiếp nhận và xác nhận/điều chỉnh yêu cầu đặt
lịch.

-   Xử lý chồng lịch, đề xuất khung giờ khác.

-   Gửi xác nhận cho KH.

    **US7 - Lập lịch kỹ thuật viên**

Là Điều phối, tôi muốn phân công theo skill, ca làm, tải hiện tại.

-   Tránh overbooking.

-   Cảnh báo nếu thiếu chứng chỉ EV cần thiết.

    **US8 - Phiếu tiếp nhận & Checklist EV**

Là Kỹ thuật viên, tôi muốn checklist theo model.

-   Checklist động theo DTC/triệu chứng.

-   Bắt buộc minh chứng ảnh/video ở bước quan trọng.

    **US9 - Theo dõi tiến độ**

Là Quản lý, tôi muốn bảng nhìn tiến độ theo bay/xe.

-   Kéo thả thay đổi bước; ghi log.

-   Cảnh báo trễ SLA.

    **US10 - Quản lý phụ tùng**

Là Kho, tôi muốn theo dõi tồn kho & định mức tối thiểu.

Tiêu chí chấp nhận:

-   Cảnh báo thấp hơn min.

-   Lịch sử nhập/xuất/điều chuyển.

    **US11 - AI dự báo ( Optional )**

Là Kho, tôi muốn AI gợi ý mua hàng theo nhu cầu dự báo.

-   Dự báo theo mùa/model/lịch sử.

-   Xuất đề xuất PO.

    **US12 - Chat với khách ( Optional )**

Là Nhân viên, tôi muốn chat nội bộ/ngoại bộ với KH.

-   Lưu transcript vào hồ sơ xe.

-   Hỗ trợ gửi ảnh/video.

    **US13 - Quản lý khách hàng & xe**

Là Nhân viên, tôi muốn hồ sơ KH & xe (VIN, model, lịch sử).

-   Tìm kiếm nhanh theo VIN/biển số.

-   OCR từ ảnh giấy tờ.

    **US14 - Báo giá → Hóa đơn**

Là Kế toán, tôi muốn quy trình báo giá, duyệt, phát hành hóa đơn.

-   Nhiều mức duyệt theo hạn mức.

-   Audit trail đầy đủ.

    **US15 - Thanh toán tại quầy**

Là Thu ngân, tôi muốn ghi nhận thanh toán offline.

-   Hỗ trợ split payment.

-   In hóa đơn, xuất PDF.

    **US16 - Nhân sự & chứng chỉ**

Là Quản lý, tôi muốn theo dõi ca làm & chứng chỉ.

-   Cảnh báo chứng chỉ sắp hết hạn.

-   Báo cáo hiệu suất theo kỹ thuật viên.

    **US17 - Báo cáo quản trị**

Là Quản lý, tôi muốn báo cáo doanh thu/chi phí/lợi nhuận & top dịch vụ.

-   Xuất CSV/XLSX.

-   Drill-down theo trung tâm/nhân sự/model.

    **US18 - Nhật ký & Audit**

Là Admin, tôi muốn audit mọi thay đổi dữ liệu.

-   Ghi người thực hiện, trước/sau.

-   Tìm kiếm & xuất báo cáo.

    **US20 - Thông báo đa kênh**

Là Người dùng, tôi muốn nhận thông báo qua email/SMS/Push.

-   Mẫu thông báo có thể cấu hình.

-   Tần suất/thời điểm chống spam.

    **US21 - Multi-branch ( chi nhánh )**

Là Tập đoàn, tôi muốn quản lý đa chi nhánh/kho.

-   Quy tắc chuyển kho liên chi nhánh.

-   Báo cáo hợp nhất & tách theo chi nhánh.

# 8. Kiến trúc & Công nghệ

Frontend:

Vue 3 + TypeScript + Vite

Backend:

Node.js + TypeScript (NestJS)

Prisma ORM (hỗ trợ cả MongoDB & SQL Server)

REST + WebSocket (Socket.IO).

Database: tùy chọn MongoDB hoặc SQL Server. Redis cho cache & queue.

Triển khai: Docker, GitHub Actions CI/CD → Staging/Prod.

# 10. Mô hình dữ liệu khái quát

Thực thể chính: Customer, Vehicle, ServiceOrder, ServiceItem,
Technician, Schedule, Part, InventoryTxn, Invoice, Payment,
ChecklistTemplate, ChecklistItem, ServiceCenter, User, Role,
ChatMessage, AuditLog.

# 14. Kế hoạch triển khai 3 tháng (6 sprint x 2 tuần)

Sprint 1: Khởi động, kiến trúc, auth/RBAC, skeleton FE/BE.

Sprint 2: Đặt lịch, hồ sơ KH & xe, OCR VIN cơ bản.

Sprint 3: Checklist EV, tiến độ realtime, chat.

Sprint 4: Quản lý phụ tùng, tồn tối thiểu, quy trình báo giá → hóa đơn.

Sprint 5: Dự báo phụ tùng, báo cáo quản trị.

Sprint 6: Fix Bug.

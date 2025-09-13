+---+-------------------+------------------+---------------------------+
| \ | Topic             | Primary Actors   | Functional Requirements   |
| # |                   |                  |                           |
+---+-------------------+------------------+---------------------------+
| 7 | **EV Service      | Customer         | 1\. Chức năng cho Khách   |
|   | Center            |                  | hàng (Customer)\          |
|   | Maintenance       | Staff            | a. Theo dõi xe & nhắc     |
|   | Management        |                  | nhở\                      |
|   | System**\         | Technican        | + Nhắc nhở bảo dưỡng định |
|   | Phần mềm quản lý  |                  | kỳ theo km hoặc thời      |
|   | bảo dưỡng xe điện | Admin            | gian.\                    |
|   | cho trung tâm     |                  | + Nhắc thanh toán gói bảo |
|   | dịch vụ           |                  | dưỡng định kỳ hoặc gia    |
|   |                   |                  | hạn gói dịch vụ.\         |
|   |                   |                  | b. Đặt lịch dịch vụ\      |
|   |                   |                  | + Đặt lịch bảo dưỡng/sửa  |
|   |                   |                  | chữa trực tuyến.\         |
|   |                   |                  | + Chọn trung tâm dịch vụ  |
|   |                   |                  | & loại dịch vụ.\          |
|   |                   |                  | + Nhận xác nhận & thông   |
|   |                   |                  | báo trạng thái (chờ --    |
|   |                   |                  | đang bảo dưỡng -- hoàn    |
|   |                   |                  | tất).\                    |
|   |                   |                  | c. Quản lý hồ sơ & chi    |
|   |                   |                  | phí\                      |
|   |                   |                  | + Lưu lịch sử bảo dưỡng   |
|   |                   |                  | xe điện.\                 |
|   |                   |                  | + Quản lý chi phí bảo     |
|   |                   |                  | dưỡng & sửa chữa theo     |
|   |                   |                  | từng lần.\                |
|   |                   |                  | + Thanh toán online       |
|   |                   |                  | (e-wallet, banking,       |
|   |                   |                  | \...).                    |
+---+-------------------+------------------+---------------------------+
|   |                   |                  | 2\. Chức năng cho Trung   |
|   |                   |                  | tâm dịch vụ (Staff,       |
|   |                   |                  | Technican, Admin)\        |
|   |                   |                  | a. Quản lý khách hàng &   |
|   |                   |                  | xe\                       |
|   |                   |                  | + Hồ sơ khách hàng & xe   |
|   |                   |                  | (model, VIN, lịch sử dịch |
|   |                   |                  | vụ).\                     |
|   |                   |                  | + Chat trực tuyến với     |
|   |                   |                  | khách hàng.\              |
|   |                   |                  | b. Quản lý lịch hẹn &     |
|   |                   |                  | dịch vụ\                  |
|   |                   |                  | + Tiếp nhận yêu cầu đặt   |
|   |                   |                  | lịch của khách hàng.\     |
|   |                   |                  | + Lập lịch cho kỹ thuật   |
|   |                   |                  | viên, quản lý hàng chờ.\  |
|   |                   |                  | + Quản lý phiếu tiếp nhận |
|   |                   |                  | dịch vụ & checklist EV.\  |
|   |                   |                  | c. Quản lý quy trình bảo  |
|   |                   |                  | dưỡng\                    |
|   |                   |                  | + Theo dõi tiến độ từng   |
|   |                   |                  | xe: chờ -- đang làm --    |
|   |                   |                  | hoàn tất.\                |
|   |                   |                  | + Ghi nhận tình trạng     |
|   |                   |                  | xe.\                      |
|   |                   |                  | d. Quản lý phụ tùng\      |
|   |                   |                  | + Theo dõi số lượng phụ   |
|   |                   |                  | tùng EV tại trung tâm.\   |
|   |                   |                  | + Kiểm soát lượng tồn phụ |
|   |                   |                  | tùng tối thiểu.\          |
|   |                   |                  | + AI gợi ý nhu cầu phụ    |
|   |                   |                  | tùng thay thế để đề xuất  |
|   |                   |                  | lượng tồn phụ tùng tối    |
|   |                   |                  | thiểu cho trung tâm\      |
|   |                   |                  | e. Quản lý nhân sự\       |
|   |                   |                  | + Phân công kỹ thuật viên |
|   |                   |                  | theo ca/lịch.\            |
|   |                   |                  | + Theo dõi hiệu suất,     |
|   |                   |                  | thời gian làm việc.\      |
|   |                   |                  | + Quản lý chứng chỉ       |
|   |                   |                  | chuyên môn EV.\           |
|   |                   |                  | f. Quản lý tài chính &    |
|   |                   |                  | báo cáo\                  |
|   |                   |                  | + Báo giá dịch vụ → hóa   |
|   |                   |                  | đơn → thanh toán          |
|   |                   |                  | (online/offline).\        |
|   |                   |                  | + Quản lý doanh thu, chi  |
|   |                   |                  | phí, lợi nhuận.\          |
|   |                   |                  | + Thống kê loại dịch vụ   |
|   |                   |                  | phổ biến, xu hướng hỏng   |
|   |                   |                  | hóc EV.                   |
+---+-------------------+------------------+---------------------------+

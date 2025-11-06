# UT Auto Login

Tự động đăng nhập vào các hệ thống của Trường ĐH Giao thông Vận tải TP.HCM:
- portal.ut.edu.vn
- courses.ut.edu.vn
- thnn.ut.edu.vn

Tiện ích mở rộng cung cấp đăng nhập một chạm, tự gia hạn phiên đăng nhập, và giao diện popup để quản lý tài khoản.

## Tính năng chính
- Đăng nhập nhanh ngay trong popup bằng tài khoản UT, hiển thị thông tin hồ sơ cơ bản (họ tên, MSSV, email, ngành, khóa).
- Tự động duy trì phiên.
- Tự động đăng nhập Courses/THNN.
- Tự đồng bộ với Portal
- Theo dõi đăng xuất.
- Bật/Tắt tiện ích.
- Đăng xuất từ popup.

## Cài đặt ở chế độ Nhà phát triển (Developer mode)
Áp dụng cho trình duyệt Chromium như Chrome và Microsoft Edge.

### Cách 1: Tải mã nguồn (khuyến nghị)
1) Tải về hoặc clone kho mã này vào máy của bạn.
2) Mở trình duyệt:
   - Chrome: truy cập `chrome://extensions`.
   - Edge: truy cập `edge://extensions`.
3) Bật Developer mode (Chế độ nhà phát triển).
4) Chọn "Load unpacked" (Tải tiện ích chưa đóng gói) và trỏ tới thư mục `ut-auto-login` (thư mục chứa file `manifest.json`).
5) Ghim icon tiện ích lên thanh công cụ để sử dụng nhanh.

### Cách 2: Tải ZIP
1) Tải ZIP của dự án, giải nén ra một thư mục.
2) Thực hiện lại các bước 2–5 như trên và chọn tới thư mục vừa giải nén.

## Cách sử dụng
1) Nhấp vào biểu tượng tiện ích UT Auto Login để mở popup.
2) Bật công tắc để kích hoạt tiện ích (nếu đang tắt).
3) Nhập tài khoản/mật khẩu UT rồi nhấn Đăng nhập. Nếu thành công, popup sẽ hiển thị hồ sơ của bạn.
4) Mở các trang:
   - portal.ut.edu.vn
   - courses.ut.edu.vn
   - thnn.ut.edu.vn
   Tiện ích sẽ tự động thực hiện đăng nhập/duy trì phiên.
5) Khi cần, nhấn Đăng xuất trong popup để xóa token hiện tại.

Mẹo:
- Sau khi cài đặt lần đầu, hãy refresh trang web UT đang mở để tiện ích hoạt động đầy đủ.
- Bạn có thể tắt tiện ích tạm thời bằng công tắc trong popup.

## Khắc phục sự cố (Troubleshooting)
- Không tự đăng nhập được trên Portal/Courses/THNN:
  - Hãy thử refresh trang. Đảm bảo bạn đã đăng nhập trong popup.
- Không thấy icon thay đổi khi bật/tắt:
  - Đảm bảo đã ghim icon và cho phép tiện ích chạy trên site UT.

# UT Auto Login

Tự động đăng nhập vào các hệ thống của Trường ĐH Giao thông Vận tải TP.HCM:
- portal.ut.edu.vn (Cổng thông tin)
- courses.ut.edu.vn (Moodle)
- thnn.ut.edu.vn

Tiện ích mở rộng cung cấp đăng nhập một chạm, tự gia hạn phiên đăng nhập, và giao diện popup để quản lý tài khoản.

## Tính năng chính
- Đăng nhập nhanh ngay trong popup bằng tài khoản UT, hiển thị thông tin hồ sơ cơ bản (họ tên, MSSV, email, ngành, khóa).
- Tự động duy trì phiên: kiểm tra token định kỳ và tự đăng nhập lại khi cần (chạy nền bằng Service Worker).
- Tự động đăng nhập Moodle/thnn: tự chèn `?token=...` vào URL và xóa tham số khi đã đăng nhập thành công.
- Tự đồng bộ với portal: ghi `account`/`role` vào `localStorage` của portal và tự reload an toàn một lần khi cần.
- Theo dõi đăng xuất: nếu bị xóa `account` trên portal, tiện ích sẽ tự đăng nhập lại (nếu có thông tin đã lưu).
- Bật/Tắt tiện ích: có công tắc trong popup, biểu tượng thay đổi theo trạng thái.
- Đăng xuất từ popup: xóa token/thông tin hồ sơ đã lưu.

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

## Cấu trúc thư mục
- `manifest.json` — Khai báo tiện ích (MV3), quyền truy cập, scripts, popup, icon.
- `background.js` — Service Worker: xử lý đăng nhập qua API proxy, quản lý token, kiểm tra hiệu lực, tự đổi icon theo trạng thái.
- `content.js` — Script cho `courses.ut.edu.vn` và `thnn.ut.edu.vn`: tự chèn token vào URL, kiểm tra trạng thái đăng nhập, thử lại theo chu kỳ.
- `portal_content.js` — Script cho `portal.ut.edu.vn`: đồng bộ token vào `localStorage`, tự reload an toàn, tự phục hồi khi bị đăng xuất.
- `popup.html` / `popup.css` / `popup.js` — Giao diện popup: form đăng nhập, hiển thị hồ sơ, công tắc bật/tắt, đăng xuất.
- `icons/` — Biểu tượng tiện ích (có icon khi bật/tắt).

## Quyền và tên miền được phép
Khai báo trong `manifest.json`:
- `permissions`: `storage`, `cookies`, `tabs`, `alarms`, `scripting`.
- `host_permissions`:
  - `https://portal.ut.edu.vn/*`
  - `https://courses.ut.edu.vn/*`
  - `https://thnn.ut.edu.vn/*`
  - `https://api.ngnsusinn.io.vn/*` (API proxy dùng cho đăng nhập và lấy hồ sơ)

## Riêng tư & bảo mật
- Thông tin đăng nhập (username/password), token, và hồ sơ người dùng được lưu trong `chrome.storage.local` của trình duyệt bạn. Dữ liệu này nằm cục bộ trên máy của bạn; dự án không tự mã hóa bổ sung ngoài cơ chế lưu trữ của trình duyệt.
- Việc xác thực/hồ sơ gọi tới endpoint proxy: `https://api.ngnsusinn.io.vn/ut-proxy/…` qua HTTPS.
- Tiện ích chỉ có `host_permissions` tới các tên miền UT và API proxy nêu trên, không gửi dữ liệu tới các bên khác.

Khuyến nghị: Không dùng trên máy công cộng. Hãy đăng xuất khi không sử dụng hoặc tắt tiện ích.

## Khắc phục sự cố (Troubleshooting)
- Không tự đăng nhập được trên Moodle/thnn:
  - Hãy thử refresh trang. Đảm bảo bạn đã đăng nhập trong popup và token còn hiệu lực.
  - Kiểm tra cài đặt chặn cookie; Moodle cần cookie phiên (ví dụ `MoodleSession`).
- Portal liên tục reload 1 lần rồi dừng: đây là hành vi bình thường khi tiện ích đồng bộ token vào `localStorage` lần đầu. Nếu vòng lặp bất thường, thử xóa `sessionStorage` key `ut_auto_login_reloaded_once` rồi reload lại trang portal.
- Popup báo token hết hạn:
  - Nhấn Đăng xuất rồi đăng nhập lại.
  - Đảm bảo kết nối tới `api.ngnsusinn.io.vn` không bị chặn.
- Không thấy icon thay đổi khi bật/tắt:
  - Đảm bảo đã ghim icon và cho phép tiện ích chạy trên site UT.

## Phát triển/Đóng góp
- Issues/PRs được hoan nghênh. Vui lòng mô tả rõ bối cảnh, bước tái hiện và log (nếu có).
- Mã nguồn sử dụng Manifest V3; kiểm tra console (DevTools) của trang/Service Worker khi debug.

## Giấy phép
Chưa khai báo giấy phép. Nếu bạn là tác giả, hãy thêm file `LICENSE` (ví dụ MIT) để xác định điều khoản sử dụng.

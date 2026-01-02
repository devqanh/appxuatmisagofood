# Gofood - Xuất Excel Phiếu Nhập Kho

Ứng dụng desktop được xây dựng bằng Electron để xuất dữ liệu phiếu nhập kho từ hệ thống Gofood ra file Excel.

## Tính năng

- Kết nối với API Gofood thông qua Authorization Token
- Tự động tải danh sách tất cả chi nhánh
- Lấy dữ liệu phiếu nhập kho theo khoảng thời gian
- Hỗ trợ phân trang tự động để tải hết dữ liệu
- Hiển thị tiến trình tải dữ liệu realtime
- Thống kê số lượng chi nhánh và phiếu nhập
- Hiển thị log chi tiết quá trình xử lý
- Xuất dữ liệu ra file Excel với định dạng chuyên nghiệp
- Giao diện đẹp, hiện đại và dễ sử dụng

## Cài đặt

1. Cài đặt Node.js (phiên bản 16 trở lên)
2. Clone hoặc tải project về
3. Mở terminal tại thư mục project
4. Cài đặt dependencies:

```bash
npm install
```

## Chạy ứng dụng

```bash
npm start
```

## Build ứng dụng

Để build ứng dụng thành file .exe:

```bash
npm run build
```

File .exe sẽ được tạo trong thư mục `release/GofoodExportExcel-win32-x64/`

File chạy: `GofoodExportExcel.exe`

## Hướng dẫn sử dụng

1. **Nhập thông tin kết nối:**
   - Authorization Token: Nhập Bearer token từ hệ thống
   - Company Code: Mặc định là "thucphamnhapkhau"
   - Chọn khoảng thời gian cần xuất dữ liệu

2. **Tải dữ liệu:**
   - Nhấn nút "Tải dữ liệu"
   - Ứng dụng sẽ tự động:
     - Tải danh sách chi nhánh
     - Tải dữ liệu phiếu nhập kho từng chi nhánh
     - Hiển thị tiến trình và log

3. **Xuất Excel:**
   - Sau khi tải xong, nhấn nút "Xuất Excel"
   - Chọn vị trí lưu file
   - File Excel sẽ được tạo với đầy đủ dữ liệu

## Cấu trúc dữ liệu Excel

File Excel xuất ra bao gồm các cột:
- Mã phiếu
- Ngày nhập
- Chi nhánh
- Loại phiếu
- Diễn giải
- Đối tượng
- Tổng tiền
- Từ chi nhánh
- Lý do

## Yêu cầu hệ thống

- Windows 10 trở lên
- RAM: 4GB trở lên
- Kết nối Internet

## Công nghệ sử dụng

- Electron - Framework xây dựng ứng dụng desktop
- Axios - HTTP client để gọi API
- ExcelJS - Thư viện xuất Excel
- HTML/CSS/JavaScript - Giao diện người dùng

## Lưu ý

- Authorization Token có thời hạn, cần cập nhật token mới khi hết hạn
- Với số lượng dữ liệu lớn, quá trình tải có thể mất vài phút
- Đảm bảo có kết nối Internet ổn định khi sử dụng

## Hỗ trợ

Nếu gặp vấn đề, vui lòng liên hệ bộ phận IT.

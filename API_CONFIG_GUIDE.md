# Hướng dẫn sử dụng ApiConfig Module

## Tổng quan

Module `apiConfig.js` được tạo ra để tập trung quản lý việc xây dựng URL API dựa trên `companyCode`. Thay vì hardcode URL `https://thucphamnhapkhau.mshopkeeper.vn/backendg1/api` ở nhiều nơi, giờ đây chỉ cần truyền `companyCode` và module sẽ tự động xây dựng URL phù hợp.

## Lợi ích

1. **Tập trung hóa**: Tất cả logic xây dựng URL được quản lý ở một nơi
2. **Dễ bảo trì**: Khi cần thay đổi cấu trúc URL, chỉ cần sửa ở một file
3. **Linh hoạt**: Dễ dàng thay đổi `companyCode` mà không cần sửa code nhiều nơi
4. **Tái sử dụng**: Các hàm tiện ích có thể dùng lại cho nhiều API khác nhau

## Cách sử dụng

### 1. Import module

```javascript
const ApiConfig = require('./apiConfig');
```

### 2. Lấy Base URL

```javascript
// Trước đây (hardcode):
const url = 'https://thucphamnhapkhau.mshopkeeper.vn/backendg1/api';

// Bây giờ (dynamic):
const url = ApiConfig.getBaseUrl('thucphamnhapkhau');
// Kết quả: 'https://thucphamnhapkhau.mshopkeeper.vn/backendg1/api'

// Với company code khác:
const url2 = ApiConfig.getBaseUrl('congtykhac');
// Kết quả: 'https://congtykhac.mshopkeeper.vn/backendg1/api'
```

### 3. Xây dựng URL cho API Stocks (danh sách chi nhánh)

```javascript
// Trước đây:
const url = 'https://thucphamnhapkhau.mshopkeeper.vn/backendg1/api/Stocks?page=1&start=0&limit=50';

// Bây giờ:
const url = ApiConfig.getStocksUrl('thucphamnhapkhau', { 
  page: 1, 
  start: 0, 
  limit: 50 
});
```

### 4. Xây dựng URL cho API Documents (phiếu nhập/xuất kho)

```javascript
// Trước đây:
const filter = [...]; // filter array
const url = `https://thucphamnhapkhau.mshopkeeper.vn/backendg1/api/INInwards?page=1&start=0&limit=50&filter=${encodeURIComponent(JSON.stringify(filter))}`;

// Bây giờ:
const filter = ApiConfig.createDateFilter('2025-12-01T00:00:00', '2025-12-31T23:59:59');
const url = ApiConfig.getDocumentUrl('thucphamnhapkhau', 'INInwards', { 
  page: 1, 
  limit: 50, 
  filter 
});
```

### 5. Xây dựng Headers

```javascript
// Trước đây:
const headers = {
  'Authorization': `Bearer ${token}`,
  'CompanyCode': 'thucphamnhapkhau',
  'X-MISA-BranchID': branchID
};

// Bây giờ:
const headers = ApiConfig.buildHeaders(token, 'thucphamnhapkhau', branchID);
```

### 6. Tạo Date Filter

```javascript
// Trước đây:
const filter = [
  {
    "xtype": "filter",
    "property": "RefDate",
    "operator": 4,
    "value": "2025-12-01T00:00:00",
    "type": 2,
    "group": "RefDate"
  },
  {
    "xtype": "filter",
    "property": "RefDate",
    "operator": 3,
    "value": "2025-12-31T23:59:59",
    "type": 2,
    "addition": 1,
    "group": "RefDate"
  }
];

// Bây giờ:
const filter = ApiConfig.createDateFilter('2025-12-01T00:00:00', '2025-12-31T23:59:59');
```

## Ví dụ thực tế

### Ví dụ 1: Lấy danh sách chi nhánh

```javascript
const ApiConfig = require('./apiConfig');
const axios = require('axios');

async function fetchBranches(authorization, companyCode) {
  const url = ApiConfig.getStocksUrl(companyCode);
  const headers = ApiConfig.buildHeaders(
    authorization, 
    companyCode, 
    '00000000-0000-0000-0000-000000000000'
  );
  
  const response = await axios.get(url, { headers });
  return response.data;
}
```

### Ví dụ 2: Lấy phiếu nhập kho

```javascript
async function fetchInwards(authorization, companyCode, branchID, startDate, endDate) {
  const filter = ApiConfig.createDateFilter(startDate, endDate);
  const url = ApiConfig.getDocumentUrl(companyCode, 'INInwards', { 
    page: 1, 
    limit: 50, 
    filter 
  });
  const headers = ApiConfig.buildHeaders(authorization, companyCode, branchID);
  
  const response = await axios.get(url, { headers });
  return response.data;
}
```

## API Reference

### `ApiConfig.getBaseUrl(companyCode)`
- **Tham số**: `companyCode` (string) - Mã công ty
- **Trả về**: Base URL của API
- **Ví dụ**: `ApiConfig.getBaseUrl('thucphamnhapkhau')` → `'https://thucphamnhapkhau.mshopkeeper.vn/backendg1/api'`

### `ApiConfig.buildUrl(companyCode, endpoint, params)`
- **Tham số**: 
  - `companyCode` (string) - Mã công ty
  - `endpoint` (string) - Endpoint path
  - `params` (object) - Query parameters (optional)
- **Trả về**: URL đầy đủ
- **Ví dụ**: `ApiConfig.buildUrl('thucphamnhapkhau', 'Stocks', { page: 1 })`

### `ApiConfig.buildHeaders(authorization, companyCode, branchID)`
- **Tham số**:
  - `authorization` (string) - Bearer token
  - `companyCode` (string) - Mã công ty
  - `branchID` (string, optional) - ID chi nhánh
- **Trả về**: Headers object
- **Ví dụ**: `ApiConfig.buildHeaders(token, 'thucphamnhapkhau', branchID)`

### `ApiConfig.getStocksUrl(companyCode, options)`
- **Tham số**:
  - `companyCode` (string) - Mã công ty
  - `options` (object) - {page, start, limit}
- **Trả về**: URL cho API Stocks
- **Ví dụ**: `ApiConfig.getStocksUrl('thucphamnhapkhau', { page: 1, limit: 50 })`

### `ApiConfig.getDocumentUrl(companyCode, documentType, options)`
- **Tham số**:
  - `companyCode` (string) - Mã công ty
  - `documentType` (string) - 'INInwards' hoặc 'Outwards'
  - `options` (object) - {page, limit, filter}
- **Trả về**: URL cho API Documents
- **Ví dụ**: `ApiConfig.getDocumentUrl('thucphamnhapkhau', 'INInwards', { page: 1, limit: 50 })`

### `ApiConfig.createDateFilter(startDate, endDate)`
- **Tham số**:
  - `startDate` (string) - Ngày bắt đầu (ISO format)
  - `endDate` (string) - Ngày kết thúc (ISO format)
- **Trả về**: Filter array
- **Ví dụ**: `ApiConfig.createDateFilter('2025-12-01T00:00:00', '2025-12-31T23:59:59')`


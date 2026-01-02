const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const axios = require('axios');
const ExcelJS = require('exceljs');
const fs = require('fs');
const ApiConfig = require('./apiConfig');

let mainWindow;
let configPath;
const defaultToken = 'aAFFgzhZk8EfSI2OEq2NZeNgbW5Kjy6zb4SodOAXJrHeCiR1bRcCKG0eo6UHc7cwVAhr4FBU-HIHL_HYQYjoOERCLgvZ3FXJTCej7Lp4HuXVG1aLZF7pH7-K7RAqCa58ov5s1MCLDAqeeiJNXoBcnHdcgEA6hcyJX-GXsJOKMtvXygkypvlHsadx_Zvp-pr8oNIFZx-Jutqyyz1PVDRwPWQEggWCmGicV7moo2JGfwwjsliN1p1-rMGCe9I5C36eUINtwYU-xGflBV2IiSR0sBrsVnXKQsgWmsCeUM9kLE3EJ67B159ZZvFNJnxq-Z-SRuw3ZZr3_ObhLJm7c7WkCCxGTg37iOf00xWhSbXO10TBD95L7w3-BPHRgz04LW1OUAKxZ8iKKP1GSo8oxID0ajT9fbRSu851VjmSgujQw59DX2d1W5wUBtJEvsd8YjALvATQ0oKPkrTDCQIAUEq0oEzs6_3_B3M8t4VBoPCsymHdAqf8gbYyXf2vEInUH-0CH-T8pDL2dDntQr_F5UDKeuQJPrTVzIJOoPE21GmqaP_DCzPGo5-Uvm7gynk2d16ubzpsnhYMp06YAv49IKXc_Uy4iubspvFsLjX3rnhAvptVTaS6gNaOqq5o9zT5kdjgvBzGE2p7Saalezf-xEHKvK92KuawPjEfOC-uTB_V0qjUAxNghctpHhEdfnqoVa-kvE98KZwNbPtTXgvQUjCo73gBO4MlY8doy1gBXy9zn_xV8RuELxyBvvC3Y4XQOtoJ5j5EZSn_wMFtN0VgT-i0pg';

function getConfigPath() {
  if (!configPath) {
    configPath = path.join(app.getPath('userData'), 'config.json');
  }
  return configPath;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');

  // Mở DevTools trong môi trường development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// API Handler - Lấy danh sách chi nhánh
ipcMain.handle('fetch-branches', async (event, { authorization, companyCode }) => {
  try {
    const url = ApiConfig.getStocksUrl(companyCode, { page: 1, start: 0, limit: 50 });
    const headers = ApiConfig.buildHeaders(
      authorization,
      companyCode,
      '00000000-0000-0000-0000-000000000000'
    );

    const response = await axios.get(url, { headers });

    if (response.data.Code === 200) {
      return {
        success: true,
        branches: response.data.Data.map(item => ({
          branchID: item.BranchID,
          branchName: item.StockName,
          stockCode: item.StockCode
        }))
      };
    } else {
      return {
        success: false,
        error: 'Không thể lấy danh sách chi nhánh'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// API Handler - Lấy dữ liệu phiếu nhập/xuất kho
ipcMain.handle('fetch-inwards', async (event, { authorization, companyCode, branchID, startDate, endDate, documentType = 'INInwards', page = 1, limit = 50 }) => {
  try {
    const filter = ApiConfig.createDateFilter(startDate, endDate);
    const url = ApiConfig.getDocumentUrl(companyCode, documentType, { page, limit, filter });
    const headers = ApiConfig.buildHeaders(authorization, companyCode, branchID);

    const response = await axios.get(url, { headers });

    if (response.data.Code === 200) {
      return {
        success: true,
        data: response.data.Data,
        total: response.data.Total,
        currentPage: page,
        totalPages: Math.ceil(response.data.Total / limit)
      };
    } else {
      return {
        success: false,
        error: 'Không thể lấy dữ liệu phiếu nhập kho'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// API Handler - Lấy báo cáo thanh toán
ipcMain.handle('fetch-payment-report', async (event, { authorization, companyCode, branchIDs, startDate, endDate, page = 1, limit = 50 }) => {
  try {
    const url = ApiConfig.getReportUrl(companyCode, 'RP_ListReceiptAndPayment');
    const headers = ApiConfig.buildReportHeaders(authorization, companyCode);

    const objParams = {
      FromDate: startDate,
      ToDate: endDate,
      EmployeeID: '00000000-0000-0000-0000-000000000000',
      PaymentType: 0,
      Period: 50,
      ReportID: 'RP_ListReceiptAndPayment',
      IsViewByAllBranch: true,
      ListBranchID: branchIDs.join(';'),
      BranchID: '00000000-0000-0000-0000-000000000000',
      StockID: '00000000-0000-0000-0000-000000000000'
    };

    const params = new URLSearchParams();
    params.append('reportID', 'RP_ListReceiptAndPayment');
    params.append('objParams', JSON.stringify(objParams));
    params.append('page', page.toString());
    params.append('start', ((page - 1) * limit).toString());
    params.append('limit', limit.toString());

    const response = await axios.post(url, params.toString(), { headers });

    if (response.data.Code === 200) {
      return {
        success: true,
        data: response.data.Data,
        total: response.data.Total,
        currentPage: page,
        totalPages: Math.ceil(response.data.Total / limit)
      };
    } else {
      return {
        success: false,
        error: 'Không thể lấy dữ liệu báo cáo thanh toán'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Xuất Excel
ipcMain.handle('export-excel', async (event, { data, fileName, documentType }) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Lưu file Excel',
      defaultPath: fileName || 'PhieuNhapKho.xlsx',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    const workbook = new ExcelJS.Workbook();
    let worksheet;

    if (documentType === 'PaymentReport') {
      // Payment report columns
      worksheet = workbook.addWorksheet('Báo cáo thanh toán');

      worksheet.columns = [
        { header: 'Mã phiếu', key: 'refNo', width: 20 },
        { header: 'Ngày', key: 'refDate', width: 20 },
        { header: 'Loại phiếu', key: 'refType', width: 15 },
        { header: 'Chi nhánh', key: 'branchName', width: 30 },
        { header: 'Mã chi nhánh', key: 'branchCode', width: 20 },
        { header: 'Đối tượng', key: 'objectName', width: 30 },
        { header: 'Mã đối tượng', key: 'objectCode', width: 20 },
        { header: 'Nhân viên', key: 'employeeName', width: 25 },
        { header: 'Tiền thu', key: 'receiptAmount', width: 15 },
        { header: 'Tiền chi', key: 'paymentAmount', width: 15 },
        { header: 'Số dư', key: 'closeAmount', width: 15 },
        { header: 'Hình thức', key: 'paymentType', width: 15 },
        { header: 'Tên thẻ', key: 'cardName', width: 20 },
        { header: 'Số tài khoản', key: 'accountNumber', width: 20 },
        { header: 'Ghi chú', key: 'note', width: 40 },
        { header: 'Số hóa đơn', key: 'invNo', width: 20 }
      ];

      // Thêm dữ liệu
      data.forEach(item => {
        worksheet.addRow({
          refNo: item.RefNo || '',
          refDate: item.RefDate ? new Date(item.RefDate).toLocaleString('vi-VN') : '',
          refType: item.RefType || '',
          branchName: item.BranchName || '',
          branchCode: item.BranchCode || '',
          objectName: item.ObjectName || '',
          objectCode: item.ObjectCode || '',
          employeeName: item.EmployeeName || '',
          receiptAmount: item.ReceiptAmount || 0,
          paymentAmount: item.PaymentAmount || 0,
          closeAmount: item.CloseAmount || 0,
          paymentType: item.PaymentType || '',
          cardName: item.CardName || '',
          accountNumber: item.AccountNumber || '',
          note: item.Note || '',
          invNo: item.InvNo || ''
        });
      });
    } else {
      // Warehouse document columns (INInwards/Outwards)
      worksheet = workbook.addWorksheet('Phiếu Nhập Kho');

      worksheet.columns = [
        { header: 'Mã phiếu', key: 'refNo', width: 20 },
        { header: 'Ngày nhập', key: 'refDate', width: 20 },
        { header: 'Chi nhánh', key: 'branchName', width: 30 },
        { header: 'Loại phiếu', key: 'refType', width: 15 },
        { header: 'Diễn giải', key: 'journalMemo', width: 40 },
        { header: 'Đối tượng', key: 'accountObjectName', width: 30 },
        { header: 'Tổng tiền', key: 'totalAmount', width: 15 },
        { header: 'Từ chi nhánh', key: 'fromBranchName', width: 30 },
        { header: 'Lý do', key: 'reasonName', width: 30 }
      ];

      // Thêm dữ liệu
      data.forEach(item => {
        worksheet.addRow({
          refNo: item.RefNo || '',
          refDate: item.RefDate ? new Date(item.RefDate).toLocaleString('vi-VN') : '',
          branchName: item.branchName || '',
          refType: item.RefType || '',
          journalMemo: item.JournalMemo || '',
          accountObjectName: item.AccountObjectName || '',
          totalAmount: item.TotalAmount || 0,
          fromBranchName: item.FromBranchName || '',
          reasonName: item.ReasonName || ''
        });
      });
    }

    // Style cho header
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Style cho các dòng dữ liệu
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle', wrapText: true };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Border cho header
    worksheet.getRow(1).eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    await workbook.xlsx.writeFile(filePath);

    return {
      success: true,
      filePath: filePath,
      totalRecords: data.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});


// Save config
ipcMain.handle('save-config', async (event, config) => {
  try {
    const cfgPath = getConfigPath();
    fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Load config
ipcMain.handle('load-config', async () => {
  try {
    const cfgPath = getConfigPath();
    if (fs.existsSync(cfgPath)) {
      const data = fs.readFileSync(cfgPath, 'utf8');
      return { success: true, config: JSON.parse(data) };
    } else {
      // Return default config with token from yeucau.txt
      return {
        success: true,
        config: {
          authorization: defaultToken,
          companyCode: 'thucphamnhapkhau'
        }
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

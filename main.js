const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const axios = require('axios');
const ExcelJS = require('exceljs');
const fs = require('fs');
const ApiConfig = require('./apiConfig');

let mainWindow;
const configPath = path.join(app.getPath('userData'), 'config.json');
const defaultToken = 'aAFFgzhZk8EfSI2OEq2NZeNgbW5Kjy6zb4SodOAXJrHeCiR1bRcCKG0eo6UHc7cwVAhr4FBU-HIHL_HYQYjoOERCLgvZ3FXJTCej7Lp4HuXVG1aLZF7pH7-K7RAqCa58ov5s1MCLDAqeeiJNXoBcnHdcgEA6hcyJX-GXsJOKMtvXygkypvlHsadx_Zvp-pr8oNIFZx-Jutqyyz1PVDRwPWQEggWCmGicV7moo2JGfwwjsliN1p1-rMGCe9I5C36eUINtwYU-xGflBV2IiSR0sBrsVnXKQsgWmsCeUM9kLE3EJ67B159ZZvFNJnxq-Z-SRuw3ZZr3_ObhLJm7c7WkCCxGTg37iOf00xWhSbXO10TBD95L7w3-BPHRgz04LW1OUAKxZ8iKKP1GSo8oxID0ajT9fbRSu851VjmSgujQw59DX2d1W5wUBtJEvsd8YjALvATQ0oKPkrTDCQIAUEq0oEzs6_3_B3M8t4VBoPCsymHdAqf8gbYyXf2vEInUH-0CH-T8pDL2dDntQr_F5UDKeuQJPrTVzIJOoPE21GmqaP_DCzPGo5-Uvm7gynk2d16ubzpsnhYMp06YAv49IKXc_Uy4iubspvFsLjX3rnhAvptVTaS6gNaOqq5o9zT5kdjgvBzGE2p7Saalezf-xEHKvK92KuawPjEfOC-uTB_V0qjUAxNghctpHhEdfnqoVa-kvE98KZwNbPtTXgvQUjCo73gBO4MlY8doy1gBXy9zn_xV8RuELxyBvvC3Y4XQOtoJ5j5EZSn_wMFtN0VgT-i0pg';

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

// Xuất Excel
ipcMain.handle('export-excel', async (event, { data, fileName }) => {
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
    const worksheet = workbook.addWorksheet('Phiếu Nhập Kho');

    // Thiết lập header
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
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Load config
ipcMain.handle('load-config', async () => {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
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

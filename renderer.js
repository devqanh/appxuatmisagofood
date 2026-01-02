const { ipcRenderer } = require('electron');
const { version } = require('./package.json');

// State
let allData = [];
let branches = [];
let isLoadingCancelled = false;

// DOM Elements
const loadDataBtn = document.getElementById('loadDataBtn');
const exportBtn = document.getElementById('exportBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const loadConfigBtn = document.getElementById('loadConfigBtn');
const documentTypeSelect = document.getElementById('documentType');
const progressSection = document.getElementById('progressSection');
const dataSection = document.getElementById('dataSection');
const progressBarFill = document.getElementById('progressBarFill');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const branchesCount = document.getElementById('branchesCount');
const recordsCount = document.getElementById('recordsCount');
const recordsLabel = document.getElementById('recordsLabel');
const statusText = document.getElementById('statusText');
const logContainer = document.getElementById('logContainer');
const dataTableBody = document.getElementById('dataTableBody');

// Utility Functions
function addLog(message, type = 'info') {
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  logEntry.textContent = `[${timestamp}] ${message}`;
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

function updateProgress(percent, text) {
  progressBarFill.style.width = `${percent}%`;
  progressPercent.textContent = `${Math.round(percent)}%`;
  if (text) {
    progressText.textContent = text;
  }
}

function showError(message) {
  alert(`Lỗi: ${message}`);
  addLog(message, 'error');
}

function showSuccess(message) {
  addLog(message, 'success');
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatNumber(num) {
  return new Intl.NumberFormat('vi-VN').format(num);
}

// Validate form
function validateForm() {
  const authorization = document.getElementById('authorization').value.trim();
  const companyCode = document.getElementById('companyCode').value.trim();
  const documentType = document.getElementById('documentType').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!authorization) {
    showError('Vui lòng nhập Authorization Token');
    return null;
  }

  if (!companyCode) {
    showError('Vui lòng nhập Company Code');
    return null;
  }

  if (!startDate) {
    showError('Vui lòng chọn ngày bắt đầu');
    return null;
  }

  if (!endDate) {
    showError('Vui lòng chọn ngày kết thúc');
    return null;
  }

  if (new Date(startDate) > new Date(endDate)) {
    showError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    return null;
  }

  return {
    authorization,
    companyCode,
    documentType,
    startDate: startDate + 'T00:00:00',
    endDate: endDate + 'T23:59:59'
  };
}

// Load branches
async function loadBranches(config) {
  addLog('Đang tải danh sách chi nhánh...', 'info');

  const result = await ipcRenderer.invoke('fetch-branches', {
    authorization: config.authorization,
    companyCode: config.companyCode
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  branches = result.branches;
  branchesCount.textContent = formatNumber(branches.length);
  showSuccess(`Đã tải ${branches.length} chi nhánh`);

  return branches;
}

// Load data for a single branch
async function loadBranchData(config, branch, branchIndex, totalBranches) {
  addLog(`Đang tải dữ liệu chi nhánh: ${branch.branchName}`, 'info');

  let branchData = [];
  let page = 1;
  let hasMoreData = true;

  while (hasMoreData && !isLoadingCancelled) {
    const result = await ipcRenderer.invoke('fetch-inwards', {
      authorization: config.authorization,
      companyCode: config.companyCode,
      branchID: branch.branchID,
      startDate: config.startDate,
      endDate: config.endDate,
      documentType: config.documentType,
      page: page,
      limit: 50
    });

    if (!result.success) {
      addLog(`Lỗi khi tải dữ liệu chi nhánh ${branch.branchName}: ${result.error}`, 'warning');
      break;
    }

    if (result.data && result.data.length > 0) {
      // Add branch name to each record
      const dataWithBranch = result.data.map(item => ({
        ...item,
        branchName: branch.branchName
      }));

      branchData = branchData.concat(dataWithBranch);

      addLog(`Chi nhánh ${branch.branchName} - Trang ${page}/${result.totalPages}: ${result.data.length} phiếu`, 'success');

      // Update progress
      const branchProgress = (page / result.totalPages) * 100;
      const totalProgress = ((branchIndex / totalBranches) * 100) + (branchProgress / totalBranches);
      updateProgress(totalProgress, `Đang tải ${branch.branchName} (${page}/${result.totalPages})`);
    }

    hasMoreData = page < result.totalPages;
    page++;
  }

  return branchData;
}

// Load payment report data
async function loadPaymentReportData(config) {
  addLog('Đang tải báo cáo thanh toán...', 'info');

  let allReportData = [];
  let page = 1;
  let hasMoreData = true;

  // Get list of branch IDs
  const branchIDs = branches.map(b => b.branchID);

  while (hasMoreData && !isLoadingCancelled) {
    const result = await ipcRenderer.invoke('fetch-payment-report', {
      authorization: config.authorization,
      companyCode: config.companyCode,
      branchIDs: branchIDs,
      startDate: config.startDate,
      endDate: config.endDate,
      page: page,
      limit: 50
    });

    if (!result.success) {
      addLog(`Lỗi khi tải báo cáo thanh toán: ${result.error}`, 'error');
      break;
    }

    if (result.data && result.data.length > 0) {
      allReportData = allReportData.concat(result.data);
      addLog(`Trang ${page}/${result.totalPages}: ${result.data.length} bản ghi`, 'success');

      // Update progress
      const progress = (page / result.totalPages) * 90 + 10;
      updateProgress(progress, `Đang tải báo cáo thanh toán (${page}/${result.totalPages})`);

      // Update record count
      recordsCount.textContent = formatNumber(allReportData.length);
    }

    hasMoreData = page < result.totalPages;
    page++;
  }

  return allReportData;
}

// Stop loading function
function stopLoading() {
  isLoadingCancelled = true;
  addLog('Đang dừng tải dữ liệu...', 'warning');
  statusText.textContent = 'Đã hủy';
}

// Main load data function
async function loadData() {
  const config = validateForm();
  if (!config) return;

  try {
    // Reset state
    allData = [];
    branches = [];
    isLoadingCancelled = false;
    dataTableBody.innerHTML = '';
    logContainer.innerHTML = '';

    // Show progress section
    progressSection.style.display = 'block';
    dataSection.style.display = 'none';

    // Change button to Stop button
    loadDataBtn.removeEventListener('click', loadData);
    loadDataBtn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6h12v12H6z" fill="currentColor"/>
      </svg>
      Dừng
    `;
    loadDataBtn.addEventListener('click', stopLoading);

    updateProgress(0, 'Đang khởi tạo...');
    statusText.textContent = 'Đang xử lý';
    recordsCount.textContent = '0';

    // Step 1: Load branches
    updateProgress(5, 'Đang tải danh sách chi nhánh...');
    await loadBranches(config);

    if (branches.length === 0) {
      throw new Error('Không tìm thấy chi nhánh nào');
    }

    // Step 2: Load data based on document type
    updateProgress(10, 'Bắt đầu tải dữ liệu...');

    if (config.documentType === 'PaymentReport') {
      // Load payment report data (all branches at once)
      allData = await loadPaymentReportData(config);
    } else {
      // Load data for each branch (INInwards/Outwards)
      for (let i = 0; i < branches.length && !isLoadingCancelled; i++) {
        const branch = branches[i];
        const branchData = await loadBranchData(config, branch, i, branches.length);
        allData = allData.concat(branchData);

        // Update record count
        recordsCount.textContent = formatNumber(allData.length);
      }
    }

    // Check if cancelled
    if (isLoadingCancelled) {
      addLog(`Đã dừng tải. Đã lấy được ${allData.length} bản ghi`, 'warning');
      statusText.textContent = 'Đã dừng';
    } else {
      // Complete
      updateProgress(100, 'Hoàn thành');
      statusText.textContent = 'Hoàn thành';

      let docTypeName;
      if (config.documentType === 'INInwards') {
        docTypeName = 'phiếu nhập kho';
      } else if (config.documentType === 'Outwards') {
        docTypeName = 'phiếu xuất kho';
      } else {
        docTypeName = 'bản ghi thanh toán';
      }

      showSuccess(`Đã tải xong ${allData.length} ${docTypeName} từ ${branches.length} chi nhánh`);
    }

    // Display data in table if we have any
    if (allData.length > 0) {
      displayData();
      dataSection.style.display = 'block';
    }

  } catch (error) {
    showError(error.message);
    statusText.textContent = 'Lỗi';
    updateProgress(0, 'Lỗi xảy ra');
  } finally {
    // Restore button
    loadDataBtn.removeEventListener('click', stopLoading);
    loadDataBtn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Tải dữ liệu
    `;
    loadDataBtn.addEventListener('click', loadData);
    isLoadingCancelled = false;
  }
}

// Display data in table
function displayData() {
  dataTableBody.innerHTML = '';

  if (allData.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7" style="text-align: center; padding: 40px; color: #9CA3AF;">Không có dữ liệu</td>';
    dataTableBody.appendChild(tr);
    return;
  }

  // Display first 100 records (or all if less than 100)
  const displayCount = Math.min(allData.length, 100);

  for (let i = 0; i < displayCount; i++) {
    const item = allData[i];
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${item.RefNo || ''}</td>
      <td>${formatDate(item.RefDate)}</td>
      <td>${item.branchName || ''}</td>
      <td>${item.JournalMemo || ''}</td>
      <td>${item.AccountObjectName || ''}</td>
      <td>${item.FromBranchName || ''}</td>
    `;

    dataTableBody.appendChild(tr);
  }

  if (allData.length > 100) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7" style="text-align: center; padding: 20px; background: #F3F4F6; font-weight: 500;">Hiển thị ${displayCount}/${allData.length} phiếu. Tất cả dữ liệu sẽ được xuất ra Excel.</td>`;
    dataTableBody.appendChild(tr);
  }
}

// Export to Excel
async function exportToExcel() {
  if (allData.length === 0) {
    showError('Không có dữ liệu để xuất');
    return;
  }

  try {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Đang xuất...';

    addLog('Đang xuất dữ liệu ra Excel...', 'info');

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const docType = document.getElementById('documentType').value;

    let docTypeName, docTypeText;
    if (docType === 'INInwards') {
      docTypeName = 'PhieuNhapKho';
      docTypeText = 'phiếu nhập kho';
    } else if (docType === 'Outwards') {
      docTypeName = 'PhieuXuatKho';
      docTypeText = 'phiếu xuất kho';
    } else if (docType === 'PaymentReport') {
      docTypeName = 'BaoCaoThanhToan';
      docTypeText = 'bản ghi thanh toán';
    }

    const fileName = `${docTypeName}_${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}.xlsx`;

    const result = await ipcRenderer.invoke('export-excel', {
      data: allData,
      fileName: fileName,
      documentType: docType
    });

    if (result.canceled) {
      addLog('Đã hủy xuất Excel', 'warning');
      return;
    }

    if (!result.success) {
      throw new Error(result.error);
    }

    showSuccess(`Đã xuất ${result.totalRecords} ${docTypeText} ra file: ${result.filePath}`);
    alert(`Xuất Excel thành công!\n\nĐã xuất ${result.totalRecords} ${docTypeText}.\nFile đã được lưu tại:\n${result.filePath}`);

  } catch (error) {
    showError(error.message);
  } finally {
    exportBtn.disabled = false;
    exportBtn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Xuất Excel
    `;
  }
}

// Save config
async function saveConfig() {
  const config = {
    authorization: document.getElementById('authorization').value.trim(),
    companyCode: document.getElementById('companyCode').value.trim()
  };

  const result = await ipcRenderer.invoke('save-config', config);

  if (result.success) {
    alert('Đã lưu cấu hình thành công!');
  } else {
    alert('Lỗi khi lưu cấu hình: ' + result.error);
  }
}

// Load config
async function loadConfigFromFile() {
  const result = await ipcRenderer.invoke('load-config');

  if (result.success && result.config) {
    document.getElementById('authorization').value = result.config.authorization || '';
    document.getElementById('companyCode').value = result.config.companyCode || 'thucphamnhapkhau';
    alert('Đã load cấu hình thành công!');
  } else {
    alert('Lỗi khi load cấu hình: ' + (result.error || 'Không có cấu hình'));
  }
}

// Auto load config on startup
async function autoLoadConfig() {
  const result = await ipcRenderer.invoke('load-config');

  if (result.success && result.config) {
    document.getElementById('authorization').value = result.config.authorization || '';
    document.getElementById('companyCode').value = result.config.companyCode || 'thucphamnhapkhau';
  }
}

// Update label when document type changes
function updateDocumentTypeLabel() {
  const docType = documentTypeSelect.value;
  if (docType === 'INInwards') {
    recordsLabel.textContent = 'Phiếu nhập';
  } else if (docType === 'Outwards') {
    recordsLabel.textContent = 'Phiếu xuất';
  } else if (docType === 'PaymentReport') {
    recordsLabel.textContent = 'Bản ghi';
  }
}

// Event Listeners
loadDataBtn.addEventListener('click', loadData);
exportBtn.addEventListener('click', exportToExcel);
saveConfigBtn.addEventListener('click', saveConfig);
loadConfigBtn.addEventListener('click', loadConfigFromFile);
documentTypeSelect.addEventListener('change', updateDocumentTypeLabel);

// Set default dates and load config on startup
window.addEventListener('DOMContentLoaded', async () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  document.getElementById('startDate').value = firstDay.toISOString().slice(0, 10);
  document.getElementById('endDate').value = lastDay.toISOString().slice(0, 10);

  // Display version
  document.getElementById('appVersion').textContent = `v${version}`;

  // Auto load config with default token
  await autoLoadConfig();

  // Set initial label
  updateDocumentTypeLabel();
});

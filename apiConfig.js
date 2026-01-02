/**
 * API Configuration Module
 * Tập trung quản lý URL API dựa trên companyCode
 */

class ApiConfig {
  /**
   * Lấy base URL dựa trên companyCode
   * @param {string} companyCode - Mã công ty (vd: thucphamnhapkhau)
   * @returns {string} Base URL của API
   */
  static getBaseUrl(companyCode) {
    if (!companyCode) {
      throw new Error('companyCode is required');
    }
    return `https://${companyCode}.mshopkeeper.vn/backendg1/api`;
  }

  /**
   * Xây dựng URL đầy đủ cho endpoint
   * @param {string} companyCode - Mã công ty
   * @param {string} endpoint - Endpoint path (vd: 'Stocks', 'INInwards')
   * @param {Object} params - Query parameters (optional)
   * @returns {string} URL đầy đủ
   */
  static buildUrl(companyCode, endpoint, params = {}) {
    const baseUrl = this.getBaseUrl(companyCode);
    const url = new URL(`${baseUrl}/${endpoint}`);
    
    // Thêm query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    return url.toString();
  }

  /**
   * Xây dựng headers chung cho API request
   * @param {string} authorization - Bearer token
   * @param {string} companyCode - Mã công ty
   * @param {string} branchID - ID chi nhánh (optional)
   * @returns {Object} Headers object
   */
  static buildHeaders(authorization, companyCode, branchID = null) {
    const headers = {
      'Authorization': `Bearer ${authorization}`,
      'CompanyCode': companyCode
    };

    if (branchID) {
      headers['X-MISA-BranchID'] = branchID;
    }

    return headers;
  }

  /**
   * Lấy URL cho API Stocks (danh sách chi nhánh)
   * @param {string} companyCode - Mã công ty
   * @param {Object} options - Options {page, start, limit}
   * @returns {string} URL đầy đủ
   */
  static getStocksUrl(companyCode, options = {}) {
    const { page = 1, start = 0, limit = 50 } = options;
    return this.buildUrl(companyCode, 'Stocks', { page, start, limit });
  }

  /**
   * Lấy URL cho API INInwards/Outwards (phiếu nhập/xuất kho)
   * @param {string} companyCode - Mã công ty
   * @param {string} documentType - Loại chứng từ ('INInwards' hoặc 'Outwards')
   * @param {Object} options - Options {page, start, limit, filter}
   * @returns {string} URL đầy đủ
   */
  static getDocumentUrl(companyCode, documentType, options = {}) {
    const { page = 1, limit = 50, filter = null } = options;
    const start = (page - 1) * limit;
    
    const params = { page, start, limit };
    
    if (filter) {
      params.filter = JSON.stringify(filter);
    }
    
    return this.buildUrl(companyCode, documentType, params);
  }

  /**
   * Tạo filter cho khoảng thời gian
   * @param {string} startDate - Ngày bắt đầu (ISO format)
   * @param {string} endDate - Ngày kết thúc (ISO format)
   * @returns {Array} Filter array
   */
  static createDateFilter(startDate, endDate) {
    return [
      {
        "xtype": "filter",
        "property": "RefDate",
        "operator": 4,
        "value": startDate,
        "type": 2,
        "group": "RefDate"
      },
      {
        "xtype": "filter",
        "property": "RefDate",
        "operator": 3,
        "value": endDate,
        "type": 2,
        "addition": 1,
        "group": "RefDate"
      }
    ];
  }

  /**
   * Lấy URL cho API Report (báo cáo)
   * @param {string} companyCode - Mã công ty
   * @param {string} reportID - ID báo cáo (vd: 'RP_ListReceiptAndPayment')
   * @returns {string} URL đầy đủ
   */
  static getReportUrl(companyCode, reportID) {
    return this.buildUrl(companyCode, `ReportList/GetReport/${reportID}`);
  }

  /**
   * Xây dựng headers cho API Report
   * @param {string} authorization - Bearer token
   * @param {string} companyCode - Mã công ty
   * @param {string} branchID - ID chi nhánh (optional)
   * @returns {Object} Headers object
   */
  static buildReportHeaders(authorization, companyCode, branchID = '00000000-0000-0000-0000-000000000000') {
    return {
      'Authorization': `Bearer ${authorization}`,
      'CompanyCode': companyCode,
      'X-MISA-BranchID': branchID,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    };
  }

  /**
   * Tạo params cho báo cáo thanh toán
   * @param {Object} options - Options {fromDate, toDate, listBranchID, page, limit}
   * @returns {string} URL encoded params
   */
  static createReportParams(options = {}) {
    const {
      fromDate,
      toDate,
      listBranchID = '',
      page = 1,
      start = 1,
      limit = 50,
      reportID = 'RP_ListReceiptAndPayment',
      employeeID = '00000000-0000-0000-0000-000000000000',
      paymentType = 0,
      period = 50,
      isViewByAllBranch = true,
      branchID = '00000000-0000-0000-0000-000000000000',
      stockID = '00000000-0000-0000-0000-000000000000'
    } = options;

    const objParams = {
      FromDate: fromDate,
      ToDate: toDate,
      EmployeeID: employeeID,
      PaymentType: paymentType,
      Period: period,
      ReportID: reportID,
      IsViewByAllBranch: isViewByAllBranch,
      ListBranchID: listBranchID,
      BranchID: branchID,
      StockID: stockID
    };

    return `reportID=${reportID}&objParams=${encodeURIComponent(JSON.stringify(objParams))}&page=${page}&start=${start}&limit=${limit}`;
  }
}

module.exports = ApiConfig;


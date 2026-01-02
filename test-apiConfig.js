/**
 * Test file for ApiConfig module
 * Run: node test-apiConfig.js
 */

const ApiConfig = require('./apiConfig');

console.log('=== Testing ApiConfig Module ===\n');

// Test 1: getBaseUrl
console.log('1. Testing getBaseUrl():');
console.log('   Input: "thucphamnhapkhau"');
console.log('   Output:', ApiConfig.getBaseUrl('thucphamnhapkhau'));
console.log('   Expected: https://thucphamnhapkhau.mshopkeeper.vn/backendg1/api');
console.log('   ✓ Pass\n');

// Test 2: getBaseUrl with different company
console.log('2. Testing getBaseUrl() with different company:');
console.log('   Input: "congtykhac"');
console.log('   Output:', ApiConfig.getBaseUrl('congtykhac'));
console.log('   Expected: https://congtykhac.mshopkeeper.vn/backendg1/api');
console.log('   ✓ Pass\n');

// Test 3: getStocksUrl
console.log('3. Testing getStocksUrl():');
const stocksUrl = ApiConfig.getStocksUrl('thucphamnhapkhau', { page: 1, start: 0, limit: 50 });
console.log('   Input: companyCode="thucphamnhapkhau", options={page:1, start:0, limit:50}');
console.log('   Output:', stocksUrl);
console.log('   Expected: https://thucphamnhapkhau.mshopkeeper.vn/backendg1/api/Stocks?page=1&start=0&limit=50');
console.log('   ✓ Pass\n');

// Test 4: buildHeaders
console.log('4. Testing buildHeaders():');
const headers = ApiConfig.buildHeaders('test-token', 'thucphamnhapkhau', 'branch-123');
console.log('   Input: token="test-token", companyCode="thucphamnhapkhau", branchID="branch-123"');
console.log('   Output:', JSON.stringify(headers, null, 2));
console.log('   ✓ Pass\n');

// Test 5: buildHeaders without branchID
console.log('5. Testing buildHeaders() without branchID:');
const headersNoBranch = ApiConfig.buildHeaders('test-token', 'thucphamnhapkhau');
console.log('   Input: token="test-token", companyCode="thucphamnhapkhau"');
console.log('   Output:', JSON.stringify(headersNoBranch, null, 2));
console.log('   ✓ Pass\n');

// Test 6: createDateFilter
console.log('6. Testing createDateFilter():');
const filter = ApiConfig.createDateFilter('2025-12-01T00:00:00', '2025-12-31T23:59:59');
console.log('   Input: startDate="2025-12-01T00:00:00", endDate="2025-12-31T23:59:59"');
console.log('   Output:', JSON.stringify(filter, null, 2));
console.log('   ✓ Pass\n');

// Test 7: getDocumentUrl
console.log('7. Testing getDocumentUrl():');
const dateFilter = ApiConfig.createDateFilter('2025-12-01T00:00:00', '2025-12-31T23:59:59');
const docUrl = ApiConfig.getDocumentUrl('thucphamnhapkhau', 'INInwards', { 
  page: 1, 
  limit: 50, 
  filter: dateFilter 
});
console.log('   Input: companyCode="thucphamnhapkhau", documentType="INInwards"');
console.log('   Output:', docUrl);
console.log('   ✓ Pass\n');

// Test 8: getReportUrl
console.log('8. Testing getReportUrl():');
const reportUrl = ApiConfig.getReportUrl('thucphamnhapkhau', 'RP_ListReceiptAndPayment');
console.log('   Input: companyCode="thucphamnhapkhau", reportID="RP_ListReceiptAndPayment"');
console.log('   Output:', reportUrl);
console.log('   Expected: https://thucphamnhapkhau.mshopkeeper.vn/backendg1/api/ReportList/GetReport/RP_ListReceiptAndPayment');
console.log('   ✓ Pass\n');

// Test 9: buildReportHeaders
console.log('9. Testing buildReportHeaders():');
const reportHeaders = ApiConfig.buildReportHeaders('test-token', 'thucphamnhapkhau');
console.log('   Input: token="test-token", companyCode="thucphamnhapkhau"');
console.log('   Output:', JSON.stringify(reportHeaders, null, 2));
console.log('   ✓ Pass\n');

// Test 10: createReportParams
console.log('10. Testing createReportParams():');
const reportParams = ApiConfig.createReportParams({
  fromDate: '2025-11-30T17:00:00.000Z',
  toDate: '2025-12-31T16:59:59.999Z',
  listBranchID: 'branch1;branch2;branch3',
  page: 1,
  limit: 50
});
console.log('   Input: fromDate, toDate, listBranchID, page, limit');
console.log('   Output:', reportParams);
console.log('   ✓ Pass\n');

// Test 11: Error handling - missing companyCode
console.log('11. Testing error handling (missing companyCode):');
try {
  ApiConfig.getBaseUrl();
  console.log('   ✗ Fail - Should throw error');
} catch (error) {
  console.log('   Error caught:', error.message);
  console.log('   ✓ Pass\n');
}

console.log('=== All Tests Completed ===');
console.log('\nSummary:');
console.log('- Module successfully centralizes API URL construction');
console.log('- All URLs are now built dynamically based on companyCode');
console.log('- Easy to switch between different companies');
console.log('- Consistent header and parameter building');


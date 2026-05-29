const ExcelJS = require('exceljs');
const path = require('path');

async function testParser() {
  const filePath = path.join('C:', 'Users', 'amaks', 'Documents', 'Z', 'final', 'inventory list', 'FM_STR_01 Stock Sheet - PCB.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const sheet = workbook.worksheets[0];
  console.log('Worksheet Name:', sheet.name);
  
  // Row 10 has the headers
  const headerRow = sheet.getRow(10);
  const headers = [];
  headerRow.eachCell((cell, colNum) => {
    headers[colNum] = cell.value;
  });
  
  console.log('Header at Col 1:', headers[1]);
  console.log('Header at Col 2:', headers[2]);
  console.log('Header at Col 3:', headers[3]);
  console.log('Header at Col 4:', headers[4]);
  console.log('Header at Col 5:', headers[5]);
  console.log('Header at Col 6:', headers[6]);
  console.log('Header at Col 7:', headers[7]);
  console.log('Header at Col 37:', headers[37]);
  console.log('Header at Col 38:', headers[38]);
  console.log('Header at Col 39:', headers[39]);
  
  // Let's parse row 15 (which we saw had ledger entries)
  const row = sheet.getRow(15);
  const partNumber = row.getCell(2).value;
  const productName = row.getCell(3).value;
  const openingStock = getFloatVal(row.getCell(6).value);
  console.log(`\nRow 15 Material: ${partNumber} - ${productName}`);
  console.log(`Opening Stock: ${openingStock}`);
  
  let runningBalance = openingStock;
  
  // Columns 7 to 37 are dates
  for (let col = 7; col <= 37; col++) {
    const headerValue = headers[col];
    const cellValue = row.getCell(col).value;
    if (cellValue !== null && cellValue !== undefined) {
      const qty = getFloatVal(cellValue);
      if (qty !== 0) {
        runningBalance += qty;
        let dateStr = '';
        if (headerValue instanceof Date) {
          dateStr = headerValue.toISOString().split('T')[0];
        } else {
          dateStr = String(headerValue);
        }
        console.log(`  Date ${dateStr} (Col ${col}): Transaction = ${qty}, Running Balance = ${runningBalance}`);
      }
    }
  }
  
  const closingStockVal = getFloatVal(row.getCell(38).value);
  console.log(`Calculated Running Balance (Closing): ${runningBalance}`);
  console.log(`Excel Closing Stock: ${closingStockVal}`);
}

function getFloatVal(val) {
  if (!val) return 0;
  let num;
  if (typeof val === 'object' && 'result' in val) {
    num = parseFloat(val.result?.toString() || '0');
  } else {
    num = parseFloat(val.toString());
  }
  return isNaN(num) ? 0 : num;
}

testParser().catch(console.error);

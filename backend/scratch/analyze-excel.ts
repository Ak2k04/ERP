import ExcelJS from 'exceljs';
import path from 'path';

async function analyze() {
  const filePath = path.join('C:', 'Users', 'amaks', 'Documents', 'Z', 'final', 'inventory list', 'FM_STR_01 Stock Sheet - PCB.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  console.log('Worksheets:', workbook.worksheets.map(w => w.name));
  const sheet = workbook.worksheets[0];
  console.log('Row count:', sheet.rowCount);
  
  // Print first 10 rows
  for (let i = 1; i <= Math.min(15, sheet.rowCount); i++) {
    const row = sheet.getRow(i);
    const vals = [];
    row.eachCell((cell, colNum) => {
      vals.push({ colNum, val: cell.value });
    });
    console.log(`Row ${i}:`, JSON.stringify(vals));
  }
}

analyze().catch(console.error);

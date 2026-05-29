const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'consumables and tools', color: '#3b82f6' },
  { name: 'display', color: '#10b981' },
  { name: 'enclosure', color: '#f59e0b' },
  { name: 'fuse and power supply', color: '#ef4444' },
  { name: 'keypad & stickers', color: '#8b5cf6' },
  { name: 'MOV LED Connector', color: '#ec4899' },
  { name: 'PCB', color: '#06b6d4' },
  { name: 'resistor,capacitor,diode&transistor ,ic', color: '#14b8a6' },
  { name: 'switch and modules', color: '#6366f1' },
  { name: 'others', color: '#6b7280' },
];

function detectCategoryFromFilename(filename) {
  const name = filename.toLowerCase();
  if (name.includes('consumable') || name.includes('tools')) return 'consumables and tools';
  if (name.includes('display') || name.includes('displau')) return 'display';
  if (name.includes('encloser') || name.includes('enclosure')) return 'enclosure';
  if (name.includes('fuse') || name.includes('power')) return 'fuse and power supply';
  if (name.includes('keypad') || name.includes('sticker') || name.includes('stikcer')) return 'keypad & stickers';
  if (name.includes('mov') || name.includes('led') || name.includes('connector')) return 'MOV LED Connector';
  if (name.includes('pcb')) return 'PCB';
  if (name.includes('resistor') || name.includes('capacitor') || name.includes('diode') || name.includes('transistor') || name.includes('ic')) return 'resistor,capacitor,diode&transistor ,ic';
  if (name.includes('switch') || name.includes('module')) return 'switch and modules';
  return 'others';
}

async function runImport() {
  console.log('--- Bulk Stock Sheet Excel Import Started ---');

  // 1. Ensure categories exist
  console.log('Verifying Categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat
    });
  }
  console.log('Categories successfully verified.\n');

  // 2. Scan the directory
  const dirPath = path.join('C:', 'Users', 'amaks', 'Documents', 'Z', 'final', 'inventory list');
  if (!fs.existsSync(dirPath)) {
    console.error(`Error: Inventory directory does not exist at ${dirPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  console.log(`Found ${files.length} Excel file(s) to process.\n`);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    console.log(`Processing file: "${file}"...`);

    const catName = detectCategoryFromFilename(file);
    const dbCat = await prisma.category.findUnique({ where: { name: catName } });
    if (!dbCat) {
      console.warn(`[Warning] Category not found for file "${file}", using "others"`);
    }
    const categoryId = dbCat ? dbCat.id : null;
    console.log(`  Assigned Category: "${catName}" (ID: ${categoryId})`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      console.error(`  [Error] Worksheet not found in "${file}". Skipping.`);
      continue;
    }

    // Auto-detect header row
    let headerRowIndex = 1;
    for (let r = 1; r <= 15; r++) {
      const rowVal = worksheet.getRow(r).getCell(2).value;
      if (rowVal && rowVal.toString().trim().toLowerCase() === 'part number') {
        headerRowIndex = r;
        break;
      }
    }
    console.log(`  Header row detected at index: ${headerRowIndex}`);

    // Parse Dates
    const headerRow = worksheet.getRow(headerRowIndex);
    const dates = [];
    if (headerRowIndex === 10) {
      for (let col = 7; col <= 37; col++) {
        const val = headerRow.getCell(col).value;
        if (val) {
          let dateObj = null;
          if (val instanceof Date) {
            dateObj = val;
          } else {
            const parsed = Date.parse(val.toString());
            if (!isNaN(parsed)) {
              dateObj = new Date(parsed);
            }
          }
          if (dateObj) {
            dates.push({ col, date: dateObj });
          }
        }
      }
    }
    console.log(`  Parsed ${dates.length} daily ledger columns.`);

    let skuCount = 0;

    for (let rowNum = headerRowIndex + 1; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);

      const getStr = (idx) => {
        const val = row.getCell(idx).value;
        if (!val) return '';
        if (typeof val === 'object' && 'result' in val) return val.result?.toString() || '';
        return val.toString();
      };

      const getFloat = (idx) => {
        const val = row.getCell(idx).value;
        if (!val) return 0;
        let num;
        if (typeof val === 'object' && 'result' in val) {
          num = parseFloat(val.result?.toString() || '0');
        } else {
          num = parseFloat(val.toString());
        }
        return isNaN(num) ? 0 : num;
      };

      const storageLocation = getStr(1);
      const partNumber = getStr(2);
      const productName = getStr(3);
      const rate = getFloat(4);
      const unit = getStr(5);
      const openingStock = getFloat(6);

      let closingStock = 0;
      let minStock = 0;
      let reorderLevel = 0;
      let maxStock = 0;

      if (headerRowIndex === 10) {
        closingStock = getFloat(38);
        minStock = getFloat(39);
        reorderLevel = getFloat(40);
        maxStock = getFloat(41);
      } else {
        closingStock = getFloat(7);
        minStock = getFloat(8);
        reorderLevel = getFloat(9);
        maxStock = getFloat(10);
      }

      if (!partNumber || !productName || partNumber === 'Part Number' || productName === 'Product Name') {
        continue;
      }

      const matData = {
        storageLocation,
        partNumber,
        productName,
        unitRate: rate,
        unit,
        openingStock,
        closingStock,
        minimumStock: minStock,
        reorderLevel,
        maximumStock: maxStock,
        categoryId,
      };

      // Upsert StoresMaterial
      const createdMat = await prisma.storesMaterial.upsert({
        where: { partNumber: matData.partNumber },
        update: matData,
        create: matData
      });

      skuCount++;

      // Create Ledger Entries
      if (headerRowIndex === 10) {
        // Clear old entries
        await prisma.dailyLedger.deleteMany({
          where: { materialId: createdMat.id }
        });

        let runningBalance = matData.openingStock;

        // Seeding Opening Balance entry
        if (matData.openingStock !== 0) {
          const firstDate = dates.length > 0 ? dates[0].date : new Date('2026-01-01');
          await prisma.dailyLedger.create({
            data: {
              materialId: createdMat.id,
              date: firstDate,
              movementType: 'OPENING_BALANCE',
              quantity: matData.openingStock,
              runningBalance: matData.openingStock,
              referenceType: 'OPENING_BALANCE',
              notes: 'Opening Balance (Imported)',
              createdById: 'system'
            }
          });
        }

        // Loop through date columns
        for (const d of dates) {
          const cellValue = row.getCell(d.col).value;
          if (cellValue !== null && cellValue !== undefined) {
            let num;
            if (typeof cellValue === 'object' && 'result' in cellValue) {
              num = parseFloat(cellValue.result?.toString() || '0');
            } else {
              num = parseFloat(cellValue.toString());
            }
            const qty = isNaN(num) ? 0 : num;
            
            runningBalance += qty;
            
            if (qty !== 0) {
              await prisma.dailyLedger.create({
                data: {
                  materialId: createdMat.id,
                  date: d.date,
                  movementType: qty > 0 ? 'IN' : 'OUT',
                  quantity: qty,
                  runningBalance: runningBalance,
                  referenceType: qty > 0 ? 'MANUAL_IN' : 'MANUAL_OUT',
                  notes: 'Daily ledger entry (Imported)',
                  createdById: 'system'
                }
              });
            }
          }
        }
      }
    }

    console.log(`  [Success] Imported ${skuCount} SKU items and date-based ledger records.\n`);
  }

  console.log('--- Bulk Stock Sheet Excel Import Completed Successfully ---');
}

runImport()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

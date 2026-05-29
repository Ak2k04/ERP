import { Request, Response } from 'express';
import exceljs from 'exceljs';
import prisma from '../services/prisma';
import asyncHandler from '../utils/asyncHandler';
import { AppError } from '../middleware/error';
import puppeteer from 'puppeteer';
import logger from '../utils/logger';

const generateHtmlTemplate = (data: any) => {
  const { 
    projectName, 
    customerName, 
    productName, 
    costCode, 
    startDate, 
    date,
    lineItems,
    signatures,
    documentRef = "FM/STR/002/Ver 0"
  } = data;

  const documentTitle = process.env.NEXT_PUBLIC_DOC_TITLE || "Material Request & Issue Register";

  // Partitioning Algorithm for multi-page rendering
  const PAGE_1_MAX = 22;
  const PAGE_N_MAX = 28;

  const pages: any[][] = [];
  if (lineItems.length === 0) {
    pages.push([]);
  } else {
    let currentSlice = lineItems.slice(0, PAGE_1_MAX);
    pages.push(currentSlice);
    
    let remaining = lineItems.slice(PAGE_1_MAX);
    while (remaining.length > 0) {
      currentSlice = remaining.slice(0, PAGE_N_MAX);
      pages.push(currentSlice);
      remaining = remaining.slice(PAGE_N_MAX);
    }
  }

  const totalPages = pages.length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Material Request &amp; Issue Register</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, Helvetica, sans-serif;
          background: #fff;
          color: #000;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page {
          width: 210mm;
          height: 297mm;
          padding: 10mm 12mm;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          background: #fff;
        }
        .page-break {
          page-break-after: always;
          break-after: page;
        }
        table { 
          border-collapse: collapse; 
          width: 100%;
          table-layout: fixed;
        }
        td, th { 
          border: 0.5pt solid #000;
          vertical-align: middle;
        }
        .company-name {
          font-size: 22pt;
          font-weight: bold;
          line-height: 1;
        }
        .reg-mark {
          font-size: 12pt;
          vertical-align: super;
        }
        .doc-ref-box {
          border: 1px solid #000;
          padding: 1.5mm 3mm;
          font-size: 9pt;
          text-align: center;
          display: inline-block;
          width: 100%;
          height: 8mm;
          line-height: 5.5mm;
        }
        .title-bar {
          border: 1px solid #000;
          text-align: center;
          font-weight: bold;
          font-size: 10pt;
          padding: 1.5mm;
          margin: 1px 0;
          height: 7mm;
          line-height: 4.5mm;
        }
        .header-table td {
          font-size: 8pt;
          height: 7mm;
          padding: 1mm 2mm;
        }
        .label-cell {
          font-weight: normal;
          width: 25%;
        }
        .items-table th {
          font-size: 8pt;
          font-weight: bold;
          text-align: center;
          height: 8mm;
          background: #fff;
          padding: 2px 4px;
        }
        .items-table td {
          font-size: 7.5pt;
          height: 6.5mm;
          padding: 1mm 1.5mm;
        }
        .ac-head-sub {
          font-size: 6pt;
          font-style: italic;
          font-weight: normal;
          display: block;
          line-height: 1;
        }
        .col-partcode   { width: 14%; text-align: left; }
        .col-achead     { width: 7%;  text-align: center; }
        .col-items      { width: 43%; text-align: left; }
        .col-qty        { width: 6%;  text-align: center; }
        .col-qtyreqd    { width: 10%; text-align: center; }
        .col-qtyissd    { width: 10%; text-align: center; }
        .col-balance    { width: 10%; text-align: center; }
        
        .sig-table {
          border: 1px solid #000;
          margin-top: 6px;
          height: 22mm;
        }
        .sig-table td {
          border-right: 1px solid #000;
          border-left: none;
          border-top: none;
          border-bottom: none;
          width: 25%;
          height: 22mm;
          vertical-align: bottom;
          text-align: center;
          font-size: 8pt;
          font-weight: bold;
          padding-bottom: 1.5mm;
          position: relative;
        }
        .sig-table td:last-child {
          border-right: none;
        }
        .sig-area {
          height: 12mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sig-divider {
          border-top: 1px solid #000;
          width: 100%;
        }
        .sig-name {
          font-family: Georgia, serif;
          font-style: italic;
          font-weight: bold;
          font-size: 9pt;
          display: block;
          transform: rotate(-3deg);
        }
        .sig-date {
          font-size: 6.5pt;
          font-weight: normal;
          display: block;
        }
        .empty-row td {
          height: 6.5mm;
        }
        .page-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 7pt;
          color: #666;
          margin-top: auto;
          padding-top: 4px;
        }
      </style>
    </head>
    <body>
      ${pages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const pageNum = pageIdx + 1;

        // Pad lists
        const emptyRowsNeeded = isFirstPage
          ? Math.max(4, 20 - pageItems.length)
          : Math.max(4, PAGE_N_MAX - pageItems.length - (isLastPage ? 4 : 0));

        const paddedRows = Array(emptyRowsNeeded).fill(0);

        return `
          <div class="page ${pageIdx < totalPages - 1 ? 'page-break' : ''}">
            <!-- BLOCK 1: Company Header -->
            ${isFirstPage ? `
              <div style="height: 18mm; display: flex; width: 100%; margin-bottom: 1px;">
                <div style="width: 60%; display: flex; alignItems: center; border-right: 1px solid black; border-bottom: 1px solid black;">
                  <span class="company-name">
                    TELLER COMM<span class="reg-mark">®</span>
                  </span>
                </div>
                <div style="width: 40%; padding-left: 3mm; display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-end;">
                  <div class="doc-ref-box">${documentRef}</div>
                </div>
              </div>
            ` : `
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; border-bottom: 1px solid black; margin-bottom: 8px;">
                <span style="font-size: 10pt; font-weight: bold;">TELLER COMM® — Material Request (Cont.)</span>
                <span style="font-size: 8pt; font-style: italic;">${documentRef}</span>
              </div>
            `}

            <!-- BLOCK 2: Document Title Bar -->
            ${isFirstPage ? `
              <div class="title-bar">${documentTitle}</div>
            ` : ''}

            <!-- BLOCK 3: Project Info Grid -->
            ${isFirstPage ? `
              <div style="height: 28mm; display: flex; width: 100%; margin-bottom: 4px;">
                <div style="width: 60%; display: flex; flex-direction: column;">
                  <table style="width: 100%; height: 100%; border-collapse: collapse;">
                    <tr>
                      <td class="label-cell" style="border: 0.5pt solid black; padding: 2px 6px;">Date</td>
                      <td style="border: 0.5pt solid black; padding: 2px 6px;">${date}</td>
                    </tr>
                    <tr>
                      <td class="label-cell" style="border: 0.5pt solid black; padding: 2px 6px;">Project</td>
                      <td style="border: 0.5pt solid black; padding: 2px 6px;">${projectName}</td>
                    </tr>
                    <tr>
                      <td class="label-cell" style="border: 0.5pt solid black; padding: 2px 6px;">Customer</td>
                      <td style="border: 0.5pt solid black; padding: 2px 6px;">${customerName}</td>
                    </tr>
                    <tr>
                      <td class="label-cell" style="border: 0.5pt solid black; padding: 2px 6px;">Product</td>
                      <td style="border: 0.5pt solid black; padding: 2px 6px;">${productName}</td>
                    </tr>
                  </table>
                </div>
                <div style="width: 40%; display: flex; flex-direction: column; border-top: 0.5pt solid black; border-right: 0.5pt solid black; border-bottom: 0.5pt solid black;">
                  <div style="flex: 1; border-bottom: 0.5pt solid black; padding: 2px 8px; display: flex; align-items: center; font-size: 8pt;">
                    Cost Code #&nbsp;&nbsp;<span>${costCode || ''}</span>
                  </div>
                  <div style="flex: 1; padding: 2px 8px; display: flex; align-items: center; font-size: 8pt;">
                    Project Start&nbsp;&nbsp;<span>${startDate || ''}</span>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- BLOCK 4: Line Items Table -->
            <div style="flex: 1; display: flex; flex-direction: column;">
              <table class="items-table">
                <thead>
                  <tr style="height: 8mm;">
                    <th class="col-partcode" style="border: 1px solid black; font-size: 8pt; font-weight: bold; text-align: left; padding: 2px 4px;">Part Code #</th>
                    <th class="col-achead" style="border: 1px solid black; font-size: 7pt; font-weight: bold; text-align: center; padding: 1px 2px;">
                      A/C Head<br>
                      <span class="ac-head-sub">Actual</span>
                    </th>
                    <th class="col-items" style="border: 1px solid black; font-size: 8pt; font-weight: bold; text-align: left; padding: 2px 4px;">Items/Components</th>
                    <th class="col-qty" style="border: 1px solid black; font-size: 8pt; font-weight: bold; text-align: center; padding: 2px 2px;">Qty</th>
                    <th class="col-qtyreqd" style="border: 1px solid black; font-size: 8pt; font-weight: bold; text-align: center; padding: 2px 2px;">Qty Reqd</th>
                    <th class="col-qtyissd" style="border: 1px solid black; font-size: 8pt; font-weight: bold; text-align: center; padding: 2px 2px;">Qty Issd</th>
                    <th class="col-balance" style="border: 1px solid black; font-size: 8pt; font-weight: bold; text-align: center; padding: 2px 2px;">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageItems.map((item) => {
                    const isFullyIssued = (item.qtyIssd ?? 0) >= (item.qtyReqd ?? 0) && (item.qtyIssd ?? 0) > 0;
                    const isOverIssued = (item.qtyIssd ?? 0) > (item.qtyReqd ?? 0);
                    const formattedIssd = item.qtyIssd !== null && item.qtyIssd !== undefined
                      ? (isFullyIssued ? `✓ ${item.qtyIssd}` : isOverIssued ? `✗ ${item.qtyIssd}` : item.qtyIssd)
                      : '';
                    const formattedBalance = item.qtyIssd !== null && item.qtyIssd !== undefined
                      ? (isFullyIssued ? '✓ 0' : item.balance)
                      : '';

                    return `
                      <tr style="height: 6.5mm;">
                        <td class="col-partcode" style="border: 1px solid black; font-size: 7.5pt; font-weight: 500; padding: 2px 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${item.partCode}
                        </td>
                        <td class="col-achead" style="border: 1px solid black; font-size: 7.5pt; text-align: center; padding: 2px 2px;">
                          ${item.acHead || '14'}
                        </td>
                        <td class="col-items" style="border: 1px solid black; font-size: 7.5pt; padding: 2px 4px; overflow: hidden; text-overflow: ellipsis;">
                          ${item.itemsComponents}
                        </td>
                        <td class="col-qty" style="border: 1px solid black; font-size: 7.5pt; text-align: center; padding: 2px 2px;">
                          ${item.qty}
                        </td>
                        <td class="col-qtyreqd" style="border: 1px solid black; font-size: 7.5pt; text-align: center; padding: 2px 2px;">
                          ${item.qtyReqd}
                        </td>
                        <td class="col-qtyissd" style="border: 1px solid black; font-size: 7.5pt; text-align: center; padding: 2px 2px; font-weight: bold;">
                          ${formattedIssd}
                        </td>
                        <td class="col-balance" style="border: 1px solid black; font-size: 7.5pt; text-align: center; padding: 2px 2px; font-weight: bold; color: ${isOverIssued ? 'red' : isFullyIssued ? 'green' : 'black'};">
                          ${formattedBalance}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                  ${paddedRows.map(() => `
                    <tr class="empty-row" style="height: 6.5mm;">
                      <td style="border: 1px solid black;">&nbsp;</td>
                      <td style="border: 1px solid black;">&nbsp;</td>
                      <td style="border: 1px solid black;">&nbsp;</td>
                      <td style="border: 1px solid black;">&nbsp;</td>
                      <td style="border: 1px solid black;">&nbsp;</td>
                      <td style="border: 1px solid black;">&nbsp;</td>
                      <td style="border: 1px solid black;">&nbsp;</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- BLOCK 5: Signature Section -->
            ${isLastPage ? `
              <table class="sig-table">
                <tr>
                  <td>
                    <div class="sig-area">
                      ${signatures.indentedBy ? `<span class="sig-name">${signatures.indentedBy}</span>` : ''}
                    </div>
                    <div class="sig-divider"></div>
                    Indented By
                  </td>
                  <td>
                    <div class="sig-area">
                      ${signatures.receivedBy ? `<span class="sig-name">${signatures.receivedBy}</span>` : ''}
                    </div>
                    <div class="sig-divider"></div>
                    Received By
                  </td>
                  <td>
                    <div class="sig-area">
                      ${signatures.issuedBy ? `<span class="sig-name">${signatures.issuedBy}</span>` : ''}
                    </div>
                    <div class="sig-divider"></div>
                    Issued By
                    ${signatures.issuedDate || date ? `<span class="sig-date">${signatures.issuedDate || date}</span>` : ''}
                  </td>
                  <td>
                    <div class="sig-area">
                      ${signatures.reviewedBy ? `<span class="sig-name">${signatures.reviewedBy}</span>` : ''}
                    </div>
                    <div class="sig-divider"></div>
                    Reviewed By
                  </td>
                </tr>
              </table>
            ` : `
              <div style="height: 22mm;"></div>
            `}

            <div class="page-footer">
              Page ${pageNum} of ${totalPages}
            </div>
          </div>
        `;
      }).join('')}
    </body>
    </html>
  `;
};

export const generateBomPdf = asyncHandler(async (req: Request, res: Response) => {
  const { 
    projectId, 
    bomIds, 
    date, 
    batchSize, 
    signatures,
    projectName,
    customerName,
    productName,
    costCode,
    startDate,
    lineItemOverrides
  } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectBoms: {
        where: { bomId: { in: bomIds } },
        include: { bom: { include: { lineItems: true } } },
      },
    },
  });

  if (!project) throw new AppError('Project not found', 404);
  if (!project.projectBoms || project.projectBoms.length === 0) {
    throw new AppError('No project BOM found', 400);
  }

  const targetBom = project.projectBoms[0].bom;
  
  // Format metadata values safely
  const formattedProjectStart = startDate || (project.startDate ? new Date(project.startDate).toLocaleDateString("en-GB") : '');
  const formattedIssueDate = date || new Date().toLocaleDateString("en-GB");

  const finalBatchSize = Math.max(1, parseInt(batchSize) || project.batchSize || 1);

  const generationData = {
    projectName: projectName || project.projectName,
    customerName: customerName || project.customerName,
    productName: productName || project.productName,
    costCode: costCode || project.costCode,
    startDate: formattedProjectStart,
    date: formattedIssueDate,
    documentRef: targetBom.documentRef || "FM/STR/002/Ver 0",
    lineItems: targetBom.lineItems.map(item => {
      const override = lineItemOverrides?.find((o: any) => o.bomItemId === item.id);
      const qtyReqd = Math.max(0, override?.qtyReqd ?? (item.qty * finalBatchSize));
      const qtyIssd = override?.qtyIssd !== null && override?.qtyIssd !== undefined ? Math.max(0, parseFloat(override.qtyIssd) || 0) : null;
      const balance = Math.max(0, qtyReqd - (qtyIssd ?? 0));
      return {
        ...item,
        qtyReqd,
        qtyIssd,
        balance,
      };
    }),
    signatures: signatures || {},
  };

  const html = generateHtmlTemplate(generationData);

  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set viewports for high-res A4
    await page.setViewport({ 
      width: 794, 
      height: 1123, 
      deviceScaleFactor: 2 
    });

    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({ 
      format: 'A4', 
      landscape: false, 
      printBackground: true, 
      margin: { 
        top: '10mm', 
        bottom: '10mm', 
        left: '12mm', 
        right: '12mm' 
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false
    });
    await browser.close();

    // Save generation record
    await prisma.generationRecord.create({
      data: {
        projectId,
        bomId: targetBom.id,
        generatedBy: (req as any).user?.id || 'system',
        data: JSON.stringify(generationData),
      },
    });

    const safeProjCode = project.projectCode || "PROJ";
    const safeBomName = targetBom.bomName.replace(/\s+/g, "_");
    const safeDate = formattedIssueDate.replace(/[\/\.]/g, "-");

    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeProjCode}_${safeBomName}_BOM_${safeDate}.pdf"`);
    res.send(pdf);
  } catch (error) {
    logger.error('PDF Generation failed, returning HTML for preview:', error);
    res.status(200).send(html);
  }
});

export const generateBomExcel = asyncHandler(async (req: Request, res: Response) => {
  const { 
    projectId, 
    bomIds, 
    date, 
    batchSize, 
    projectName,
    customerName,
    productName,
    costCode,
    startDate,
    lineItemOverrides
  } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectBoms: {
        where: { bomId: { in: bomIds } },
        include: { bom: { include: { lineItems: true } } },
      },
    },
  });

  if (!project) throw new AppError('Project not found', 404);
  if (!project.projectBoms || project.projectBoms.length === 0) {
    throw new AppError('No project BOM found for linking', 400);
  }

  const targetBom = project.projectBoms[0].bom;

  // Process data
  const finalProjectName = projectName || project.projectName;
  const finalCustomerName = customerName || project.customerName;
  const finalProductName = productName || project.productName;
  const finalCostCode = costCode || project.costCode || '12.15.XX.1418';
  const finalProjectStart = startDate || (project.startDate ? new Date(project.startDate).toLocaleDateString("en-GB") : '');
  const finalDate = date || new Date().toLocaleDateString("en-GB");

  const finalBatchSize = Math.max(1, parseInt(batchSize) || 1);

  const activeItems = targetBom.lineItems.map(item => {
    const override = lineItemOverrides?.find((o: any) => o.bomItemId === item.id);
    const qtyReqd = Math.max(0, override?.qtyReqd ?? (item.qty * finalBatchSize));
    const qtyIssd = override?.qtyIssd !== null && override?.qtyIssd !== undefined ? Math.max(0, parseFloat(override.qtyIssd) || 0) : null;
    const balance = Math.max(0, qtyReqd - (qtyIssd ?? 0));
    return {
      partCode: item.partCode,
      acHead: item.acHead || '14',
      itemsComponents: item.itemsComponents,
      qty: item.qty,
      qtyReqd,
      qtyIssd,
      balance
    };
  });

  // Create workbook
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('FM-STR-002 BOM');

  // Page setup - Portrait, Fit to 1 page wide
  worksheet.pageSetup = {
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0
  };

  // Set columns
  worksheet.columns = [
    { header: 'Part Code #', key: 'partCode', width: 20 },
    { header: 'A/C Head', key: 'acHead', width: 12 },
    { header: 'Items/Components', key: 'itemsComponents', width: 45 },
    { header: 'Qty', key: 'qty', width: 10 },
    { header: 'Qty Reqd', key: 'qtyReqd', width: 15 },
    { header: 'Qty Issd', key: 'qtyIssd', width: 15 },
    { header: 'Balance', key: 'balance', width: 15 }
  ];

  // Title branding
  worksheet.mergeCells('A1:G1');
  const cellA1 = worksheet.getCell('A1');
  cellA1.value = 'TELLER COMM®';
  cellA1.font = { bold: true, size: 16, name: 'Arial' };
  cellA1.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(1).height = 30;

  // Title bar
  worksheet.mergeCells('A2:G2');
  const cellA2 = worksheet.getCell('A2');
  cellA2.value = 'Material Request & Issue Register (FM/STR/002/Ver 0)';
  cellA2.font = { bold: true, size: 11, name: 'Arial', color: { argb: 'FFFFFF' } };
  cellA2.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' } // Royal Blue
  };
  cellA2.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 25;

  // Info row 1
  worksheet.getRow(4).values = [
    `Date: ${finalDate}`,
    '',
    `Project: ${finalProjectName}`,
    '',
    `Cost Code: ${finalCostCode}`,
    '',
    ''
  ];
  worksheet.mergeCells('A4:B4');
  worksheet.mergeCells('C4:D4');
  worksheet.mergeCells('E4:G4');

  // Info row 2
  worksheet.getRow(5).values = [
    `Customer: ${finalCustomerName}`,
    '',
    `Product: ${finalProductName}`,
    '',
    `Project Start: ${finalProjectStart}`,
    '',
    ''
  ];
  worksheet.mergeCells('A5:B5');
  worksheet.mergeCells('C5:D5');
  worksheet.mergeCells('E5:G5');

  // Style info cells
  for (let r = 4; r <= 5; r++) {
    worksheet.getRow(r).height = 20;
    worksheet.getRow(r).eachCell((cell) => {
      cell.font = { size: 9, bold: true, name: 'Arial' };
      cell.alignment = { vertical: 'middle' };
    });
  }

  // Header row (Row 7)
  const headerRow = worksheet.getRow(7);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, name: 'Arial' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E5E7EB' } // Gray 200
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });

  // Populate data
  activeItems.forEach((item) => {
    const row = worksheet.addRow([
      item.partCode,
      item.acHead,
      item.itemsComponents,
      item.qty,
      item.qtyReqd,
      item.qtyIssd !== null ? item.qtyIssd : '',
      item.qtyIssd !== null ? item.balance : ''
    ]);

    row.height = 20;
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };

    row.eachCell((cell) => {
      cell.font = { size: 9, name: 'Arial' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'D1D5DB' } },
        left: { style: 'thin', color: { argb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
        right: { style: 'thin', color: { argb: 'D1D5DB' } }
      };
    });
  });

  // Excel filename
  const safeProjCode = project.projectCode || "PROJ";
  const safeProdCode = project.productCode || "PROD";
  const safeDate = finalDate.replace(/[\/\.]/g, '-');
  const filename = `${safeProjCode}_${safeProdCode}_BOM_${safeDate}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

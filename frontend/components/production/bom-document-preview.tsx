"use client";

import React from "react";

interface SignatureBlock {
  indentedBy?: string;
  receivedBy?: string;
  issuedBy?: string;
  reviewedBy?: string;
  issuedDate?: string;
}

interface LineItem {
  partCode: string;
  acHead?: string;
  itemsComponents: string;
  qty: number;
  qtyReqd?: number;
  qtyIssd?: number | null;
  balance?: number | null;
}

interface BOMDocumentPreviewProps {
  project?: {
    projectName: string;
    projectCode?: string | null;
    customerName: string;
    productName: string;
    costCode?: string | null;
    startDate?: string | null;
  } | null;
  bom?: {
    bomName: string;
    version?: string;
    documentRef?: string;
  } | null;
  lineItems: LineItem[];
  issueDate: string;
  batchSize: number;
  signatures: SignatureBlock;
  scale?: number;
}

// 96 DPI conversion ratio: 1mm = 3.78px
const MM_TO_PX = 3.78;

export default function BOMDocumentPreview({
  project,
  bom,
  lineItems = [],
  issueDate,
  batchSize = 1,
  signatures = {},
  scale = 1
}: BOMDocumentPreviewProps) {
  // Safe Fallbacks
  const documentRef = bom?.documentRef || "FM/STR/002/Ver 0";
  const projectName = project?.projectName || "";
  const customerName = project?.customerName || "";
  const productName = project?.productName || "";
  const costCode = project?.costCode || "12.15.XX.1418";
  const projectStart = project?.startDate 
    ? new Date(project.startDate).toLocaleDateString("en-GB") 
    : "";

  // Exact portrait title override env check
  const documentTitle = process.env.NEXT_PUBLIC_DOC_TITLE || "Material Request & Issue Register";

  // Recalculate quantities for preview
  const activeItems = lineItems.map((item) => {
    const qtyReqd = item.qtyReqd ?? (item.qty * batchSize);
    const qtyIssd = item.qtyIssd ?? 0;
    const balance = qtyReqd - qtyIssd;
    return {
      ...item,
      qtyReqd,
      qtyIssd,
      balance
    };
  });

  // Partitioning Algorithm for multi-page rendering
  // Page 1: Blocks 1, 2, 3 + Items (fits ~22 items cleanly on page 1)
  // Page 2+: repeating items header, no Blocks 1, 2, 3 (fits ~28 items)
  // Signature block is only on the final page at the bottom.
  const PAGE_1_MAX = 22;
  const PAGE_N_MAX = 28;

  const pages: LineItem[][] = [];
  if (activeItems.length === 0) {
    pages.push([]);
  } else {
    let currentSlice = activeItems.slice(0, PAGE_1_MAX);
    pages.push(currentSlice);
    
    let remaining = activeItems.slice(PAGE_1_MAX);
    while (remaining.length > 0) {
      currentSlice = remaining.slice(0, PAGE_N_MAX);
      pages.push(currentSlice);
      remaining = remaining.slice(PAGE_N_MAX);
    }
  }

  const totalPages = pages.length;

  const PAGE_WIDTH = 210 * MM_TO_PX; // ~794px (A4 Portrait Width)
  const PAGE_HEIGHT = 297 * MM_TO_PX; // ~1123px (A4 Portrait Height)

  return (
    <div className="flex flex-col items-center w-full print:gap-0 print:p-0">
      {pages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const pageNum = pageIdx + 1;

        // Pad list items to maintain consistent empty lines
        // Single page requires min 20 rows total.
        // Also always ensure 4 empty rows at the bottom of the items list.
        let displayItems = [...pageItems];
        const emptyRowsNeeded = isFirstPage
          ? Math.max(4, 20 - pageItems.length)
          : Math.max(4, PAGE_N_MAX - pageItems.length - (isLastPage ? 4 : 0)); // space for signature on last page

        const paddedRows = Array(emptyRowsNeeded).fill(null);

        return (
          <div
            key={pageIdx}
            className="print:my-0 print:shadow-none print:border-none"
            style={{
              width: `${PAGE_WIDTH * scale}px`,
              height: `${PAGE_HEIGHT * scale}px`,
              margin: "16px auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box"
            }}
          >
            <div
              className="bg-white text-black shadow-2xl relative select-none print:shadow-none print:p-0"
              style={{
                width: `${PAGE_WIDTH}px`,
                height: `${PAGE_HEIGHT}px`,
                paddingTop: `${10 * MM_TO_PX}px`,
                paddingBottom: `${10 * MM_TO_PX}px`,
                paddingLeft: `${12 * MM_TO_PX}px`,
                paddingRight: `${12 * MM_TO_PX}px`,
                fontFamily: "Arial, Helvetica, sans-serif",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                color: "#000000",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                flexShrink: 0
              }}
            >
            {/* BLOCK 1: Company Header (Only on Page 1) */}
            {isFirstPage ? (
              <div 
                style={{ 
                  height: `${18 * MM_TO_PX}px`, 
                  display: "flex", 
                  width: "100%",
                  marginBottom: "1px"
                }}
              >
                <div 
                  style={{ 
                    width: "60%", 
                    display: "flex", 
                    alignItems: "center",
                    borderRight: "1px solid black",
                    borderBottom: "1px solid black"
                  }}
                >
                  <span style={{ fontSize: "22pt", fontWeight: "bold", lineHeight: 1 }}>
                    TELLER COMM<sup style={{ fontSize: "12pt", verticalAlign: "super" }}>®</sup>
                  </span>
                </div>
                <div 
                  style={{ 
                    width: "40%", 
                    paddingLeft: `${3 * MM_TO_PX}px`, 
                    display: "flex", 
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-end"
                  }}
                >
                  <div 
                    style={{ 
                      width: "100%", 
                      border: "1px solid black", 
                      fontSize: "9pt", 
                      padding: "4px 8px", 
                      textAlign: "center",
                      fontWeight: "normal",
                      height: `${8 * MM_TO_PX}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {documentRef}
                  </div>
                </div>
              </div>
            ) : (
              // Continuation Page Header Spacer
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "4px", borderBottom: "1px solid black", marginBottom: "8px" }}>
                <span style={{ fontSize: "10pt", fontWeight: "bold" }}>TELLER COMM® — Material Request (Cont.)</span>
                <span style={{ fontSize: "8pt", fontStyle: "italic" }}>{documentRef}</span>
              </div>
            )}

            {/* BLOCK 2: Document Title Bar (Only on Page 1) */}
            {isFirstPage && (
              <div 
                style={{ 
                  height: `${7 * MM_TO_PX}px`, 
                  border: "1px solid black",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "10pt",
                  width: "100%",
                  backgroundColor: "white",
                  margin: "1px 0"
                }}
              >
                {documentTitle}
              </div>
            )}

            {/* BLOCK 3: Project Info Grid (Only on Page 1) */}
            {isFirstPage && (
              <div 
                style={{ 
                  height: `${28 * MM_TO_PX}px`,
                  display: "flex",
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "4px"
                }}
              >
                {/* Left 60% column with sub rows */}
                <div style={{ width: "60%", display: "flex", flexDirection: "column" }}>
                  {[
                    { label: "Date", value: issueDate },
                    { label: "Project", value: projectName },
                    { label: "Customer", value: customerName },
                    { label: "Product", value: productName }
                  ].map((row, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: "flex", 
                        flex: 1, 
                        borderLeft: "1px solid black", 
                        borderBottom: "1px solid black", 
                        borderRight: "1px solid black",
                        borderTop: idx === 0 ? "1px solid black" : "none",
                        fontSize: "8pt",
                        height: `${7 * MM_TO_PX}px`
                      }}
                    >
                      <div 
                        style={{ 
                          width: "25%", 
                          borderRight: "1px solid black", 
                          padding: "2px 6px", 
                          display: "flex", 
                          alignItems: "center", 
                          fontWeight: "normal" 
                        }}
                      >
                        {row.label}
                      </div>
                      <div 
                        style={{ 
                          width: "75%", 
                          padding: "2px 6px", 
                          display: "flex", 
                          alignItems: "center", 
                          fontWeight: "normal" 
                        }}
                      >
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right 40% column */}
                <div 
                  style={{ 
                    width: "40%", 
                    display: "flex", 
                    flexDirection: "column",
                    borderTop: "1px solid black",
                    borderRight: "1px solid black",
                    borderBottom: "1px solid black"
                  }}
                >
                  <div 
                    style={{ 
                      flex: 1, 
                      borderBottom: "1px solid black", 
                      padding: "2px 8px", 
                      display: "flex", 
                      alignItems: "center", 
                      fontSize: "8pt",
                      fontWeight: "normal" 
                    }}
                  >
                    Cost Code #&nbsp;&nbsp;<span style={{ fontWeight: "normal" }}>{costCode}</span>
                  </div>
                  <div 
                    style={{ 
                      flex: 1, 
                      padding: "2px 8px", 
                      display: "flex", 
                      alignItems: "center", 
                      fontSize: "8pt",
                      fontWeight: "normal" 
                    }}
                  >
                    Project Start&nbsp;&nbsp;<span style={{ fontWeight: "normal" }}>{projectStart}</span>
                  </div>
                </div>
              </div>
            )}

            {/* BLOCK 4: Line Items Table */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <table 
                style={{ 
                  width: "100%", 
                  borderCollapse: "collapse", 
                  tableLayout: "fixed" 
                }}
              >
                <thead>
                  <tr style={{ height: `${8 * MM_TO_PX}px` }}>
                    <th style={{ width: "14%", border: "1px solid black", fontSize: "8pt", fontWeight: "bold", textAlign: "left", padding: "2px 4px" }}>Part Code #</th>
                    <th style={{ width: "7%", border: "1px solid black", fontSize: "7pt", fontWeight: "bold", textAlign: "center", padding: "1px 2px" }}>
                      <div style={{ lineHeight: 1.1 }}>A/C Head</div>
                      <div style={{ fontSize: "6pt", fontWeight: "normal", fontStyle: "italic" }}>Actual</div>
                    </th>
                    <th style={{ width: "43%", border: "1px solid black", fontSize: "8pt", fontWeight: "bold", textAlign: "left", padding: "2px 4px" }}>Items/Components</th>
                    <th style={{ width: "6%", border: "1px solid black", fontSize: "8pt", fontWeight: "bold", textAlign: "center", padding: "2px 2px" }}>Qty</th>
                    <th style={{ width: "10%", border: "1px solid black", fontSize: "8pt", fontWeight: "bold", textAlign: "center", padding: "2px 2px" }}>Qty Reqd</th>
                    <th style={{ width: "10%", border: "1px solid black", fontSize: "8pt", fontWeight: "bold", textAlign: "center", padding: "2px 2px" }}>Qty Issd</th>
                    <th style={{ width: "10%", border: "1px solid black", fontSize: "8pt", fontWeight: "bold", textAlign: "center", padding: "2px 2px" }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item, idx) => {
                    const isFullyIssued = (item.qtyIssd ?? 0) >= (item.qtyReqd ?? 0) && (item.qtyIssd ?? 0) > 0;
                    const isOverIssued = (item.qtyIssd ?? 0) > (item.qtyReqd ?? 0);
                    
                    return (
                      <tr key={idx} style={{ height: `${6.5 * MM_TO_PX}px` }}>
                        <td style={{ border: "1px solid black", fontSize: "7.5pt", fontWeight: 500, padding: "2px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.partCode}
                        </td>
                        <td style={{ border: "1px solid black", fontSize: "7.5pt", textAlign: "center", padding: "2px 2px" }}>
                          {item.acHead || "14"}
                        </td>
                        <td style={{ border: "1px solid black", fontSize: "7.5pt", padding: "2px 4px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.itemsComponents}
                        </td>
                        <td style={{ border: "1px solid black", fontSize: "7.5pt", textAlign: "center", padding: "2px 2px" }}>
                          {item.qty}
                        </td>
                        <td style={{ border: "1px solid black", fontSize: "7.5pt", textAlign: "center", padding: "2px 2px" }}>
                          {item.qtyReqd}
                        </td>
                        <td style={{ border: "1px solid black", fontSize: "7.5pt", textAlign: "center", padding: "2px 2px", fontWeight: "bold" }}>
                          {item.qtyIssd !== null && item.qtyIssd !== undefined ? (
                            isFullyIssued ? `✓ ${item.qtyIssd}` : isOverIssued ? `✗ ${item.qtyIssd}` : item.qtyIssd
                          ) : ""}
                        </td>
                        <td 
                          style={{ 
                            border: "1px solid black", 
                            fontSize: "7.5pt", 
                            textAlign: "center", 
                            padding: "2px 2px",
                            fontWeight: "bold",
                            color: isOverIssued ? "red" : isFullyIssued ? "green" : "inherit"
                          }}
                        >
                          {item.qtyIssd !== null && item.qtyIssd !== undefined ? (
                            isFullyIssued ? "✓ 0" : item.balance
                          ) : ""}
                        </td>
                      </tr>
                    );
                  })}
                  {paddedRows.map((_, idx) => (
                    <tr key={`pad-${idx}`} style={{ height: `${6.5 * MM_TO_PX}px` }}>
                      <td style={{ border: "1px solid black" }}>&nbsp;</td>
                      <td style={{ border: "1px solid black" }}>&nbsp;</td>
                      <td style={{ border: "1px solid black" }}>&nbsp;</td>
                      <td style={{ border: "1px solid black" }}>&nbsp;</td>
                      <td style={{ border: "1px solid black" }}>&nbsp;</td>
                      <td style={{ border: "1px solid black" }}>&nbsp;</td>
                      <td style={{ border: "1px solid black" }}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* BLOCK 5: Signature Section (ONLY on the final page) */}
            {isLastPage ? (
              <div 
                style={{ 
                  height: `${22 * MM_TO_PX}px`, 
                  border: "1px solid black", 
                  width: "100%",
                  display: "flex",
                  marginTop: "6px"
                }}
              >
                {[
                  { title: "Indented By", name: signatures.indentedBy, date: null },
                  { title: "Received By", name: signatures.receivedBy, date: null },
                  { title: "Issued By", name: signatures.issuedBy, date: signatures.issuedDate || issueDate },
                  { title: "Reviewed By", name: signatures.reviewedBy, date: null }
                ].map((col, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      width: "25%", 
                      borderRight: idx === 3 ? "none" : "1px solid black", 
                      display: "flex", 
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxSizing: "border-box"
                    }}
                  >
                    {/* Blank space for handwritten signature with text overlay */}
                    <div 
                      style={{ 
                        height: `${12 * MM_TO_PX}px`, 
                        display: "flex", 
                        flexDirection: "column",
                        justifyContent: "center", 
                        alignItems: "center",
                        fontSize: "7pt",
                        color: "gray",
                        fontStyle: "italic",
                        padding: "1px 2px",
                        position: "relative"
                      }}
                    >
                      {col.name && (
                        <div style={{ color: "black", fontWeight: "bold", fontFamily: "Georgia, serif", fontSize: "9pt", transform: "rotate(-3deg)" }}>
                          {col.name}
                        </div>
                      )}
                    </div>
                    {/* Divider and Title */}
                    <div style={{ borderTop: "1px solid black", width: "100%" }}>
                      <div style={{ fontSize: "8pt", fontWeight: "bold", textAlign: "center", padding: "1px 0" }}>
                        {col.title}
                      </div>
                      {col.date && (
                        <div style={{ fontSize: "6.5pt", color: "black", textAlign: "center", paddingBottom: "1px" }}>
                          {col.date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Spacer to ensure absolute bottom elements align even when signature block is omitted
              <div style={{ height: `${22 * MM_TO_PX}px` }} />
            )}

            {/* Bottom Footer Page Numbers */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", fontSize: "7pt", color: "#666666", marginTop: "4px" }}>
              Page {pageNum} of {totalPages}
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

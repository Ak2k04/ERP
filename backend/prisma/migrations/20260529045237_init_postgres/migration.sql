-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "RefType" AS ENUM ('BOM_ISSUE', 'PO_RECEIPT', 'MANUAL_IN', 'MANUAL_OUT', 'ADJUSTMENT', 'RETURN', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PendingStatus" AS ENUM ('WAITING', 'READY', 'APPROVED', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PoStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('CRITICAL_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'STOCK_RECEIVED', 'MATERIAL_REQUESTED', 'PENDING_NOW_AVAILABLE', 'ISSUE_COMPLETED', 'PO_CONFIRMED', 'PO_OVERDUE', 'LEDGER_MISMATCH', 'NEW_VENDOR_ADDED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'INFO', 'LOW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "employeeId" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "category" TEXT,
    "storageLocation" TEXT,
    "partNumber" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "unitRate" DOUBLE PRECISION,
    "unit" TEXT,
    "currentStock" DOUBLE PRECISION,
    "minimumStock" DOUBLE PRECISION,
    "reorderLevel" DOUBLE PRECISION,
    "maximumStock" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bom" (
    "id" TEXT NOT NULL,
    "bomName" TEXT NOT NULL,
    "documentRef" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'Ver 0',
    "product" TEXT NOT NULL,
    "productCode" TEXT,
    "description" TEXT,
    "defaultAcHead" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomItem" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "materialId" TEXT,
    "partCode" TEXT NOT NULL,
    "acHead" TEXT,
    "itemsComponents" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "qtyReqd" DOUBLE PRECISION NOT NULL,
    "qtyIssd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BomItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomSignature" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "indentedBy" TEXT,
    "receivedBy" TEXT,
    "issuedBy" TEXT,
    "reviewedBy" TEXT,
    "issuedDate" TIMESTAMP(3),

    CONSTRAINT "BomSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectCode" TEXT,
    "customerName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productCode" TEXT,
    "costCode" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "batchSize" INTEGER,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectBom" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedById" TEXT NOT NULL,

    CONSTRAINT "ProjectBom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAssignee" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProjectAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfPath" TEXT,
    "data" TEXT NOT NULL,

    CONSTRAINT "GenerationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoresMaterial" (
    "id" TEXT NOT NULL,
    "storageLocation" TEXT,
    "partNumber" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "categoryId" TEXT,
    "unitRate" DOUBLE PRECISION,
    "unit" TEXT,
    "openingStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimumStock" DOUBLE PRECISION,
    "reorderLevel" DOUBLE PRECISION,
    "maximumStock" DOUBLE PRECISION,
    "lastMovementAt" TIMESTAMP(3),
    "lastMovementType" "MovementType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoresMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLedger" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "referenceType" "RefType",
    "referenceId" TEXT,
    "referenceCode" TEXT,
    "runningBalance" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedById" TEXT,
    "issuedAt" TIMESTAMP(3),
    "status" "IssueStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "IssueRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueItem" (
    "id" TEXT NOT NULL,
    "issueRequestId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "partCode" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "qtyRequired" DOUBLE PRECISION NOT NULL,
    "qtyIssued" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtyPending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isFullyIssued" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IssueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingIssue" (
    "id" TEXT NOT NULL,
    "issueRequestId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "qtyPending" DOUBLE PRECISION NOT NULL,
    "status" "PendingStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "paymentTerms" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "ifscCode" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "deliverTo" TEXT,
    "poDate" TIMESTAMP(3) NOT NULL,
    "expectedDelivery" TIMESTAMP(3),
    "notes" TEXT,
    "status" "PoStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstPercent" DOUBLE PRECISION NOT NULL DEFAULT 9,
    "cgstPercent" DOUBLE PRECISION NOT NULL DEFAULT 9,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "materialId" TEXT,
    "description" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "qtyReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoReceipt" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "receivedById" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "PoReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoReceiptItem" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "poItemId" TEXT NOT NULL,
    "qtyReceived" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PoReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "referenceId" TEXT,
    "refType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Token_tokenHash_key" ON "Token"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_partNumber_key" ON "Material"("partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Bom_bomName_key" ON "Bom"("bomName");

-- CreateIndex
CREATE UNIQUE INDEX "BomSignature_bomId_key" ON "BomSignature"("bomId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectName_key" ON "Project"("projectName");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectBom_projectId_bomId_key" ON "ProjectBom"("projectId", "bomId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAssignee_projectId_userId_key" ON "ProjectAssignee"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StoresMaterial_partNumber_key" ON "StoresMaterial"("partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorName_key" ON "Vendor"("vendorName");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomSignature" ADD CONSTRAINT "BomSignature_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBom" ADD CONSTRAINT "ProjectBom_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBom" ADD CONSTRAINT "ProjectBom_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAssignee" ADD CONSTRAINT "ProjectAssignee_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationRecord" ADD CONSTRAINT "GenerationRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationRecord" ADD CONSTRAINT "GenerationRecord_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoresMaterial" ADD CONSTRAINT "StoresMaterial_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLedger" ADD CONSTRAINT "DailyLedger_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "StoresMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueItem" ADD CONSTRAINT "IssueItem_issueRequestId_fkey" FOREIGN KEY ("issueRequestId") REFERENCES "IssueRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueItem" ADD CONSTRAINT "IssueItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "StoresMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingIssue" ADD CONSTRAINT "PendingIssue_issueRequestId_fkey" FOREIGN KEY ("issueRequestId") REFERENCES "IssueRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "StoresMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoReceipt" ADD CONSTRAINT "PoReceipt_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoReceiptItem" ADD CONSTRAINT "PoReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PoReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

# POS Finance Flow (End-to-End)

This document explains the complete finance flow in the current POS system, from product costing and stock intake to sale booking, refunds, audit trails, and reporting.

---

## 1) Objective

Build a reliable financial flow that ensures:

- Stock is controlled and valued correctly.
- Sales totals (subtotal, tax, discount, total) are trustworthy.
- Refund/cancel operations are traceable.
- Offline sales are synchronized safely.
- Reports match operational transactions.

---

## 2) Roles and Responsibilities

- **Store Admin**
  - Creates/updates products.
  - Adds inventory batches with cost/price.
  - Performs stock adjustments.
  - Reviews store-level reports and audit logs.
  - Cancels sales.

- **Cashier**
  - Creates sales at terminal.
  - Uses barcode scanning/product search.
  - Sends receipt emails.
  - Can process refund route as currently configured.
  - Triggers offline sync when reconnecting.

- **Accountant**
  - Reads sales and inventory reports.
  - Uses reporting for reconciliation.

- **Super Admin**
  - Global-level overview and audit visibility.

---

## 3) Core Finance Entities (Conceptual)

- **Product**
  - Master record: name, SKU, barcode, current pricing fields, tax/discount, etc.

- **Product Batch**
  - Lot-level finance unit:
    - purchase price
    - selling price
    - tax/discount percentages
    - quantity received/remaining
  - Enables FIFO consumption and better cost traceability.

- **Inventory Stock**
  - Current total on-hand quantity per product.

- **Inventory Log**
  - Immutable movement history (sale, opening stock, adjustment, damage, etc.).

- **Sale / SaleItem**
  - Financial transaction and line items.
  - `SaleItem` links to `batchId` in current flow for lot-level traceability.

- **Audit Log**
  - Compliance trail for sensitive actions (login/logout, product updates, sales actions, etc.).

- **Sync Log**
  - Tracks offline sync batch results.

---

## 4) API Surface for Finance Flow

Base URL: `/api/v1`

### 4.1 Product and Costing Setup

- `POST /products` (Store Admin)
  - Create product + opening batch + opening stock + opening inventory log.

- `PATCH /products/:id` (Store Admin)
  - Update product master fields (price/tax/discount/reorder/etc.).

- `POST /products/:id/batch` (Store Admin)
  - Add new inventory batch with:
    - `purchasePrice`
    - `sellingPrice`
    - `taxPercentage`
    - `discountPercentage`
    - `quantityReceived`
    - optional `batchNumber`, `expiryDate`
  - Increases stock and updates finance state.

### 4.2 Inventory Control

- `GET /inventory` (Store Admin/Cashier/Accountant)
- `GET /inventory?lowStock=true`
- `GET /inventory/logs` (Store Admin/Accountant)
- `POST /inventory/adjust` (Store Admin)

### 4.3 Sales and Settlement

- `POST /sales` (Store Admin/Cashier)
  - Requires `x-idempotency-key`.
  - Performs stock locking + FIFO batch allocation + financial calculations.

- `GET /sales`
- `GET /sales/:id`
- `GET /sales/invoice/:invoiceNumber`
- `GET /sales/shift-summary`
- `POST /sales/:id/email-receipt`
- `PATCH /sales/:id/cancel` (Store Admin)
- `POST /sales/:id/refund` (current route allows Store Admin + Cashier)

### 4.4 Reporting and Compliance

- `GET /reports/sales`
- `GET /reports/inventory`
- `GET /reports/storeadmin/dashboard`
- `GET /reports/superadmin/overview`
- `GET /reports/audit-logs`

### 4.5 Offline Sync

- `POST /sync/sales`
  - Sync pending offline sales in batch with server-side validation.

---

## 5) End-to-End Lifecycle

## Step A: Product Onboarding

1. Store admin creates product with opening stock.
2. System creates:
   - product master
   - opening batch
   - inventory stock
   - opening inventory log
3. Product is now available for barcode scanning and sale.

## Step B: New Purchase / Replenishment

1. Store admin adds a batch (`POST /products/:id/batch`) when new inventory arrives.
2. Batch records exact purchase and selling values.
3. Total stock increases.
4. Finance can now distinguish older and newer stock at lot level.

## Step C: Cashier Sale

1. Cashier selects terminal device and keeps heartbeat alive.
2. Product is added by:
   - barcode lookup (`GET /products/barcode/:barcodeValue`), or
   - manual search (`GET /products?search=...`)
3. Cashier submits sale with idempotency key.
4. Backend:
   - validates request and device
   - locks inventory rows (concurrency safety)
   - allocates quantity from oldest available batches (FIFO)
   - computes subtotal, tax, discount, total
   - creates sale and sale-items
   - decrements batch quantity + total stock
   - writes inventory and audit logs
5. Receipt is generated/sent.

## Step D: Cancellation / Refund

1. If reversal is needed:
   - cancel sale (admin)
   - or refund sale (as per route policy)
2. System records reversal actions and keeps financial traceability.

## Step E: Reporting

1. Sales report provides revenue, discounts, taxes, transactions by period.
2. Inventory report provides low stock, stock valuation indicators.
3. Dashboard gives operational finance KPIs.
4. Audit logs provide accountability for actions.

## Step F: Offline Scenario

1. Cashier records sales locally when internet is unavailable.
2. On reconnect, client sends batch to `/sync/sales`.
3. Server validates products, stock, idempotency, invoice collisions.
4. Sync result returns successful and failed records.
5. Sync log and audit trail preserve accountability.

---

## 6) Financial Control Rules in Current Backend

- **Idempotency enforced** on sale creation to avoid duplicate billing.
- **Server-side totals** are recalculated, not blindly trusted from UI.
- **Stock lock inside transaction** prevents race-condition overselling.
- **FIFO batch fulfillment** gives better cost movement tracking.
- **Audit logging** captures critical lifecycle events.
- **Sync safeguards** include batch-size limit and collision handling.

---

## 7) Example Scenario (Old vs New Cost)

Scenario:

- Week 1 batch: Tea Bag qty 10 at purchase 100
- Week 2 batch: Tea Bag qty 10 at purchase 80

When cashier sells:

- System consumes from oldest batch first (FIFO), then next batch.
- This is more accurate than single static cost overwrite.
- Finance can later analyze movement and margin with better confidence.

---

## 8) Reconciliation Checklist (Daily/Weekly)

- Match `sales` totals with shift summary.
- Verify no unusual failed sync batches.
- Review refunds/cancellations count and amount.
- Track negative or near-zero stock risks from inventory report.
- Spot-check audit logs for sensitive actions:
  - user status changes
  - product pricing changes
  - cancellations/refunds
  - login/logout anomalies

---

## 9) Known Gaps / Future Enhancements

- Enforce role policy for refunds if business requires admin-only reversal.
- Add dedicated COGS and gross margin reporting endpoints.
- Add batch aging/expiry and near-expiry financial impact report.
- Add monthly close report (sales, tax liability, discount leakage, stock valuation delta).

---

## 10) Quick Reference Summary

- Stock-in updates finance through product batches.
- Sales consume stock in FIFO and write immutable movement logs.
- Reports and audit logs provide visibility and control.
- Offline sync keeps sales continuity without losing traceability.

This is the current end-to-end finance flow architecture for the POS.

---

## 11) cURL Reference (Finance APIs)

Use these variables first:

```bash
BASE_URL="http://localhost:3000/api/v1"
TOKEN="<ACCESS_TOKEN>"
```

### 11.1 Create Product (Opening stock + opening batch)

```bash
curl -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -F "categoryId=CATEGORY_ID" \
  -F "name=Tea Bag" \
  -F "sku=TEA-001" \
  -F "barcode=8900000001111" \
  -F "purchasePrice=100" \
  -F "sellingPrice=130" \
  -F "taxPercentage=5" \
  -F "discountPercentage=0" \
  -F "reorderLevel=10" \
  -F "initialStock=20" \
  -F "image=@/path/to/image.jpg"
```

### 11.2 Update Product Master Pricing

```bash
curl -X PATCH "$BASE_URL/products/PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchasePrice": 95,
    "sellingPrice": 125,
    "taxPercentage": 5,
    "discountPercentage": 2
  }'
```

### 11.3 Add New Inventory Batch

```bash
curl -X POST "$BASE_URL/products/PRODUCT_ID/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchasePrice": 80,
    "sellingPrice": 120,
    "taxPercentage": 5,
    "discountPercentage": 0,
    "quantityReceived": 30,
    "batchNumber": "TB-2026-03-A",
    "expiryDate": "2027-03-31"
  }'
```

### 11.4 Stock Levels

```bash
curl "$BASE_URL/inventory" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.5 Low Stock Only

```bash
curl "$BASE_URL/inventory?lowStock=true" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.6 Inventory Logs

```bash
curl "$BASE_URL/inventory/logs?limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.7 Manual Stock Adjustment

```bash
curl -X POST "$BASE_URL/inventory/adjust" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "changeType": "ADJUSTMENT",
    "quantity": 5,
    "notes": "Physical recount correction"
  }'
```

### 11.8 Create Sale (idempotent)

```bash
curl -X POST "$BASE_URL/sales" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: sale-20260314-001" \
  -d '{
    "deviceId": "DEVICE_ID",
    "paymentMethod": "CASH",
    "discountAmount": 10,
    "notes": "Walk-in",
    "items": [
      { "productId": "PRODUCT_ID", "quantity": 2, "price": 120 }
    ]
  }'
```

### 11.9 Sales List

```bash
curl "$BASE_URL/sales?startDate=2026-03-01&endDate=2026-03-31&limit=50&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.10 Get Sale by ID

```bash
curl "$BASE_URL/sales/SALE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.11 Get Sale by Invoice Number

```bash
curl "$BASE_URL/sales/invoice/INV-20260314-000001" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.12 Shift Summary

```bash
curl "$BASE_URL/sales/shift-summary?startDate=2026-03-14&endDate=2026-03-14" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.13 Email Receipt

```bash
curl -X POST "$BASE_URL/sales/SALE_ID/email-receipt" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerEmail":"customer@example.com"}'
```

### 11.14 Cancel Sale

```bash
curl -X PATCH "$BASE_URL/sales/SALE_ID/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Wrong bill"}'
```

### 11.15 Refund Sale

```bash
curl -X POST "$BASE_URL/sales/SALE_ID/refund" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Customer returned item"}'
```

### 11.16 Sales Report

```bash
curl "$BASE_URL/reports/sales?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.17 Inventory Report

```bash
curl "$BASE_URL/reports/inventory" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.18 Store Admin Dashboard Report

```bash
curl "$BASE_URL/reports/storeadmin/dashboard?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.19 Audit Logs (finance/compliance trace)

```bash
curl "$BASE_URL/reports/audit-logs?action=CREATE_SALE&limit=100&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

### 11.20 Offline Sync Sales

```bash
curl -X POST "$BASE_URL/sync/sales" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchId":"BATCH-20260314-01",
    "deviceId":"DEVICE_ID",
    "sales":[
      {
        "saleId":"local-1",
        "invoiceNumber":"OFF-INV-001",
        "idempotencyKey":"offline-key-001",
        "discountAmount":0,
        "paymentMethod":"CASH",
        "offlineCreatedAt":"2026-03-14T08:30:00.000Z",
        "items":[
          {"productId":"PRODUCT_ID","quantity":1,"price":120}
        ]
      }
    ]
  }'
```

export interface SaleTransaction {
  id: string
  invoiceNumber: string
  saleId?: string // Optional for backward compatibility if any old data exists
  createdAt: string
  date?: string // Optional alias for backward compatibility
  customer?: string // Fallback Guest
  subtotal: number
  discountAmount: number
  totalTax: number
  totalAmount: number
  paymentMethod: string
  status: "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED" | string
  paymentStatus?: string // Explicit backend field
  user?: { name: string }
  _count?: { saleItems: number }
}

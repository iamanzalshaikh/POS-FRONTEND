import api from "./api";

/**
 * Products API Module
 * Handles product creation, updates, and batch management
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CreateProductData {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  purchasePrice?: number;
  sellingPrice?: number;
  taxPercentage?: number;
  discountPercentage?: number;
  reorderLevel?: number;
  initialStock?: number;
  description?: string;
}

export interface AddBatchData {
  quantityReceived: number;
  purchasePrice: number;
  sellingPrice: number;
  taxPercentage?: number;
  discountPercentage?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  purchasePrice: number;
  sellingPrice: number;
  taxPercentage: number;
  discountPercentage: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  inventoryStock?: {
    totalQuantity: number;
  };
  category?: {
    id: string;
    name: string;
  };
}

// ============================================================================
// PRODUCT CRUD
// ============================================================================

export const fetchProducts = async (params?: Record<string, any>) => {
  console.log('📦 [Products API] Calling GET /products...');
  try {
    const response = await api.get("/products", { params });
    console.log('📦 [Products API] Response:', response);
    return response.data;
  } catch (error: any) {
    console.error('❌ [Products API] Error:', error);
    throw error;
  }
};

export const fetchTopProducts = () => {
  return api.get("/products/top").then(res => res.data);
};

/**
 * Creates a new product with optional opening stock
 * Backend automatically handles:
 * - Opening batch creation
 * - Inventory stock initialization
 * - Inventory log entry
 */
export const createProduct = async (data: CreateProductData | FormData) => {
  console.log('📦 [Products API] Creating product:', data);
  try {
    const response = await api.post("/products", data);
    console.log('✅ [Products API] Product created:', response.data);
    return response;
  } catch (error: any) {
    console.error('❌ [Products API] Failed to create product:', error);
    throw error;
  }
};

export const createProductMaster = async (data: Omit<CreateProductData, "purchasePrice" | "sellingPrice" | "initialStock" | "reorderLevel" | "discountPercentage" | "taxPercentage">) => {
  return createProduct({
    ...data,
    purchasePrice: 0,
    sellingPrice: 0,
    initialStock: 0,
    reorderLevel: 0,
    discountPercentage: 0,
    taxPercentage: 18,
  });
};

export const updateProduct = (id: string, data: FormData) => {
  return api.patch(`/products/${id}`, data).then(res => res.data);
};

export const deleteProduct = (id: string) => {
  return api.delete(`/products/${id}`).then(res => res.data);
};

export const getProductByBarcode = (barcode: string, deviceId?: string | null) => {
  return api.get(`/products/barcode/${encodeURIComponent(barcode)}`, {
    headers: deviceId ? { "x-device-id": deviceId } : undefined,
  }).then(res => res.data);
};

export const searchProducts = (query: string) => {
  return api.get(`/products`, { params: { search: query } }).then(res => res.data);
};

export const addBatch = (id: string, data: any) => {
  return api.post(`/products/${id}/batch`, data);
};

// ============================================================================
// BATCH MANAGEMENT
// ============================================================================

/**
 * Adds a new batch to an existing product
 * Updates inventory stock and creates inventory log
 */
export const addProductBatch = async (productId: string, data: AddBatchData) => {
  console.log('📦 [Products API] Adding batch to product:', productId, data);
  try {
    const response = await api.post(`/products/${productId}/batch`, data);
    console.log('✅ [Products API] Batch added:', response.data);
    return response;
  } catch (error: any) {
    console.error('❌ [Products API] Failed to add batch:', error);
    throw error;
  }
};

/**
 * Fetches product details with stock information
 */
export const getProductById = async (productId: string) => {
  console.log('📦 [Products API] Fetching product:', productId);
  try {
    const response = await api.get(`/products/${productId}`);
    console.log('✅ [Products API] Product fetched:', response.data);
    return response;
  } catch (error: any) {
    console.error('❌ [Products API] Failed to fetch product:', error);
    throw error;
  }
};

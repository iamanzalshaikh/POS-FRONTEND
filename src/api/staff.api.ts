import api from '../service/api';

// ============================================================================
// TYPES
// ============================================================================

export interface StaffMember {
  id: string;
  displayId?: string;
  storeId: string;
  name: string;
  phone?: string | null;
  role: string;
  monthlySalary: number | string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface StaffApiResponse {
  success: boolean;
  data: StaffMember[];
  message?: string;
}

export interface StaffPaginatedResponse {
  success: boolean;
  data: {
    items: StaffMember[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface CreateStaffData {
  name: string;
  role: string;
  monthlySalary: number;
  joiningDate: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateStaffData extends Partial<CreateStaffData> {}

// ============================================================================
// PAYROLL TYPES
// ============================================================================

export type PayrollStatus = 'PAID' | 'UNPAID' | 'PARTIAL';

export interface PayrollRecord {
  id: string;
  displayId?: string;
  storeId: string;
  staffId: string;
  year: number;
  month: number;
  salary: number;
  amountPaid: number;
  status: PayrollStatus;
  paymentDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: string;
    name: string;
    role: string;
    phone?: string | null;
  };
}

export interface PayrollPaginatedResponse {
  success: boolean;
  data: {
    items: PayrollRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface CreatePayrollData {
  staffId: string;
  month: number;
  year: number;
  salary?: number;
  amountPaid?: number;
  status?: PayrollStatus;
  paymentDate?: string;
  notes?: string;
}

export interface UpdatePayrollData {
  amountPaid?: number;
  paymentDate?: string;
  notes?: string;
  status?: PayrollStatus;
}

export interface PayrollHistoryResponse {
  success: boolean;
  data: {
    staff: {
      id: string;
      name: string;
      role: string;
    };
    filters: {
      year: number | null;
      month: number | null;
    };
    totalPaid: number;
    records: PayrollRecord[];
  };
  message?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch all staff members
 */
export const getStaff = async (params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<StaffPaginatedResponse> => {
  const response = await api.get<any>('/staff', { params });

  // Handle paginated response
  if (response.data?.data?.items) {
    const normalized = response.data.data.items.map((item: StaffMember) => ({
      ...item,
      monthlySalary: Number(item.monthlySalary),
    }));
    return {
      success: true,
      data: {
        ...response.data.data,
        items: normalized,
      },
    };
  }

  return {
    success: false,
    data: { items: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } },
    message: response.data?.message || 'Failed to fetch staff',
  };
};

/**
 * Get staff summary
 */
export const getStaffSummary = async (): Promise<{
  success: boolean;
  data: {
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    totalMonthlySalary: number;
  };
}> => {
  const response = await api.get<any>('/staff/summary');
  return {
    success: true,
    data: response.data?.data || response.data,
  };
};

/**
 * Create a new staff member
 */
export const createStaff = async (data: CreateStaffData): Promise<StaffApiResponse> => {
  const response = await api.post<any>('/staff', data);
  return {
    success: true,
    data: [response.data?.data || response.data],
    message: response.data?.message || 'Staff member created successfully',
  };
};

/**
 * Update an existing staff member
 */
export const updateStaff = async (
  id: string,
  data: UpdateStaffData
): Promise<StaffApiResponse> => {
  const response = await api.patch<any>(`/staff/${id}`, data);
  return {
    success: true,
    data: [response.data?.data || response.data],
    message: response.data?.message || 'Staff member updated successfully',
  };
};

/**
 * Delete a staff member
 */
export const deleteStaff = async (id: string): Promise<StaffApiResponse> => {
  const response = await api.delete<any>(`/staff/${id}`);
  return {
    success: true,
    data: [],
    message: response.data?.message || 'Staff member deleted successfully',
  };
};

/**
 * Get a single staff member by ID
 */
export const getStaffById = async (id: string): Promise<StaffApiResponse> => {
  const response = await api.get<any>(`/staff/${id}`);
  return {
    success: true,
    data: [response.data?.data || response.data],
  };
};

// ============================================================================
// PAYROLL API FUNCTIONS
// ============================================================================

/**
 * Fetch payroll records with pagination and filters
 */
export const getPayroll = async (params?: {
  staffId?: string;
  month?: number;
  year?: number;
  status?: PayrollStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PayrollPaginatedResponse> => {
  const response = await api.get<any>('/staff/payroll', { params });

  if (response.data?.data?.items) {
    const normalized = response.data.data.items.map((item: PayrollRecord) => ({
      ...item,
      salary: Number(item.salary),
      amountPaid: Number(item.amountPaid),
    }));
    return {
      success: true,
      data: {
        ...response.data.data,
        items: normalized,
      },
    };
  }

  return {
    success: false,
    data: { items: [], pagination: { total: 0, page: 1, limit: 30, totalPages: 0 } },
    message: response.data?.message || 'Failed to fetch payroll records',
  };
};

/**
 * Create a payroll record for a staff member
 */
export const createPayroll = async (data: CreatePayrollData): Promise<{
  success: boolean;
  data: PayrollRecord;
  message?: string;
}> => {
  const response = await api.post<any>('/staff/payroll', data);
  const record = response.data?.data || response.data;
  return {
    success: true,
    data: {
      ...record,
      salary: Number(record.salary),
      amountPaid: Number(record.amountPaid),
    },
    message: response.data?.message || 'Payroll record created successfully',
  };
};

/**
 * Update a payroll record (partial payments, status, notes)
 */
export const updatePayroll = async (
  payrollId: string,
  data: UpdatePayrollData
): Promise<{
  success: boolean;
  data: PayrollRecord;
  message?: string;
}> => {
  const response = await api.patch<any>(`/staff/payroll/${payrollId}`, data);
  const record = response.data?.data || response.data;
  return {
    success: true,
    data: {
      ...record,
      salary: Number(record.salary),
      amountPaid: Number(record.amountPaid),
    },
    message: response.data?.message || 'Payroll record updated successfully',
  };
};

/**
 * Get full payroll history for a specific staff member
 */
export const getStaffPayrollHistory = async (
  staffId: string,
  params?: { year?: number; month?: number }
): Promise<PayrollHistoryResponse> => {
  const response = await api.get<any>(`/staff/${staffId}/payroll-history`, { params });
  const data = response.data?.data || response.data;
  return {
    success: true,
    data: {
      ...data,
      totalPaid: Number(data.totalPaid),
      records: (data.records || []).map((r: PayrollRecord) => ({
        ...r,
        salary: Number(r.salary),
        amountPaid: Number(r.amountPaid),
      })),
    },
    message: response.data?.message || 'Payroll history retrieved successfully',
  };
};

// ============================================================================
// ALIAS EXPORTS (for store-admin StaffManagementPage compatibility)
// ============================================================================

/** Alias for getStaff — used by store-admin staff management */
export const fetchStaffMembers = async (params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<StaffPaginatedResponse> => {
  // Store-admin manages system users (login accounts), not HR staff
  const response = await api.get<any>('/users', { params });

  const data = response.data?.data || response.data;
  let items: StaffMember[] = [];
  let pagination = { total: 0, page: 1, limit: 20, totalPages: 0 };

  if (data?.items) {
    items = data.items.map((u: any) => ({
      id: u.id,
      storeId: u.storeId,
      name: u.name,
      phone: u.phone || null,
      role: u.role,
      monthlySalary: 0,
      joiningDate: u.createdAt || new Date().toISOString(),
      status: u.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    pagination = data.pagination || pagination;
  } else if (Array.isArray(data)) {
    items = data.map((u: any) => ({
      id: u.id,
      storeId: u.storeId,
      name: u.name,
      phone: u.phone || null,
      role: u.role,
      monthlySalary: 0,
      joiningDate: u.createdAt || new Date().toISOString(),
      status: u.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    pagination = { total: items.length, page: 1, limit: items.length, totalPages: 1 };
  }

  return {
    success: true,
    data: { items, pagination },
  };
};

/** Alias for createStaff — used by store-admin staff management */
export const createStaffMember = async (data: any): Promise<StaffApiResponse> => {
  // Store-admin creates system users (login accounts), not HR staff members
  // Use /users endpoint instead of /staff
  const response = await api.post<any>('/users', {
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role || 'CASHIER',
    isActive: data.isActive !== undefined ? data.isActive : true,
    assignedTerminalIds: data.assignedTerminalIds,
  });
  return {
    success: true,
    data: [response.data?.data || response.data],
    message: response.data?.message || 'Staff member created successfully',
  };
};

/** Alias for updateStaff — used by store-admin staff management */
export const updateStaffMember = async (
  id: string,
  data: any
): Promise<StaffApiResponse> => {
  // Store-admin updates system users (login accounts)
  const payload: Record<string, any> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.role !== undefined) payload.role = data.role;
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  if (data.password) payload.password = data.password;
  if (data.assignedTerminalIds !== undefined) payload.assignedTerminalIds = data.assignedTerminalIds;

  const response = await api.patch<any>(`/users/${id}`, payload);
  return {
    success: true,
    data: [response.data?.data || response.data],
    message: response.data?.message || 'Staff member updated successfully',
  };
};

/** Re-export for store-admin compatibility */
export type CreateStaffInput = CreateStaffData;
export type StaffRole = string;
export type StaffStatus = 'ACTIVE' | 'INACTIVE';

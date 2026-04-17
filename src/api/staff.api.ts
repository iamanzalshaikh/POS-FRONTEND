import api from '../service/api';

// ============================================================================
// TYPES
// ============================================================================

export type StaffStatus = 'ACTIVE' | 'INACTIVE';

export interface StaffMember {
  id: string;
  displayId?: string;
  storeId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  cnic?: string | null;
  fatherHusbandName?: string | null;
  dateOfBirth?: string | null;
  joiningDate: string;
  role: string;
  roleTitle?: string | null;
  baseSalary: number | string;
  monthlySalary: number | string;
  status: StaffStatus;
  address?: string | null;
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
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  cnic?: string;
  fatherHusbandName?: string;
  dateOfBirth?: string;
  joiningDate?: string;
  role: string;
  roleTitle?: string;
  baseSalary: number;
  status?: StaffStatus;
  address?: string;
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
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  amountPaid: number;
  status: PayrollStatus;
  paymentDate: string | null;
  paymentMethod?: string;
  referenceNumber?: string | null;
  receiptNumber?: string | null;
  notes: string | null;
  expenseId?: string | null;
  processedById?: string | null;
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: string;
    displayId?: string;
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
  bonus?: number;
  deductions?: number;
  paymentMethod?: string;
  referenceNumber?: string;
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
  role?: string;
  page?: number;
  limit?: number;
}): Promise<StaffPaginatedResponse> => {
  const response = await api.get<any>('/staff', { params });

  if (response.data?.data?.items) {
    const normalized = response.data.data.items.map((item: any) => ({
      ...item,
      baseSalary: Number(item.baseSalary),
      monthlySalary: Number(item.monthlySalary),
    }));
    return {
      success: true,
      data: {
        ...response.data.data,
        items: normalized,
      },
    };
  } else if (response.data?.items) {
    const normalized = response.data.items.map((item: any) => ({
      ...item,
      baseSalary: Number(item.baseSalary),
      monthlySalary: Number(item.monthlySalary),
    }));
    return {
      success: true,
      data: {
        ...response.data,
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
 * Delete a staff member (Soft delete)
 */
export const deleteStaff = async (id: string): Promise<StaffApiResponse> => {
  const response = await api.delete<any>(`/staff/${id}`);
  return {
    success: true,
    data: [],
    message: response.data?.message || 'Staff member deactivated successfully',
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

/**
 * Get staff member detail (User account with activity/sessions)
 * Used by StaffDetailPage.tsx
 */
export const fetchStaffMemberById = async (id: string): Promise<any> => {
  return api.get(`/users/${id}`);
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

  const root = response.data?.data || response.data;
  let items: any[] = [];
  let pagination = { total: 0, page: 1, limit: 30, totalPages: 1 };

  if (Array.isArray(root)) {
    items = root;
    pagination.total = root.length;
  } else if (root && Array.isArray(root.items)) {
    items = root.items;
    pagination = root.pagination || pagination;
  }

  const normalized = items.map((item: any) => ({
    ...item,
    baseSalary: Number(item.baseSalary || 0),
    bonus: Number(item.bonus || 0),
    deductions: Number(item.deductions || 0),
    netSalary: Number(item.netSalary || 0),
    amountPaid: Number(item.amountPaid || 0),
  }));

  return {
    success: true,
    data: {
      items: normalized,
      pagination,
    },
  };
};

/**
 * Get a single payroll record by ID
 */
export const getPayrollById = async (payrollId: string): Promise<{
  success: boolean;
  data: PayrollRecord;
}> => {
  const response = await api.get<any>(`/staff/payroll/${payrollId}`);
  const record = response.data?.data || response.data;
  return {
    success: true,
    data: {
      ...record,
      baseSalary: Number(record.baseSalary),
      bonus: Number(record.bonus || 0),
      deductions: Number(record.deductions || 0),
      netSalary: Number(record.netSalary),
      amountPaid: Number(record.amountPaid),
    },
  };
};

/**
 * Create a payroll record for a staff member (Process Salary)
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
      baseSalary: Number(record.baseSalary),
      netSalary: Number(record.netSalary),
      amountPaid: Number(record.amountPaid),
    },
    message: response.data?.message || 'Salary payment processed successfully',
  };
};

/**
 * Update a payroll record
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
      baseSalary: Number(record.baseSalary),
      netSalary: Number(record.netSalary),
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
  const root = response.data?.data || response.data;
  const records = root?.records || root || [];

  return {
    success: true,
    data: {
      staff: root?.staff || { id: staffId, name: 'Staff Member', role: '' },
      records: records.map((r: any) => ({
        ...r,
        baseSalary: Number(r.baseSalary),
        netSalary: Number(r.netSalary),
        amountPaid: Number(r.amountPaid),
      })),
    },
    message: response.data?.message || 'Payroll history retrieved successfully',
  };
};

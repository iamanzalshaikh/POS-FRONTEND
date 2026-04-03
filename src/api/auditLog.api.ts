import api from '../service/api';

// ============================================================================
// TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  storeId: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditLogsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
  entity?: string;
  action?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch audit logs
 */
export const getAuditLogs = async (params?: AuditLogsParams): Promise<AuditLogsResponse> => {
  const response = await api.get<any>('/reports/audit-logs', { params });
  
  if (response.data?.data) {
    return response.data.data;
  }
  
  return { logs: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
};

/**
 * Fetch expense-related audit logs
 */
export const getExpenseAuditLogs = async (params?: AuditLogsParams): Promise<AuditLogsResponse> => {
  return getAuditLogs({
    ...params,
    entity: 'expenses',
  });
};

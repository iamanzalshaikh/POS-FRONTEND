import api from "./api";

export const getStoreDashboardData = (params?: { startDate: string; endDate: string }) => {
    return api.get("/reports/storeadmin/dashboard", { params }).then(res => res.data);
};

export const getInventoryReport = () => {
    return api.get("/reports/inventory").then(res => res.data);
};

export const getSalesReport = (params?: { startDate: string; endDate: string }) => {
    return api.get("/reports/sales", { params }).then(res => res.data);
};

export const getSuperAdminOverview = (params?: { startDate: string; endDate: string }) => {
    return api.get("/reports/superadmin/overview", { params }).then(res => res.data);
};

export const getAuditLogs = (params?: any) => {
    return api.get("/reports/audit-logs", { params }).then(res => res.data);
};

export const getCashierAuditLogs = (params?: any) => {
    return api.get("/reports/audit-logs/supermarket/cashier", { params }).then(res => res.data);
};

export const getFinanceAuditLogs = (params?: any) => {
    return api.get("/reports/audit-logs/supermarket/finance", { params }).then(res => res.data);
};

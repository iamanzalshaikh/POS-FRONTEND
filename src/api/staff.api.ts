import api from "./api";
import type { StaffMember, CreateStaffInput } from "../pages/store-admin/staff-management/types/staff.types";

export const fetchStaffMembers = () => {
    return api.get<StaffMember[]>("/users").then(res => res.data);
};

export const fetchStaffMemberById = (id: string) => {
    return api.get<StaffMember>(`/users/${id}`).then(res => res.data);
};

export const createStaffMember = (data: CreateStaffInput) => {
    const payload = {
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
        ...(data.role === "CASHIER" && { assignedTerminalIds: Array.isArray(data.assignedTerminalIds) ? data.assignedTerminalIds : [] }),
    };
    return api.post<StaffMember>("/users", payload).then(res => res.data);
};

export const updateStaffMember = (id: string, data: any) => {
    return api.patch<StaffMember>(`/users/${id}`, data).then(res => res.data);
};

export const deleteStaffMember = (id: string) => {
    return api.delete(`/users/${id}`).then(res => res.data);
};

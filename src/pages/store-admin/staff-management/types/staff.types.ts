// Backend UserRole enum: SUPER_ADMIN | STORE_ADMIN | CASHIER | ACCOUNTANT
export type StaffRole = "STORE_ADMIN" | "CASHIER" | "ACCOUNTANT";
export type StaffStatus = "active" | "inactive";

export interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: StaffRole;
    status: StaffStatus;
    lastLogin: string;
    lastLogout: string;
}

export interface StaffAuthActivity {
    action: string;
    at: string;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export interface CreateStaffInput {
    name: string;
    email: string;
    role: "CASHIER" | "ACCOUNTANT";
    password: string;
    assignedTerminalIds?: string[];
}

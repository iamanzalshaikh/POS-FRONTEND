// Backend UserRole enum: SUPER_ADMIN | STORE_ADMIN | CASHIER | ACCOUNTANT
export type StaffRole = "STORE_ADMIN" | "CASHIER" | "ACCOUNTANT";
export type StaffStatus = "active" | "inactive";

export interface AssignedTerminal {
    id: string;
    deviceName: string;
}

export interface StaffMember {
    id: string;
    displayId?: string | null;
    name: string;
    email: string;
    role: StaffRole;
    status: StaffStatus;
    lastLogin: string;
    lastLogout: string;
    assignedTerminals?: AssignedTerminal[];
    currentDevice?: { id: string; lastActiveAt: string } | null;
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
    assignedTerminalIds: string[];
}

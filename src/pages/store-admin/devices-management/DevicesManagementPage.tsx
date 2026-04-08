import { useEffect, useState } from "react"
import { getDeviceFingerprint } from "@/utils/fingerprint"
import Sidebar from '@/components/store-admin/Sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';

import DevicesHeader from "@/components/store-admin/DevicesHeader"
import AddTerminalModal from "@/components/store-admin/AddTerminalModal"
import DevicesFilters, { type StatusFilter, type ViewFilter } from "@/components/store-admin/DevicesFilters"
import DevicesTable from "@/components/store-admin/DevicesTable"
import DevicesPagination from "@/components/store-admin/DevicesPagination"
import StatsCards from "@/components/global-components/StatsCards"

import * as deviceApi from "@/api/devices.api";
import type { Device } from "./types/device.types"

export default function DevicesManagementPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [terminalModalOpen, setTerminalModalOpen] = useState(false)
    const [page, setPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
    const [viewFilter, setViewFilter] = useState<ViewFilter>("all")
    const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const limit = 10

    const [terminalsDataRes, setTerminalsDataRes] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const refetchTerminals = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await deviceApi.listTerminals();
            setTerminalsDataRes(data);
        } catch (err: any) {
            console.error("Failed to fetch terminals:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetchTerminals();
    }, []);

    useEffect(() => {
        if (viewFilter === "this_device") {
            getDeviceFingerprint().then(setCurrentFingerprint).catch(() => setCurrentFingerprint(null))
        } else {
            setCurrentFingerprint(null)
        }
    }, [viewFilter])

    const terminalsRaw = (terminalsDataRes as any)?.data || (Array.isArray(terminalsDataRes) ? terminalsDataRes : []);
    const terminals: Device[] = terminalsRaw.map((t: any) => ({
        id: t.id,
        name: t.deviceName || t.name,
        serialNumber: t.deviceFingerprint ? String(t.deviceFingerprint).slice(0, 16) + "…" : "—",
        type: "POS",
        status: t.isActive ? "online" : "offline",
        lastHeartbeat: t.lastActiveAt ? new Date(t.lastActiveAt).toLocaleString() : "Never",
        ipAddress: "—",
        scanner: "None",
        connectedTo: t.currentUser?.name || null,
        deviceFingerprint: t.deviceFingerprint || null
    }));

    const handleDelete = async (id: string): Promise<boolean> => {
        try {
            await deviceApi.updateDevice(id, { isActive: false });
            await refetchTerminals();
            return true
        } catch (error) {
            console.error("Failed to deactivate terminal:", error)
            return false
        }
    }

    const filtered = terminals.filter((t) => {
        const matchesView =
            viewFilter === "all" ||
            (viewFilter === "this_device" && currentFingerprint && t.deviceFingerprint === currentFingerprint)
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "online" && t.status === "online") ||
            (statusFilter === "offline" && t.status === "offline")
        const q = searchQuery.trim().toLowerCase()
        const matchesSearch =
            !q ||
            t.name.toLowerCase().includes(q) ||
            t.serialNumber.toLowerCase().includes(q)
        return matchesView && matchesStatus && matchesSearch
    })
    const paginated = filtered.slice((page - 1) * limit, page * limit)
    const total = filtered.length

    return (
        <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 transition-all duration-500">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
                <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 md:p-8 lg:p-10 w-full animate-fade-in space-y-10">
                    <DevicesHeader
                        onAddTerminal={() => setTerminalModalOpen(true)}
                        terminalCount={terminals.length}
                    />

                    <div className="mt-8">
                        <StatsCards data={[
                            { name: "Connected Hardware", stat: String(terminals.length), change: "+2", changeType: "positive" },
                            { name: "Online Devices", stat: String(terminals.filter((t: any) => t.status === 'online').length), change: "100%", changeType: "positive" },
                            { name: "Offline / Alerts", stat: String(terminals.filter((t: any) => t.status === 'offline').length), change: "0%", changeType: "negative" },
                            { name: "POS Terminals", stat: String(terminals.filter((t: any) => t.type === 'POS').length), change: "+1", changeType: "positive" },
                        ]} />
                    </div>

                    <AddTerminalModal
                        isOpen={terminalModalOpen}
                        onClose={() => setTerminalModalOpen(false)}
                        onSuccess={() => { refetchTerminals(); setTerminalModalOpen(false); }}
                    />

                    <DevicesFilters
                        statusFilter={statusFilter}
                        onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
                        viewFilter={viewFilter}
                        onViewFilterChange={(v) => { setViewFilter(v); setPage(1); }}
                        searchQuery={searchQuery}
                        onSearchQueryChange={(v) => { setSearchQuery(v); setPage(1); }}
                    />

            {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-24 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                    <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-6 uppercase tracking-[4px] animate-pulse leading-none">Scanning Hardware...</p>
                </div>
            ) : error ? (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-24 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                    <p className="text-[10px] font-black text-rose-500 mb-2 uppercase tracking-[4px]">Connection Failure</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{(error as any)?.message || 'Unable to reach the backend services.'}</p>
                    <button onClick={() => refetchTerminals()} className="mt-8 px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Retry Link</button>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    <DevicesTable data={paginated} onDelete={handleDelete} />
                    <DevicesPagination page={page} setPage={setPage} total={total} />
                </div>
            )}
        </div>
    )
}

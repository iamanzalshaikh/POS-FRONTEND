import { useEffect, useState } from "react"
import { getDeviceFingerprint } from "@/utils/fingerprint"
import DevicesHeader from "@/components/store-admin/DevicesHeader"
import AddTerminalModal from "@/components/store-admin/AddTerminalModal"
import MetricCard from "@/components/global-components/MetricCard";
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Monitor, Wifi, WifiOff, Trash2, Shield, User, Clock, Search, Link2, Laptop } from 'lucide-react';

import * as deviceApi from "@/api/devices.api";
import type { Device } from "./types/device.types"

export default function DevicesManagementPage() {
    const [terminalModalOpen, setTerminalModalOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [viewFilter, setViewFilter] = useState<string>("all")
    const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

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

    const columns: ColumnDef<Device>[] = [
        {
            header: "ID",
            cell: ({ row }) => (
                <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
                    {(row.index + 1).toString().padStart(2, '0')}
                </div>
            )
        },
        {
            header: "Device Name",
            accessorKey: "name",
            meta: { align: 'left' },
            cell: ({ row }) => {
                const device = row.original;
                const isThisDevice = currentFingerprint && device.deviceFingerprint === currentFingerprint;
                return (
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{device.name}</p>
                        {isThisDevice && (
                            <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-[4px] text-[8px] font-black uppercase tracking-widest">THIS</span>
                        )}
                    </div>
                );
            }
        },
        {
            header: "System Type",
            accessorKey: "type",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {row.original.type} SYSTEM
                </span>
            )
        },
        {
            header: "Hardware ID",
            accessorKey: "serialNumber",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <span className="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400">
                    {row.original.serialNumber}
                </span>
            )
        },
        {
            header: "User",
            accessorKey: "connectedTo",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                    {row.original.connectedTo || "Unassigned"}
                </span>
            )
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => {
                const isOnline = row.original.status === 'online';
                return (
                    <div className="flex justify-center">
                        <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[2px] border",
                            isOnline
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50"
                                : "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-900 dark:border-slate-800"
                        )}>
                            {row.original.status}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "Last Heartbeat",
            accessorKey: "lastHeartbeat",
            cell: ({ row }) => (
                <div className="text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums leading-none">
                        {row.original.lastHeartbeat}
                    </span>
                </div>
            )
        },
        {
            id: "actions",
            header: "Management",
            cell: ({ row }) => (
                <div className="flex justify-center items-center gap-2">
                    <button 
                        onClick={() => handleDelete(row.original.id)}
                        className="p-2.5 text-slate-300 dark:text-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-90 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 shadow-sm"
                        title="Deactivate Device"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="animate-fade-in space-y-10">
            <DevicesHeader
                onAddTerminal={() => setTerminalModalOpen(true)}
                terminalCount={terminals.length}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <MetricCard 
                    title="Hardware Hub" 
                    value={String(terminals.length)} 
                    icon={Monitor} 
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                />
                <MetricCard 
                    title="Online Terminals" 
                    value={String(terminals.filter((t: any) => t.status === 'online').length)} 
                    icon={Wifi} 
                    colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                />
                <MetricCard 
                    title="System Offline" 
                    value={String(terminals.filter((t: any) => t.status === 'offline').length)} 
                    icon={WifiOff} 
                    colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                />
                <MetricCard 
                    title="Active Registries" 
                    value={String(terminals.filter((t: any) => t.connectedTo).length)} 
                    icon={User} 
                    colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
                <DataTable 
                    columns={columns} 
                    data={filtered}
                    isLoading={loading}
                    onRefresh={refetchTerminals}
                    placeholder="Search equipment..."
                    headerActions={
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search serials, names..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                                />
                            </div>
                            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl h-10 px-2 text-muted-foreground">
                                {['all', 'online', 'offline'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setStatusFilter(f)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                            statusFilter === f
                                                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                                : "text-slate-400 hover:text-blue-600"
                                        )}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setViewFilter(viewFilter === 'all' ? 'this_device' : 'all')}
                                className={cn(
                                    "h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm",
                                    viewFilter === 'this_device'
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-600 hover:text-blue-600"
                                )}
                            >
                                <Link2 size={14} />
                                {viewFilter === 'this_device' ? 'Single Link' : 'All Links'}
                            </button>
                        </div>
                    }
                />
            </div>

            <AddTerminalModal
                isOpen={terminalModalOpen}
                onClose={() => setTerminalModalOpen(false)}
                onSuccess={() => { refetchTerminals(); setTerminalModalOpen(false); }}
            />
        </div>
    )
}
